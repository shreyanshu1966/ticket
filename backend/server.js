import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
// import helmet from 'helmet'
import connectDB from './config/database.js'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import initializeAdminSettings from './init-admin-settings.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
// app.use(helmet()) - Removed as per request

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://acd.acesmitadt.com',
  'https://api.acesmitadt.com'
]

// Add custom origins from environment variable
if (process.env.CORS_ORIGIN) {
  const customOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  allowedOrigins.push(...customOrigins)
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log(`⚠️ CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}

app.use(cors(corsOptions))

// Handle preflight requests explicitly
app.options('*', cors(corsOptions))

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  const start = Date.now()

  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`)

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`)
  })

  next()
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Routes
app.use(routes)

// Error handling middleware
app.use(errorHandler)

// Handle 404
app.use('*', notFoundHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  process.exit(0)
})

// Connect to MongoDB and start server
connectDB().then(async () => {
  // Initialize admin settings
  await initializeAdminSettings()
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`)
    console.log(`🔒 Security features enabled: CORS`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}).catch((error) => {
  console.error('❌ Failed to connect to database:', error)
  process.exit(1)
})

export default app