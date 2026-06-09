const router = require('express').Router()
const { getClubs, getMyClubs, joinClub, createClub } = require('../controllers/clubController')
const auth = require('../middlewares/auth')

router.get('/', getClubs)
router.get('/mine', auth, getMyClubs)
router.post('/join', auth, joinClub)
router.post('/create', auth, createClub)

module.exports = router
