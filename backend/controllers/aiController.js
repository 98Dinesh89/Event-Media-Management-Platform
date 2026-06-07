const pool = require('../config/db')
const cloudinary = require('../config/cloudinary')

const searchMedia = async (req, res) => {
  const { q, event_id, tag, from_date, to_date, uploader } = req.query
  try {
    let query = `
      SELECT m.*, u.name as uploader_name, e.title as event_title
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN events e ON m.event_id = e.id
      WHERE m.is_public = true
    `
    const params = []

    if (q) {
      params.push(`%${q}%`)
      query += ` AND (e.title ILIKE $${params.length} OR m.caption ILIKE $${params.length})`
    }
    if (event_id) {
      params.push(event_id)
      query += ` AND m.event_id = $${params.length}`
    }
    if (tag) {
      params.push(tag)
      query += ` AND $${params.length} = ANY(m.tags)`
    }
    if (from_date) {
      params.push(from_date)
      query += ` AND m.created_at >= $${params.length}`
    }
    if (to_date) {
      params.push(to_date)
      query += ` AND m.created_at <= $${params.length}`
    }
    if (uploader) {
      params.push(`%${uploader}%`)
      query += ` AND u.name ILIKE $${params.length}`
    }

    query += ' ORDER BY m.created_at DESC LIMIT 50'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const uploadSelfie = async (req, res) => {
  try {
    const selfieUrl = req.file.path
    await pool.query('UPDATE users SET selfie_url=$1 WHERE id=$2', [selfieUrl, req.user.id])
    res.json({ selfie_url: selfieUrl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const findMyPhotos = async (req, res) => {
  try {
    const userResult = await pool.query('SELECT selfie_url FROM users WHERE id=$1', [req.user.id])
    const selfieUrl = userResult.rows[0]?.selfie_url
    if (!selfieUrl) return res.status(400).json({ message: 'Please upload a selfie first' })

    const allMedia = await pool.query('SELECT * FROM media WHERE media_type = $1', ['image'])
    const matches = []

    for (const media of allMedia.rows) {
      try {
        const result = await cloudinary.uploader.upload(media.url, {
          detection: 'adv_face'
        })
        const selfieResult = await cloudinary.uploader.upload(selfieUrl, {
          detection: 'adv_face'
        })

        if (result.info?.detection?.adv_face?.data?.length > 0 &&
            selfieResult.info?.detection?.adv_face?.data?.length > 0) {
          matches.push(media)
          await pool.query(
            'INSERT INTO face_matches (user_id, media_id, confidence) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [req.user.id, media.id, 0.8]
          )
        }
      } catch (e) {
        continue
      }
    }
    res.json(matches)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getMyFaceMatches = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.* FROM face_matches fm
       JOIN media m ON fm.media_id = m.id
       WHERE fm.user_id = $1
       ORDER BY fm.created_at DESC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { searchMedia, uploadSelfie, findMyPhotos, getMyFaceMatches }