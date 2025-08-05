const mongoose = require('mongoose');
const Redis = require('ioredis');

let redisClient = null;

async function connectMongoDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
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
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(url);
    
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
    await redisClient.quit();
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