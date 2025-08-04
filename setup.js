#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Setting up Real-time Chat Application...\n')

// Check if Node.js version is compatible
const nodeVersion = process.version
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required')
  console.error(`Current version: ${nodeVersion}`)
  process.exit(1)
}

console.log('✅ Node.js version check passed')

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found. Make sure you are in the project directory.')
  process.exit(1)
}

// Install dependencies
console.log('\n📦 Installing dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Dependencies installed successfully')
} catch (error) {
  console.error('❌ Failed to install dependencies')
  process.exit(1)
}

// Create .env.local if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('\n🔧 Creating environment file...')
  const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/chat-app
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Server
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here
`
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Environment file created (.env.local)')
  console.log('⚠️  Please update the environment variables with your own values')
} else {
  console.log('✅ Environment file already exists')
}

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
  console.log('✅ Uploads directory created')
} else {
  console.log('✅ Uploads directory already exists')
}

console.log('\n🎉 Setup completed successfully!')
console.log('\n📋 Next steps:')
console.log('1. Make sure MongoDB is running on your system')
console.log('2. Make sure Redis is running on your system')
console.log('3. Update the environment variables in .env.local')
console.log('4. Run "npm run dev" to start the development server')
console.log('5. Open http://localhost:3000 in your browser')
console.log('\n📚 For more information, check the README.md file') 