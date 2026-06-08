const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  const { name, email, password, role, mode, club_name, club_description, clubs = [] } = req.body
  const requestedClubs = Array.isArray(clubs) ? clubs.slice(0, 3) : []
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const client = await pool.connect()
    let user
    try {
      await client.query('BEGIN')
      const result = await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hashed, 'viewer']
      )
      user = result.rows[0]

      const memberships = []
      if (mode === 'create') {
        if (!club_name?.trim()) throw new Error('Club name is required')
        const clubResult = await client.query(
          'INSERT INTO clubs (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
          [club_name.trim(), club_description || null, user.id]
        )
        await client.query(
          'INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)',
          [clubResult.rows[0].id, user.id, 'admin']
        )
        memberships.push({ id: clubResult.rows[0].id, name: club_name.trim(), role: 'admin' })
        user.role = 'admin'
      } else {
        for (const club of requestedClubs) {
          if (!club.club_id) continue
          const clubRole = ['photographer', 'member', 'viewer'].includes(club.role) ? club.role : 'viewer'
          const membership = await client.query(
            `INSERT INTO club_members (club_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role
             RETURNING club_id`,
            [club.club_id, user.id, clubRole]
          )
          memberships.push({ id: membership.rows[0].club_id, role: clubRole })
        }
        user.role = requestedClubs[0]?.role || role || 'viewer'
      }
      user.clubs = memberships

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' })

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Invalid credentials' })

    const clubs = await pool.query(
      `SELECT c.id, c.name, cm.role
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.name ASC`,
      [user.id]
    )
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, clubs: clubs.rows } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getMe = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, avatar_url, selfie_url, created_at FROM users WHERE id = $1', [req.user.id])
    const clubs = await pool.query(
      `SELECT c.id, c.name, cm.role
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.name ASC`,
      [req.user.id]
    )
    res.json({ ...result.rows[0], clubs: clubs.rows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { register, login, getMe }
