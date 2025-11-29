import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache the database connection in serverless environments
let cachedConnection = null;
let isConnecting = false;

const connectDB = async () => {
  // In serverless environments, reuse existing connections
  if (mongoose.connection.readyState === 1) {
    console.log('♻️  Using existing MongoDB connection');
    return mongoose.connection;
  }

  // If already connecting, wait for it
  if (isConnecting) {
    console.log('⏳ MongoDB connection in progress, waiting...');
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (isConnecting && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    }
  }

  isConnecting = true;

  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds for serverless cold starts
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Limit connection pool
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
    });

    cachedConnection = conn;
    isConnecting = false;
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`Connection string format: ${process.env.MONGODB_URI ? 'Present' : 'Missing'}`);
    
    // In serverless environments (Vercel), throw the error to be handled by middleware
    if (process.env.VERCEL === '1') {
      throw error;
    } else {
      // In traditional environments, exit on connection failure
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
  cachedConnection = null;
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err}`);
});

export default connectDB;
