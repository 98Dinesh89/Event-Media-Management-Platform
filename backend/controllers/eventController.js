const pool = require('../config/db')
const { getClubRole, normalizeRole } = require('../utils/clubPermissions')

const createEvent = async (req, res) => {
  const { title, description, category, event_date, is_public, club_id } = req.body
  try {
    if (!club_id) return res.status(400).json({ message: 'Please choose a club for this event' })
    const userRole = await getClubRole(req.user.id, club_id)
    if (!['admin', 'photographer'].includes(userRole)) {
      return res.status(403).json({ message: 'Only club admins and photographers can create events' })
    }

    const result = await pool.query(
      'INSERT INTO events (title, description, category, event_date, is_public, created_by, club_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, description, category, event_date, is_public ?? true, req.user.id, club_id]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getAllEvents = async (req, res) => {
  const { sort, category } = req.query
  const userId = req.user?.id || null

  let query = `
    SELECT e.*, u.name as creator_name, c.name as club_name,
    COALESCE(cm.role, 'viewer') as user_role,
    COUNT(m.id) as media_count
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    LEFT JOIN clubs c ON e.club_id = c.id
    LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $1
    LEFT JOIN media m ON m.event_id = e.id
    WHERE (
      e.is_public = true 
      OR e.created_by = $1 
      OR cm.role = 'admin'
      OR cm.role = 'member'
    )
  `
  const params = [userId]

  if (category) {
    params.push(category)
    query += ` AND e.category = $${params.length}`
  }

  query += ' GROUP BY e.id, u.name, c.name, cm.role'

  if (sort === 'date') query += ' ORDER BY e.event_date DESC'
  else if (sort === 'name') query += ' ORDER BY e.title ASC'
  else query += ' ORDER BY e.created_at DESC'

  try {
    const result = await pool.query(query, params)
    res.json(result.rows.map(row => ({ ...row, user_role: normalizeRole(row.user_role) })))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getEventById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as creator_name, c.name as club_name,
       COALESCE(cm.role, 'viewer') as user_role
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN clubs c ON e.club_id = c.id
       LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $2
       WHERE e.id = $1`,
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Event not found' })
    const event = { ...result.rows[0], user_role: normalizeRole(result.rows[0].user_role) }
    const canView = event.is_public || event.created_by === req.user.id || event.user_role === 'admin' || event.user_role === 'member'
    if (!canView) return res.status(403).json({ message: 'Access denied' })
    res.json(event)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const updateEvent = async (req, res) => {
  const { title, description, category, event_date, is_public } = req.body
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id])
    if (eventResult.rows.length === 0) return res.status(404).json({ message: 'Event not found' })
    const event = eventResult.rows[0]
    const userRole = await getClubRole(req.user.id, event.club_id)
    if (userRole !== 'admin' && !(userRole === 'photographer' && event.created_by === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const result = await pool.query(
      'UPDATE events SET title=$1, description=$2, category=$3, event_date=$4, is_public=$5 WHERE id=$6 RETURNING *',
      [title, description, category, event_date, is_public, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Event not found or unauthorized' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteEvent = async (req, res) => {
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id=$1', [req.params.id])
    if (eventResult.rows.length === 0) return res.status(404).json({ message: 'Event not found' })
    const event = eventResult.rows[0]
    const userRole = await getClubRole(req.user.id, event.club_id)
    if (userRole !== 'admin' && !(userRole === 'photographer' && event.created_by === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' })
    }
    await pool.query('DELETE FROM events WHERE id=$1', [req.params.id])
    res.json({ message: 'Event deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent }
