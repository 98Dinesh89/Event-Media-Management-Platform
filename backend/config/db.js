const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message)
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message)
  } else {
    console.log('Database connected successfully')
    release()
  }
})

module.exports = pool