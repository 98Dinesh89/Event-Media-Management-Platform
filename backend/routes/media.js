const router = require('express').Router()
const { uploadMedia, getMediaByEvent, getMediaById, deleteMedia, downloadMedia } = require('../controllers/mediaController')
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')

router.get('/event/:eventId', auth, getMediaByEvent)
router.get('/:id', auth, getMediaById)
router.post('/upload', auth, upload.array('files', 50), uploadMedia)
router.delete('/:id', auth, deleteMedia)
router.get('/download/:id', auth, downloadMedia)

module.exports = router
