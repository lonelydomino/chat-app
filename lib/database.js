const mongoose = require('mongoose');

async function connectMongoDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return; // Already connected
    }
    
    // Debug environment variables
    console.log('🔍 Environment check:');
    console.log('  - MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('  - MONGODB_URI value:', process.env.MONGODB_URI ? '***HIDDEN***' : 'NOT SET');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
    console.log('  - Using URI:', uri === 'mongodb://localhost:27017/chat-app' ? 'localhost (fallback)' : 'external database');
    
    await mongoose.connect(uri);
    
    // Log connection details
    const db = mongoose.connection.db;
    const dbName = db?.databaseName || 'unknown';
    const host = mongoose.connection.host || 'unknown';
    const port = mongoose.connection.port || 'unknown';
    
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database Details:');
    console.log('  - Database Name:', dbName);
    console.log('  - Host:', host);
    console.log('  - Port:', port);
    console.log('  - Connection Type:', uri.includes('mongodb+srv://') ? 'MongoDB Atlas (Cloud)' : uri.includes('localhost') ? 'Local MongoDB' : 'External MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('Please make sure MongoDB is running on your system');
    console.error('You can start MongoDB with: mongod --dbpath ~/mongodb-data');
    throw error;
  }
}

// Redis functions removed - using MongoDB only for persistent storage
// These are kept as no-ops for backward compatibility with old server files
async function connectRedis() {
  console.log('ℹ️  Redis is no longer used - user status is stored in MongoDB');
}

async function getRedisClient() {
  throw new Error('Redis is no longer used. User status is stored directly in MongoDB.');
}

async function disconnectRedis() {
  // No-op
}

module.exports = {
  connectMongoDB,
  connectRedis,
  getRedisClient,
  disconnectRedis
}; 