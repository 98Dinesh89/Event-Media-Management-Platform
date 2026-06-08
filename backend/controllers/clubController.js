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

module.exports = { getClubs, getMyClubs }
