import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { sanitizeInput } from './middleware/sanitization.middleware.js';
import { generalLimiter, aiLimiter, uploadLimiter } from './middleware/rateLimiter.middleware.js';
import { 
  errorHandler, 
  notFoundHandler 
} from './middleware/errorHandler.middleware.js';
import { 
  requestLogger, 
  performanceMonitor, 
  errorLogger 
} from './middleware/requestLogger.middleware.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (async, non-blocking in serverless)
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Security Middleware
// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// 2. CORS - Configure allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000',
  'http://localhost:3001',
];

// In production, only allow specified origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests) only in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, strictly check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request from origin', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// 3. Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Request logging
app.use(requestLogger);

// 5. Performance monitoring (optional, only in development or when needed)
if (process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
  app.use(performanceMonitor);
}

// 6. Input sanitization
app.use(sanitizeInput);

// 7. General rate limiting for all API routes
app.use('/api/', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'APIZombie Backend is running! 🧟',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Import routes
import specsRoutes from './routes/specs.routes.js';
import nlRoutes from './routes/nl.routes.js';
import executeRoutes from './routes/execute.routes.js';
import translateRoutes from './routes/translate.routes.js';
import testsRoutes from './routes/tests.routes.js';
import savedRoutes from './routes/saved.routes.js';
import historyRoutes from './routes/history.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import authRoutes from './routes/auth.routes.js';
import validationRoutes from './routes/validation.routes.js';

// API Routes
app.use('/api/specs', specsRoutes);
app.use('/api/nl', nlRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/validate', validationRoutes);

// Error logging middleware (must be before error handler)
app.use(errorLogger);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    logger.info('APIZombie Backend started', {
      port: PORT,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    });
    console.log(`🚀 APIZombie Backend running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason,
      promise: promise,
    });
    // In production, you might want to exit the process
    // process.exit(1);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
    // Exit the process as the application is in an undefined state
    process.exit(1);
  });
}

export default app;
