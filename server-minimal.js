const http = require('http')

const port = process.env.PORT || 3000

console.log('🚀 Minimal Server Starting...')
console.log(`📊 Environment: ${process.env.NODE_ENV || 'undefined'}`)
console.log(`🔌 Port: ${port}`)
console.log(`🌍 Process ID: ${process.pid}`)

const server = http.createServer((req, res) => {
  console.log(`📨 Request: ${req.method} ${req.url}`)
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(`
      <html>
        <head><title>Minimal Test Server</title></head>
        <body>
          <h1>🚀 Minimal Server is Working!</h1>
          <p>Environment: ${process.env.NODE_ENV || 'undefined'}</p>
          <p>Port: ${port}</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Process ID: ${process.pid}</p>
          <hr>
          <h2>Test Endpoints:</h2>
          <ul>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/test">/api/test</a></li>
            <li><a href="/env">/env</a> (environment variables)</li>
          </ul>
        </body>
      </html>
    `)
  } else if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      port: port,
      pid: process.pid,
      message: 'Minimal server is running!'
    }))
  } else if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      message: 'Test endpoint working!',
      timestamp: new Date().toISOString(),
      server: 'minimal'
    }))
  } else if (req.url === '/env') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    }
    res.end(JSON.stringify(envVars, null, 2))
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Minimal server listening on port ${port}`)
  console.log(`🌐 Access: http://0.0.0.0:${port}`)
  console.log(`🔗 Railway URL: https://chat-app-production-8492.up.railway.app`)
})

server.on('error', (err) => {
  console.error('❌ Server error:', err)
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})
