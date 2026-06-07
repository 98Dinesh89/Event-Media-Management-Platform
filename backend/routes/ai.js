const router = require('express').Router()
const { searchMedia, uploadSelfie, findMyPhotos, getMyFaceMatches } = require('../controllers/aiController')
const auth = require('../middlewares/auth')
const upload = require('../middlewares/upload')

router.get('/search', searchMedia)
router.post('/selfie', auth, upload.single('selfie'), uploadSelfie)
router.post('/find-me', auth, findMyPhotos)
router.get('/my-photos', auth, getMyFaceMatches)

module.exports = router