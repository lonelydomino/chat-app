const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { initializeSocket } = require('./server/socket')
const { connectMongoDB, connectRedis } = require('./lib/database')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  try {
    console.log('Connecting to databases...')
    // Connect to databases
    await connectMongoDB()
    console.log('MongoDB connected')
    await connectRedis()
    console.log('Redis connected')

    // Create HTTP server
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    // Initialize Socket.io
    console.log('Initializing Socket.io...')
    initializeSocket(server)
    console.log('Socket.io initialized')

    // Start server
    server.listen(port, (err) => {
      if (err) throw err
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.io server is running')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    console.error('Make sure MongoDB and Redis are running')
    process.exit(1)
  }
}) 