const mongoose = require('mongoose');
const { createClient } = require('redis');

let redisClient = null;

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
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('Please make sure MongoDB is running on your system');
    console.error('You can start MongoDB with: mongod --dbpath ~/mongodb-data');
    throw error;
  }
}

async function connectRedis() {
  try {
    // Debug environment variables
    console.log('🔍 Redis environment check:');
    console.log('  - REDIS_URL exists:', !!process.env.REDIS_URL);
    console.log('  - REDIS_URL value:', process.env.REDIS_URL ? '***HIDDEN***' : 'NOT SET');
    
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('  - Using Redis URL:', url === 'redis://localhost:6379' ? 'localhost (fallback)' : 'external redis');
    
    redisClient = createClient({ url });
    
    // Connect to Redis
    await redisClient.connect();
    
    // Test the connection
    await redisClient.ping();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    console.error('Please make sure Redis is running on your system');
    console.error('You can start Redis with: redis-server');
    throw error;
  }
}

async function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

async function disconnectRedis() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    console.log('Redis disconnected');
  }
}

module.exports = {
  connectMongoDB,
  connectRedis,
  getRedisClient,
  disconnectRedis
}; 