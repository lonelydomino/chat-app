import mongoose from 'mongoose';
import Redis from 'redis';

// MongoDB Connection
let mongoConnection: typeof mongoose | null = null;

export async function connectMongoDB() {
  if (mongoConnection) {
    return mongoConnection;
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
    mongoConnection = await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    return mongoConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Please make sure MongoDB is running on your system');
    console.error('You can start MongoDB with: mongod');
    throw error;
  }
}

// Redis Connection
let redisClient: Redis.RedisClientType | null = null;

export async function connectRedis() {
  if (redisClient) {
    return redisClient;
  }

  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = Redis.createClient({ url });
    await redisClient.connect();
    console.log('Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    console.error('Please make sure Redis is running on your system');
    console.error('You can start Redis with: redis-server');
    throw error;
  }
}

export async function getRedisClient() {
  if (!redisClient) {
    await connectRedis();
  }
  return redisClient!;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
} 