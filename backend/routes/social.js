const router = require('express').Router()
const { toggleLike, addComment, getComments, toggleFavourite, getFavourites, getNotifications, markNotificationsRead } = require('../controllers/socialController')
const auth = require('../middlewares/auth')


router.get('/favourites', auth, getFavourites)
router.post('/like', auth, toggleLike)
router.post('/comment', auth, addComment)
router.get('/comments/:mediaId', auth, getComments)
router.post('/favourite', auth, toggleFavourite)
router.get('/notifications', auth, getNotifications)
router.put('/notifications/read', auth, markNotificationsRead)

module.exports = router