const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocket } = require('./server/socket.js')
const { connectMongoDB } = require('./lib/database.js')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

console.log('🚀 Simple Server startup initiated')
console.log(`📊 Environment: ${process.env.NODE_ENV}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌐 Hostname: ${hostname}`)

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  try {
    console.log('✅ Next.js app prepared successfully')
    console.log('🔌 Starting simple server...')
    console.log('🗄️ Connecting to databases...')
    
    await connectMongoDB()
    console.log('✅ MongoDB connected')

    // Create HTTP server that delegates everything to Next.js
    const server = createServer(async (req, res) => {
      try {
        console.log(`📨 Request: ${req.method} ${req.url}`)
        
        // Let Next.js handle ALL requests including API routes
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
        console.log(`✅ Request handled by Next.js: ${req.method} ${req.url}`)
      } catch (err) {
        console.error('❌ Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

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
      console.log(`🚀 Simple Server started successfully!`)
      console.log(`🌐 Listening on: http://0.0.0.0:${port}`)
      console.log(`🔗 Railway URL: https://chat-app-production-8492.up.railway.app`)
      console.log(`🔌 Socket.io server is running`)
      console.log(`📊 Environment: ${process.env.NODE_ENV}`)
      console.log(`🔑 Port: ${port}`)
      console.log(`🏥 Health check: http://0.0.0.0:${port}/api/health`)
      console.log(`🧪 Test endpoint: http://0.0.0.0:${port}/api/test`)
    })
  } catch (error) {
    console.error('❌ Failed to start simple server:', error)
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
