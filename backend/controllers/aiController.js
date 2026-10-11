const pool = require('../config/db')

const searchMedia = async (req, res) => {
  const { q, event_id, tag, from_date, to_date, uploader } = req.query
  try {
    let query = `
      SELECT m.*, u.name as uploader_name, e.title as event_title
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN events e ON m.event_id = e.id
      WHERE m.is_public = true AND e.is_public = true
    `
    const params = []
    if (q) { params.push(`%${q}%`); query += ` AND (e.title ILIKE $${params.length} OR m.caption ILIKE $${params.length})` }
    if (event_id) { params.push(event_id); query += ` AND m.event_id = $${params.length}` }
    if (tag) { params.push(tag); query += ` AND $${params.length} = ANY(m.tags)` }
    if (from_date) { params.push(from_date); query += ` AND m.created_at >= $${params.length}` }
    if (to_date) { params.push(to_date); query += ` AND m.created_at <= $${params.length}` }
    if (uploader) { params.push(`%${uploader}%`); query += ` AND u.name ILIKE $${params.length}` }
    if (req.query.club_id) {
      params.push(req.query.club_id)
      query += ` AND e.club_id = $${params.length}`
    }
    query += ' ORDER BY m.created_at DESC LIMIT 50'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { searchMedia }
