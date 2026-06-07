const pool = require('../config/db')

const toggleLike = async (req, res) => {
  const { media_id } = req.body
  try {
    const existing = await pool.query('SELECT * FROM likes WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
      return res.json({ liked: false })
    }
    await pool.query('INSERT INTO likes (user_id, media_id) VALUES ($1,$2)', [req.user.id, media_id])

    // Notify media owner
    const media = await pool.query('SELECT uploaded_by FROM media WHERE id=$1', [media_id])
    if (media.rows[0].uploaded_by !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, media_id, message) VALUES ($1,$2,$3,$4,$5)',
        [media.rows[0].uploaded_by, req.user.id, 'like', media_id, 'liked your photo']
      )
      const io = req.app.get('io')
      io.to(media.rows[0].uploaded_by).emit('notification', { type: 'like', media_id })
    }
    res.json({ liked: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const addComment = async (req, res) => {
  const { media_id, text } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, media_id, text) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, media_id, text]
    )
    const media = await pool.query('SELECT uploaded_by FROM media WHERE id=$1', [media_id])
    if (media.rows[0].uploaded_by !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, media_id, message) VALUES ($1,$2,$3,$4,$5)',
        [media.rows[0].uploaded_by, req.user.id, 'comment', media_id, 'commented on your photo']
      )
      const io = req.app.get('io')
      io.to(media.rows[0].uploaded_by).emit('notification', { type: 'comment', media_id })
    }
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getComments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name, u.avatar_url FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.media_id = $1 ORDER BY c.created_at ASC`,
      [req.params.mediaId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const toggleFavourite = async (req, res) => {
  const { media_id } = req.body
  console.log('Toggle favourite - user:', req.user.id, 'media:', media_id)
  try {
    const existing = await pool.query('SELECT * FROM favourites WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
    console.log('Existing favourite:', existing.rows.length)
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favourites WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
      return res.json({ favourited: false })
    }
    await pool.query('INSERT INTO favourites (user_id, media_id) VALUES ($1,$2)', [req.user.id, media_id])
    console.log('Favourite saved!')
    res.json({ favourited: true })
  } catch (err) {
    console.error('Favourite error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name as from_name, u.avatar_url as from_avatar
       FROM notifications n
       LEFT JOIN users u ON n.from_user_id = u.id
       WHERE n.user_id = $1 ORDER BY n.created_at DESC LIMIT 20`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const markNotificationsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id])
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getFavourites = async (req, res) => {
  try {
    console.log('Getting favourites for user:', req.user.id)
    const result = await pool.query(
      `SELECT m.* FROM favourites f
       JOIN media m ON f.media_id = m.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    )
    console.log('Favourites found:', result.rows.length)
    res.json(result.rows)
  } catch (err) {
    console.error('Favourites error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

module.exports = { toggleLike, addComment, getComments, toggleFavourite, getFavourites, getNotifications, markNotificationsRead }