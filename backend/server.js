const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
})

// Middlewares
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
  methods: ['GET', 'POST', 'PUT','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Make io accessible in routes
app.set('io', io)

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/events', require('./routes/events'))
app.use('/api/media', require('./routes/media'))
app.use('/api/social', require('./routes/social'))
app.use('/api/ai', require('./routes/ai'))

// Socket.io
require('./sockets/notificationSocket')(io)
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

// Health check
app.get('/', (req, res) => res.json({ message: 'Server is running' }))

const PORT = process.env.PORT || 8080
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`))