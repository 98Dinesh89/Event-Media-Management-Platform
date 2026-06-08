const pool = require('../config/db')

const createEvent = async (req, res) => {
  const { title, description, category, event_date, is_public } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO events (title, description, category, event_date, is_public, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [title, description, category, event_date, is_public ?? true, req.user.id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getAllEvents = async (req, res) => {
  const { sort, category } = req.query
  let query = `
    SELECT e.*, u.name as creator_name,
    COUNT(m.id) as media_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN media m ON m.event_id = e.id
    WHERE (e.is_public = true OR e.created_by = $1 OR $2 = 'admin')
  `
  const params = [req.user?.id || null, req.user?.role || 'viewer']

  if (category) {
    params.push(category)
    query += ` AND e.category = $${params.length}`
  }

  query += ' GROUP BY e.id, u.name'

  if (sort === 'date') query += ' ORDER BY e.event_date DESC'
  else if (sort === 'name') query += ' ORDER BY e.title ASC'
  else query += ' ORDER BY e.created_at DESC'

  try {
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getEventById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as creator_name FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Event not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateEvent = async (req, res) => {
  const { title, description, category, event_date, is_public } = req.body
  try {
    const result = await pool.query(
      'UPDATE events SET title=$1, description=$2, category=$3, event_date=$4, is_public=$5 WHERE id=$6 AND created_by=$7 RETURNING *',
      [title, description, category, event_date, is_public, req.params.id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Event not found or unauthorized' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteEvent = async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id=$1 AND created_by=$2', [req.params.id, req.user.id])
    res.json({ message: 'Event deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent }