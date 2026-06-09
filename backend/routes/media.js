const router = require('express').Router()
const { uploadMedia, getMediaByEvent, getMediaById, deleteMedia, downloadMedia } = require('../controllers/mediaController')
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')

router.get('/event/:eventId', auth, getMediaByEvent)
router.get('/:id', auth, getMediaById)
router.post('/upload', auth, upload.array('files', 50), uploadMedia)
router.delete('/:id', auth, deleteMedia)
router.get('/download/:id', auth, downloadMedia)
router.get('/my-count', auth, async (req, res) => {
  const { club_id } = req.query
  try {
    let query = `SELECT COUNT(*) FROM media m 
                 LEFT JOIN events e ON m.event_id = e.id
                 WHERE m.uploaded_by = $1`
    const params = [req.user.id]
    if (club_id) {
      params.push(club_id)
      query += ` AND e.club_id = $${params.length}`
    }
    const result = await pool.query(query, params)
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
