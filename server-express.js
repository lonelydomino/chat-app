const express = require('express')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocket } = require('./server/socket.js')
const { connectMongoDB, connectRedis } = require('./lib/database.js')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

console.log('🚀 Express Server startup initiated')
console.log(`📊 Environment: ${process.env.NODE_ENV}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌐 Hostname: ${hostname}`)

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  try {
    console.log('✅ Next.js app prepared successfully')
    console.log('🔌 Starting Express server...')
    console.log('🗄️ Connecting to databases...')
    
    await connectMongoDB()
    console.log('✅ MongoDB connected')
    
    await connectRedis()
    console.log('✅ Redis connected')

    // Create Express app
    const expressApp = express()
    
    // Add health check endpoint
    expressApp.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        message: 'Express server is running successfully!'
      })
    })

    // Add a simple test endpoint
    expressApp.get('/api/test', (req, res) => {
      res.json({
        message: 'Express server is working!',
        timestamp: new Date().toISOString()
      })
    })

    // Handle all other requests with Next.js
    expressApp.all('*', async (req, res) => {
      try {
        console.log(`📨 Request: ${req.method} ${req.url}`)
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
        console.log(`✅ Request handled: ${req.method} ${req.url}`)
      } catch (err) {
        console.error('❌ Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    // Create HTTP server
    const server = createServer(expressApp)

    // Initialize Socket.io
    console.log('🔌 Initializing Socket.io...')
    try {
      initializeSocket(server)
      console.log('✅ Socket.io initialized')
    } catch (error) {
      console.error('❌ Socket.io initialization failed:', error)
      throw error
    }

    // Start server
    server.listen(port, '0.0.0.0', (err) => {
      if (err) {
        console.error('❌ Server failed to start:', err)
        throw err
      }
      console.log(`🚀 Express Server started successfully!`)
      console.log(`🌐 Listening on: http://0.0.0.0:${port}`)
      console.log(`🔗 Railway URL: https://chat-app-production-8492.up.railway.app`)
      console.log(`🔌 Socket.io server is running`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🔑 Port: ${port}`)
      console.log(`🏥 Health check: http://0.0.0.0:${port}/api/health`)
      console.log(`🧪 Test endpoint: http://0.0.0.0:${port}/api/test`)
    })
  } catch (error) {
    console.error('❌ Failed to start Express server:', error)
    console.error('❌ Make sure MongoDB and Redis are running')
    process.exit(1)
  }
}).catch((error) => {
  console.error('❌ Failed to prepare Next.js app:', error)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
