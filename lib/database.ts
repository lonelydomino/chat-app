import mongoose from 'mongoose';

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