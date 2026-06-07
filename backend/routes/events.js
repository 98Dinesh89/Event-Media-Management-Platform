const router = require('express').Router()
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController')
const auth = require('../middlewares/auth')
const roles = require('../middlewares/roles')

router.get('/', auth, getAllEvents)
router.get('/:id', auth, getEventById)
router.post('/', auth, roles('admin', 'photographer', 'member'), createEvent)
router.put('/:id', auth, roles('admin', 'photographer', 'member'), updateEvent)
router.delete('/:id', auth, roles('admin', 'photographer'), deleteEvent)

module.exports = router