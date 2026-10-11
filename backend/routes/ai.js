const router = require('express').Router()
const { searchMedia } = require('../controllers/aiController')

router.get('/search', searchMedia)

module.exports = router
