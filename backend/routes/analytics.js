const router = require('express').Router()
const pool = require('../config/db')
const auth = require('../middlewares/auth')

router.get('/', auth, async (req, res) => {
  const { club_id } = req.query
  const clubFilter = club_id ? `AND e.club_id = '${club_id}'` : ''
  const clubFilterDirect = club_id ? `AND club_id = '${club_id}'` : ''

  try {
    const [
      eventsRes,
      mediaRes,
      likesRes,
      commentsRes,
      membersRes,
      clubsRes,
      topEventsRes,
      mostLikedRes,
      recentUploadsRes
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM events e WHERE 1=1 ${clubFilterDirect}`),
      pool.query(`SELECT COUNT(*) FROM media m LEFT JOIN events e ON m.event_id = e.id WHERE 1=1 ${clubFilter}`),
      pool.query(`SELECT COUNT(*) FROM likes l LEFT JOIN media m ON l.media_id = m.id LEFT JOIN events e ON m.event_id = e.id WHERE 1=1 ${clubFilter}`),
      pool.query(`SELECT COUNT(*) FROM comments c LEFT JOIN media m ON c.media_id = m.id LEFT JOIN events e ON m.event_id = e.id WHERE 1=1 ${clubFilter}`),
      club_id
        ? pool.query(`SELECT COUNT(*) FROM club_members WHERE club_id = $1`, [club_id])
        : pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM clubs`),
      pool.query(`
        SELECT e.id, e.title, e.is_public, c.name as club_name,
        COUNT(m.id) as media_count
        FROM events e
        LEFT JOIN clubs c ON e.club_id = c.id
        LEFT JOIN media m ON m.event_id = e.id
        WHERE 1=1 ${clubFilterDirect}
        GROUP BY e.id, c.name
        ORDER BY media_count DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT m.id, m.url, m.thumbnail_url,
        COUNT(l.id) as like_count
        FROM media m
        LEFT JOIN likes l ON l.media_id = m.id
        LEFT JOIN events e ON m.event_id = e.id
        WHERE 1=1 ${clubFilter}
        GROUP BY m.id
        ORDER BY like_count DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT m.id, m.url, m.thumbnail_url, m.created_at,
        e.title as event_title, u.name as uploader_name
        FROM media m
        LEFT JOIN events e ON m.event_id = e.id
        LEFT JOIN users u ON m.uploaded_by = u.id
        WHERE 1=1 ${clubFilter}
        ORDER BY m.created_at DESC
        LIMIT 5
      `)
    ])

    res.json({
      total_events: parseInt(eventsRes.rows[0].count),
      total_media: parseInt(mediaRes.rows[0].count),
      total_likes: parseInt(likesRes.rows[0].count),
      total_comments: parseInt(commentsRes.rows[0].count),
      total_members: parseInt(membersRes.rows[0].count),
      total_clubs: parseInt(clubsRes.rows[0].count),
      top_events: topEventsRes.rows,
      most_liked: mostLikedRes.rows,
      recent_uploads: recentUploadsRes.rows
    })
  } catch (err) {
    console.error('Analytics error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router