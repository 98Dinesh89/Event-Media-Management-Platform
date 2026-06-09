const pool = require('../config/db')
const { normalizeRole } = require('../utils/clubPermissions')

const getClubs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.description, u.name as created_by_name,
       COUNT(cm.user_id) as member_count
       FROM clubs c
       LEFT JOIN users u ON c.created_by = u.id
       LEFT JOIN club_members cm ON cm.club_id = c.id
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getMyClubs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.description, cm.role
       FROM club_members cm
       JOIN clubs c ON cm.club_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.name ASC`,
      [req.user.id]
    )
    res.json(result.rows.map(row => ({ ...row, role: normalizeRole(row.role) })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const joinClub = async (req, res) => {
  const { club_id, role } = req.body
  try {
    const validRoles = ['viewer', 'member', 'photographer']
    const safeRole = validRoles.includes(role) ? role : 'viewer'

    const clubCheck = await pool.query('SELECT id FROM clubs WHERE id=$1', [club_id])
    if (clubCheck.rows.length === 0) return res.status(404).json({ message: 'Club not found' })

    await pool.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (club_id, user_id) DO UPDATE SET role=$3',
      [club_id, req.user.id, safeRole]
    )
    res.json({ message: 'Joined club successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const createClub = async (req, res) => {
  const { name, description } = req.body
  try {
    const club = await pool.query(
      'INSERT INTO clubs (name, description, created_by) VALUES ($1,$2,$3) RETURNING *',
      [name, description, req.user.id]
    )
    await pool.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES ($1,$2,$3)',
      [club.rows[0].id, req.user.id, 'admin']
    )
    res.status(201).json(club.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { getClubs, getMyClubs, joinClub, createClub }
