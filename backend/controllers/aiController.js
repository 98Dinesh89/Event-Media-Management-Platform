const pool = require('../config/db')
const cloudinary = require('../config/cloudinary')
const axios = require('axios')
const FormData = require('form-data')

const LUXAND_API = 'https://api.luxand.cloud'
const LUXAND_TOKEN = process.env.LUXAND_API_KEY

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
    if (q) { params.push(`%${q}%`); query += ` AND (e.title ILIKE $${params.length} OR m.caption ILIKE $${params.length})` }
    if (event_id) { params.push(event_id); query += ` AND m.event_id = $${params.length}` }
    if (tag) { params.push(tag); query += ` AND $${params.length} = ANY(m.tags)` }
    if (from_date) { params.push(from_date); query += ` AND m.created_at >= $${params.length}` }
    if (to_date) { params.push(to_date); query += ` AND m.created_at <= $${params.length}` }
    if (uploader) { params.push(`%${uploader}%`); query += ` AND u.name ILIKE $${params.length}` }
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
    console.error('Selfie upload error:', err.message)
    res.status(500).json({ message: err.message })
  }
}

const findMyPhotos = async (req, res) => {
  try {
    const userResult = await pool.query('SELECT selfie_url FROM users WHERE id=$1', [req.user.id])
    const selfieUrl = userResult.rows[0]?.selfie_url
    if (!selfieUrl) return res.status(400).json({ message: 'Please upload a selfie first' })

    const selfieBuffer = Buffer.from(
      (await axios.get(selfieUrl, { responseType: 'arraybuffer' })).data
    )

    const allMedia = await pool.query(
      `SELECT * FROM media WHERE media_type = 'image' LIMIT 30`
    )

    const matches = []

    for (const media of allMedia.rows) {
      try {
        const photoBuffer = Buffer.from(
          (await axios.get(media.url, { responseType: 'arraybuffer' })).data
        )

        const formData = new FormData()
        formData.append('photo1', selfieBuffer, { filename: 'selfie.jpg', contentType: 'image/jpeg' })
        formData.append('photo2', photoBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' })

        const response = await axios.post(
          `${LUXAND_API}/photo/verify`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'token': LUXAND_TOKEN
            }
          }
        )

        console.log(`Media ${media.id} verify result:`, response.data)

        if (response.data?.status === 'success' && response.data?.probability > 0.7) {
          matches.push(media)
          await pool.query(
            `INSERT INTO face_matches (user_id, media_id, confidence)
             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
            [req.user.id, media.id, response.data.probability]
          )
        }
      } catch (e) {
        console.error('Verify error:', e.response?.data || e.message)
        continue
      }
    }

    res.json(matches)
  } catch (err) {
    console.error('Find photos error:', err.message)
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