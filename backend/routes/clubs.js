const router = require('express').Router()
const { getClubs, getMyClubs } = require('../controllers/clubController')
const auth = require('../middlewares/auth')

router.get('/', getClubs)
router.get('/mine', auth, getMyClubs)

module.exports = router
