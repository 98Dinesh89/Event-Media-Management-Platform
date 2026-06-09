const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      if (!origin) return callback(null, true)
      if (
        origin.includes('vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST']
  }
})

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true)
    if (
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.set('io', io)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/clubs', require('./routes/clubs'))
app.use('/api/events', require('./routes/events'))
app.use('/api/media', require('./routes/media'))
app.use('/api/social', require('./routes/social'))
app.use('/api/ai', require('./routes/ai'))
app.use('/api/analytics', require('./routes/analytics'))

require('./sockets/notificationSocket')(io)

app.get('/', (req, res) => res.json({ message: 'Server is running' }))

const PORT = process.env.PORT || 8080
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`))
