import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Cache the database connection in serverless environments
let cachedConnection = null;

const connectDB = async () => {
  // In serverless environments, reuse existing connections
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // In serverless environments (Vercel), don't exit the process
    if (process.env.VERCEL === '1') {
      console.error('Failed to connect to MongoDB in serverless environment');
      // Don't throw - let the app start and handle DB errors per request
      return null;
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
