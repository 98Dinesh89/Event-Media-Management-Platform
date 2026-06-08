const pool = require('../config/db')
const { getEventAccess } = require('../utils/clubPermissions')

const getMediaAccess = async (userId, mediaId) => {
  const media = await pool.query('SELECT * FROM media WHERE id=$1', [mediaId])
  if (media.rows.length === 0) return { media: null, access: null }
  const access = await getEventAccess(userId, media.rows[0].event_id)
  return { media: media.rows[0], access }
}

const toggleLike = async (req, res) => {
  const { media_id } = req.body
  try {
    const { media, access } = await getMediaAccess(req.user.id, media_id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    if (!access?.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })

    const existing = await pool.query('SELECT * FROM likes WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id=$1 AND media_id=$2', [req.user.id, media_id])
      return res.json({ liked: false })
    }
    await pool.query('INSERT INTO likes (user_id, media_id) VALUES ($1,$2)', [req.user.id, media_id])

    // Notify media owner
    if (media.uploaded_by !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, media_id, message) VALUES ($1,$2,$3,$4,$5)',
        [media.uploaded_by, req.user.id, 'like', media_id, 'liked your photo']
      )
      const io = req.app.get('io')
      io.to(media.uploaded_by).emit('notification', { type: 'like', media_id })
    }
    res.json({ liked: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const addComment = async (req, res) => {
  const { media_id, text } = req.body
  try {
    const { media, access } = await getMediaAccess(req.user.id, media_id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    if (!access?.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })

    const result = await pool.query(
      'INSERT INTO comments (user_id, media_id, text) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, media_id, text]
    )
    if (media.uploaded_by !== req.user.id) {
      await pool.query(
        'INSERT INTO notifications (user_id, from_user_id, type, media_id, message) VALUES ($1,$2,$3,$4,$5)',
        [media.uploaded_by, req.user.id, 'comment', media_id, 'commented on your photo']
      )
      const io = req.app.get('io')
      io.to(media.uploaded_by).emit('notification', { type: 'comment', media_id })
    }
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getComments = async (req, res) => {
  try {
    const { media, access } = await getMediaAccess(req.user.id, req.params.mediaId)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    if (!access?.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })

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
    const { media, access } = await getMediaAccess(req.user.id, media_id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    if (!access?.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })

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
       JOIN events e ON m.event_id = e.id
       LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $1
       WHERE f.user_id = $1
       AND (
         (m.is_public = true AND e.is_public = true)
         OR m.uploaded_by = $1
         OR cm.role = 'admin'
         OR cm.role = 'member'
         OR (cm.role = 'photographer' AND e.created_by = $1)
       )
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

const tagUser = async (req, res) => {
  const { media_id, tagged_user_id } = req.body
  try {
    const { media, access } = await getMediaAccess(req.user.id, media_id)
    if (!media) return res.status(404).json({ message: 'Media not found' })
    if (!access?.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })

    // Check user exists
    const userCheck = await pool.query('SELECT id, name FROM users WHERE id = $1', [tagged_user_id])
    if (userCheck.rows.length === 0) return res.status(404).json({ message: 'User not found' })

    await pool.query(
      'INSERT INTO media_tags (media_id, tagged_by, tagged_user_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [media_id, req.user.id, tagged_user_id]
    )

    // Notify tagged user
    await pool.query(
      'INSERT INTO notifications (user_id, from_user_id, type, media_id, message) VALUES ($1,$2,$3,$4,$5)',
      [tagged_user_id, req.user.id, 'tag', media_id, 'tagged you in a photo']
    )
    const io = req.app.get('io')
    io.to(tagged_user_id).emit('notification', { type: 'tag', media_id })

    res.json({ message: 'User tagged' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const searchUsers = async (req, res) => {
  const { q } = req.query
  try {
    const result = await pool.query(
      'SELECT id, name, role FROM users WHERE name ILIKE $1 LIMIT 5',
      [`%${q}%`]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { toggleLike, addComment, getComments, toggleFavourite, getFavourites, getNotifications, markNotificationsRead, tagUser, searchUsers }
