const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const register = async (req, res) => {
  const { name, email, password, role } = req.body
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashed, role || 'viewer']
    )
    const user = result.rows[0]
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

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getMe = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, avatar_url, selfie_url, created_at FROM users WHERE id = $1', [req.user.id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { register, login, getMe }