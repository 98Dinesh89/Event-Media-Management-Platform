const router = require('express').Router()
const { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } = require('../controllers/eventController')
const auth = require('../middlewares/auth')

router.get('/', auth, getAllEvents)
router.get('/:id', auth, getEventById)
router.post('/', auth, createEvent)
router.put('/:id', auth, updateEvent)
router.delete('/:id', auth, deleteEvent)

module.exports = router
