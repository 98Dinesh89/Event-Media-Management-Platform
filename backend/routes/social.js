const router = require('express').Router()
const { toggleLike, addComment, getComments, toggleFavourite, getFavourites, getNotifications, markNotificationsRead, tagUser, searchUsers } = require('../controllers/socialController')
const auth = require('../middlewares/auth')

router.post('/tag', auth, tagUser)
router.get('/search-users', auth, searchUsers)
router.get('/favourites', auth, getFavourites)
router.post('/like', auth, toggleLike)
router.post('/comment', auth, addComment)
router.get('/comments/:mediaId', auth, getComments)
router.post('/favourite', auth, toggleFavourite)
router.get('/notifications', auth, getNotifications)
router.put('/notifications/read', auth, markNotificationsRead)

module.exports = router