#!/usr/bin/env node

console.log('🚀 Railway Build Test Script')
console.log('============================')

// Check Node.js version
console.log(`📊 Node.js version: ${process.version}`)
console.log(`🌍 Platform: ${process.platform}`)
console.log(`🏗️ Architecture: ${process.arch}`)

// Check environment variables
console.log('\n🔑 Environment Variables:')
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`)
console.log(`PORT: ${process.env.PORT || 'undefined'}`)
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`)
console.log(`REDIS_URL: ${process.env.REDIS_URL ? 'SET' : 'NOT SET'}`)
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`)

// Check if core packages can be required
console.log('\n📦 Package Availability:')
try {
  require('next')
  console.log('✅ Next.js: Available')
} catch (e) {
  console.log('❌ Next.js: Not available')
}

try {
  require('mongoose')
  console.log('✅ Mongoose: Available')
} catch (e) {
  console.log('❌ Mongoose: Not available')
}

try {
  require('redis')
  console.log('✅ Redis: Available')
} catch (e) {
  console.log('❌ Redis: Not available')
}

// Check if .next directory exists
const fs = require('fs')
const path = require('path')

console.log('\n📁 Build Directory Check:')
const nextDir = path.join(process.cwd(), '.next')
if (fs.existsSync(nextDir)) {
  console.log('✅ .next directory: Exists')
  
  // Check if server.js exists in .next
  const serverPath = path.join(nextDir, 'server.js')
  if (fs.existsSync(serverPath)) {
    console.log('✅ .next/server.js: Exists')
  } else {
    console.log('❌ .next/server.js: Missing')
  }
} else {
  console.log('❌ .next directory: Missing')
}

console.log('\n�� Test completed!')
