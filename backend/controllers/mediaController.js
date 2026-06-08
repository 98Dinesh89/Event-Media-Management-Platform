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
          image_metadata: true,
          colors: true,
          faces: true
        })
        // Use Cloudinary colors as pseudo-tags
        if (resource.colors) {
          const dominantColors = resource.colors.slice(0, 3).map(c => c[0])
          tags = dominantColors
        }
        if (resource.faces && resource.faces.length > 0) {
          tags.push('people')
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
       WHERE m.event_id = $1 AND (m.is_public = true OR m.uploaded_by = $2)
       GROUP BY m.id, u.name
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.params.eventId, userId, limit, offset]
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
      `SELECT m.*, e.title as event_title, u.role as uploader_role
       FROM media m 
       LEFT JOIN events e ON m.event_id = e.id
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE m.id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' })

    const media = result.rows[0]
    const axios = require('axios')
    const sharp = require('sharp')

    const response = await axios.get(media.url, { responseType: 'arraybuffer' })
    const imageBuffer = Buffer.from(response.data)

    const imageInfo = await sharp(imageBuffer).metadata()
    const width = imageInfo.width || 800

    const watermarkText = `${media.event_title || 'MediaVault'} | mediavault.app`
    const fontSize = Math.max(16, Math.floor(width / 40))
    const padding = 10

    const svgWatermark = Buffer.from(`
      <svg width="${width}" height="${fontSize + padding * 2}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${fontSize + padding * 2}" fill="rgba(0,0,0,0.55)"/>
        <text 
          x="${padding}" 
          y="${fontSize + padding + 4}" 
          font-size="${fontSize}px" 
          fill="white"
          font-family="sans-serif"
        >${watermarkText}</text>
      </svg>
    `)

    const watermarkedImage = await sharp(imageBuffer)
      .composite([{
        input: svgWatermark,
        gravity: 'south'
      }])
      .jpeg({ quality: 90 })
      .toBuffer()

    res.set('Content-Disposition', `attachment; filename="mediavault-${media.event_title || 'photo'}.jpg"`)
    res.set('Content-Type', 'image/jpeg')
    res.send(watermarkedImage)
  } catch (err) {
    console.error('Download error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

module.exports = { uploadMedia, getMediaByEvent, getMediaById, deleteMedia, downloadMedia }