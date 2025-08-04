#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🔍 Troubleshooting Chat Application...\n')

// Check Node.js version
console.log('1. Checking Node.js version...')
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
if (majorVersion >= 18) {
  console.log('✅ Node.js version:', nodeVersion)
} else {
  console.log('❌ Node.js version too old:', nodeVersion)
  console.log('   Please upgrade to Node.js 18 or higher')
  process.exit(1)
}

// Check if dependencies are installed
console.log('\n2. Checking dependencies...')
if (!fs.existsSync('node_modules')) {
  console.log('❌ Dependencies not installed')
  console.log('   Run: npm install')
  process.exit(1)
} else {
  console.log('✅ Dependencies installed')
}

// Check environment file
console.log('\n3. Checking environment file...')
if (!fs.existsSync('.env.local')) {
  console.log('⚠️  .env.local not found')
  console.log('   Run: npm run setup')
} else {
  console.log('✅ Environment file exists')
}

// Check MongoDB
console.log('\n4. Checking MongoDB...')
try {
  execSync('mongod --version', { stdio: 'pipe' })
  console.log('✅ MongoDB is installed')
  
  // Try to connect to MongoDB
  try {
    execSync('mongosh --eval "db.runCommand({ping: 1})"', { stdio: 'pipe', timeout: 5000 })
    console.log('✅ MongoDB is running')
  } catch (error) {
    console.log('❌ MongoDB is not running')
    console.log('   Start MongoDB with: mongod')
  }
} catch (error) {
  console.log('❌ MongoDB is not installed')
  console.log('   Install MongoDB from: https://docs.mongodb.com/manual/installation/')
}

// Check Redis
console.log('\n5. Checking Redis...')
try {
  execSync('redis-server --version', { stdio: 'pipe' })
  console.log('✅ Redis is installed')
  
  // Try to connect to Redis
  try {
    execSync('redis-cli ping', { stdio: 'pipe', timeout: 5000 })
    console.log('✅ Redis is running')
  } catch (error) {
    console.log('❌ Redis is not running')
    console.log('   Start Redis with: redis-server')
  }
} catch (error) {
  console.log('❌ Redis is not installed')
  console.log('   Install Redis from: https://redis.io/download')
}

console.log('\n📋 Quick fixes:')
console.log('1. If MongoDB is not running: mongod')
console.log('2. If Redis is not running: redis-server')
console.log('3. If dependencies missing: npm install')
console.log('4. If environment missing: npm run setup')
console.log('5. Start the app: npm run dev')

console.log('\n🔧 If you still have issues:')
console.log('1. Check the console for error messages')
console.log('2. Make sure ports 3000, 27017, and 6379 are available')
console.log('3. Try running: npm run dev')
console.log('4. Open http://localhost:3000 in your browser') 