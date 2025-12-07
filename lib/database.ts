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
    
    return mongoConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Please make sure MongoDB is running on your system');
    console.error('You can start MongoDB with: mongod');
    throw error;
  }
} 