const pool = require('../config/db')
const cloudinary = require('../config/cloudinary')
const { getEventAccess } = require('../utils/clubPermissions')

const uploadMedia = async (req, res) => {
  const { event_id, caption, is_public } = req.body
  try {
    const access = await getEventAccess(req.user.id, event_id)
    if (!access) return res.status(404).json({ message: 'Event not found' })
    if (!access.canView || !access.canUpload) {
      return res.status(403).json({ message: 'Only club admins and event photographers can upload media here' })
    }

    const files = req.files || [req.file]
    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' })

    const results = []
    for (const file of files) {
      let tags = []
      try {
        const resource = await cloudinary.api.resource(file.filename, {
          faces: true,
          image_metadata: true
        })
        if (resource.faces && resource.faces.length > 0) tags.push('people')
        if (resource.image_metadata) {
          const { PixelXDimension: w, PixelYDimension: h } = resource.image_metadata
          if (w && h) tags.push(w > h ? 'landscape' : 'portrait')
        }
      } catch (e) {
        tags = []
      }

      const result = await pool.query(
        `INSERT INTO media (event_id, uploaded_by, url, thumbnail_url, public_id, media_type, tags, caption, is_public)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [
          event_id,
          req.user.id,
          file.path,
          file.path.replace('/upload/', '/upload/w_400,h_300,c_fill/'),
          file.filename,
          file.mimetype?.startsWith('video') ? 'video' : 'image',
          tags,
          caption || null,
          is_public ?? true
        ]
      )
      results.push(result.rows[0])
    }
    res.status(201).json(results)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ message: err.message })
  }
}

const getMediaByEvent = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const offset = (page - 1) * limit
  const userId = req.user?.id || null

  try {
    const access = await getEventAccess(userId, req.params.eventId)
    if (!access) return res.status(404).json({ message: 'Event not found' })
    if (!access.canView) return res.status(403).json({ message: 'Access denied' })

    const result = await pool.query(
      `SELECT m.*, u.name as uploader_name,
       COUNT(DISTINCT l.id) as like_count,
       MAX(CASE WHEN l2.user_id = $2 THEN 1 ELSE 0 END) = 1 as user_liked,
       MAX(CASE WHEN f.user_id = $2 THEN 1 ELSE 0 END) = 1 as user_favourited,
       $5::text as user_role
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       LEFT JOIN likes l ON l.media_id = m.id
       LEFT JOIN likes l2 ON l2.media_id = m.id AND l2.user_id = $2
       LEFT JOIN favourites f ON f.media_id = m.id AND f.user_id = $2
       WHERE m.event_id = $1 
       AND (
         m.is_public = true 
         OR m.uploaded_by = $2
         OR $5 = 'admin'
         OR $5 = 'member'
         OR ($5 = 'photographer' AND $6 = true)
       )
       GROUP BY m.id, u.name
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.params.eventId, userId, limit, offset, access.role, access.event.created_by === userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('getMediaByEvent error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

const getMediaById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.name as uploader_name, e.club_id, e.is_public as event_is_public
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       LEFT JOIN events e ON m.event_id = e.id
       WHERE m.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Media not found' })
    const media = result.rows[0]
    const access = await getEventAccess(req.user.id, media.event_id)
    if (!access || !access.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })
    res.json({ ...media, user_role: access.role })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteMedia = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM media WHERE id=$1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Media not found' })

    const media = result.rows[0]
    const access = await getEventAccess(req.user.id, media.event_id)
    if (!access || !access.canDeleteMedia(media)) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    await cloudinary.uploader.destroy(media.public_id)
    await pool.query('DELETE FROM media WHERE id=$1', [req.params.id])
    res.json({ message: 'Media deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const downloadMedia = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, e.title as event_title, e.club_id, c.name as club_name,
       COALESCE(cm.role, 'viewer') as downloader_role, u.name as downloader_name
       FROM media m 
       LEFT JOIN events e ON m.event_id = e.id
       LEFT JOIN clubs c ON e.club_id = c.id
       LEFT JOIN club_members cm ON cm.club_id = e.club_id AND cm.user_id = $2
       LEFT JOIN users u ON u.id = $2
       WHERE m.id = $1`,
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' })

    const media = result.rows[0]
    const access = await getEventAccess(req.user.id, media.event_id)
    if (!access || !access.canView || !access.canViewMedia(media)) return res.status(403).json({ message: 'Access denied' })
    const axios = require('axios')

    const clubName = media.club_name || 'MediaVault'
    const eventName = media.event_title || 'Event'
    const userRole = media.downloader_role || 'viewer'
    const watermarkText = `${clubName} | ${eventName} | ${userRole}`

    const watermarkedUrl = media.url.replace(
      '/upload/',
      `/upload/l_text:Arial_20_bold:${encodeURIComponent(watermarkText)},co_white,o_70,g_south,y_10,b_rgb:000000,bo_10px_solid_rgb:000000/`
    )

    const response = await axios.get(watermarkedUrl, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(response.data)

    res.set('Content-Disposition', `attachment; filename="${clubName}-${eventName}.jpg"`)
    res.set('Content-Type', 'image/jpeg')
    res.send(imageBuffer)
  } catch (err) {
    console.error('Download error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

module.exports = { uploadMedia, getMediaByEvent, getMediaById, deleteMedia, downloadMedia }
