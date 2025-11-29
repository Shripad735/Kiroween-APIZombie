import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Middleware to ensure MongoDB connection is established before processing requests
 * This is critical for serverless environments where connections may not be ready
 */
export const ensureDBConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // If connecting, wait a bit
    if (mongoose.connection.readyState === 2) {
      logger.info('MongoDB connection in progress, waiting...');
      
      // Wait for connection with timeout
      const timeout = 5000; // 5 seconds
      const startTime = Date.now();
      
      while (mongoose.connection.readyState === 2) {
        if (Date.now() - startTime > timeout) {
          throw new Error('MongoDB connection timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (mongoose.connection.readyState === 1) {
        return next();
      }
    }

    // Not connected, try to connect
    logger.info('MongoDB not connected, attempting connection...');
    await connectDB();
    
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    throw new Error('Failed to establish MongoDB connection');
    
  } catch (error) {
    logger.error('Database connection middleware error:', error);
    
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is not available. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? error.message : null,
      },
      timestamp: new Date().toISOString(),
    });
  }
};
