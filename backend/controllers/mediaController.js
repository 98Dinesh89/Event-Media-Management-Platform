const pool = require('../config/db')
const cloudinary = require('../config/cloudinary')

const uploadMedia = async (req, res) => {
  const { event_id, caption, is_public } = req.body
  try {
    const files = req.files || [req.file]
    if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' })

    const results = []
    for (const file of files) {
      let tags = []
      try {
        const resource = await cloudinary.api.resource(file.filename, {
          tags: true,
          categorization: 'google_tagging'
        })
        if (resource.info?.categorization?.google_tagging?.data) {
          tags = resource.info.categorization.google_tagging.data
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 6)
            .map(t => t.tag)
        }
        if (tags.length === 0) {
          const faceResult = await cloudinary.api.resource(file.filename, {
            faces: true,
            image_metadata: true
          })
          if (faceResult.faces && faceResult.faces.length > 0) tags.push('people')
          if (faceResult.image_metadata) {
            const { PixelXDimension: w, PixelYDimension: h } = faceResult.image_metadata
            if (w && h) tags.push(w > h ? 'landscape' : 'portrait')
          }
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
  const userRole = req.user?.role || 'viewer'

  try {
    const result = await pool.query(
      `SELECT m.*, u.name as uploader_name,
       COUNT(DISTINCT l.id) as like_count,
       MAX(CASE WHEN l2.user_id = $2 THEN 1 ELSE 0 END) = 1 as user_liked,
       MAX(CASE WHEN f.user_id = $2 THEN 1 ELSE 0 END) = 1 as user_favourited
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       LEFT JOIN likes l ON l.media_id = m.id
       LEFT JOIN likes l2 ON l2.media_id = m.id AND l2.user_id = $2
       LEFT JOIN favourites f ON f.media_id = m.id AND f.user_id = $2
       WHERE m.event_id = $1 
       AND (
         m.is_public = true 
         OR m.uploaded_by = $2 
         OR $3 = 'admin'
         OR $3 = 'member'
       )
       GROUP BY m.id, u.name
       ORDER BY m.created_at DESC
       LIMIT $4 OFFSET $5`,
      [req.params.eventId, userId, userRole, limit, offset]
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
      `SELECT m.*, u.name as uploader_name FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Media not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const deleteMedia = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM media WHERE id=$1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Media not found' })

    const media = result.rows[0]
    if (media.uploaded_by !== req.user.id && req.user.role !== 'admin') {
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
      `SELECT m.*, e.title as event_title, u.role as downloader_role, u.name as downloader_name
       FROM media m 
       LEFT JOIN events e ON m.event_id = e.id
       LEFT JOIN users u ON u.id = $2
       WHERE m.id = $1`,
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' })

    const media = result.rows[0]
    const axios = require('axios')

    const clubName = 'MediaVault'
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