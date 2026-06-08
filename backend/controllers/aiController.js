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

    const response = await axios.post(
      `${LUXAND_API}/v2/person`,
      new URLSearchParams({
        name: req.user.id,
        store: '1',
        collections: ''
      }),
      {
        headers: { 'token': LUXAND_TOKEN },
        params: {},
      }
    )
    
    // Need to add photo separately via multipart
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('name', req.user.id)
    formData.append('store', '1')
    formData.append('collections', '')
    formData.append('photos', selfieUrl)

    const enrollResponse = await axios.post(
      `${LUXAND_API}/v2/person`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'token': LUXAND_TOKEN
        }
      }
    )

    console.log('Enroll response:', enrollResponse.data)
    const luxandUUID = enrollResponse.data?.uuid

    await pool.query(
      'UPDATE users SET selfie_url=$1, selfie_public_id=$2 WHERE id=$3',
      [selfieUrl, luxandUUID, req.user.id]
    )

    res.json({ selfie_url: selfieUrl, uuid: luxandUUID })
  } catch (err) {
    console.error('Selfie error full:', err.response?.data || err.message)
    res.status(500).json({ message: err.response?.data?.message || err.message })
  }
}

const findMyPhotos = async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT selfie_url, selfie_public_id FROM users WHERE id=$1',
      [req.user.id]
    )
    const { selfie_url: selfieUrl, selfie_public_id: luxandUUID } = userResult.rows[0] || {}

    if (!selfieUrl) return res.status(400).json({ message: 'Please upload a selfie first' })
    if (!luxandUUID) return res.status(400).json({ message: 'Please re-upload your selfie' })

    // Only scan images NOT already checked for this user
    const alreadyChecked = await pool.query(
      'SELECT media_id FROM face_matches WHERE user_id=$1',
      [req.user.id]
    )
    const checkedIds = alreadyChecked.rows.map(r => r.media_id)

    const allMedia = await pool.query(
      `SELECT * FROM media WHERE media_type = 'image' 
       ${checkedIds.length > 0 ? `AND id != ALL($1::uuid[])` : ''}
       LIMIT 20`,
      checkedIds.length > 0 ? [checkedIds] : []
    )

    console.log(`Scanning ${allMedia.rows.length} new images`)

    const matches = []
    for (const media of allMedia.rows) {
      try {
        const FormData = require('form-data')
        const formData = new FormData()
        formData.append('photo', media.url)

        const response = await axios.post(
          `${LUXAND_API}/photo/verify/${luxandUUID}`,
          formData,
          { headers: { ...formData.getHeaders(), 'token': LUXAND_TOKEN } }
        )

        // Always save to face_matches (even failures) so we don't rescan
        await pool.query(
          `INSERT INTO face_matches (user_id, media_id, confidence)
           VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
          [req.user.id, media.id, response.data?.probability || 0]
        )

        if (response.data?.status === 'success' && response.data?.probability > 0.7) {
          matches.push(media)
        }
      } catch (e) {
        console.error('Verify error:', e.response?.data || e.message)
        continue
      }
    }

    // Return all previously matched photos too
    const previousMatches = await pool.query(
      `SELECT m.* FROM face_matches fm
       JOIN media m ON fm.media_id = m.id
       WHERE fm.user_id = $1 AND fm.confidence > 0.7`,
      [req.user.id]
    )

    res.json([...matches, ...previousMatches.rows])
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