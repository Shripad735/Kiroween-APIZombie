// Test server wrapper for integration tests
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from '../../src/config/database.js';
import { sanitizeInput } from '../../src/middleware/sanitization.middleware.js';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.middleware.js';

// Import routes
import specsRoutes from '../../src/routes/specs.routes.js';
import nlRoutes from '../../src/routes/nl.routes.js';
import executeRoutes from '../../src/routes/execute.routes.js';
import translateRoutes from '../../src/routes/translate.routes.js';
import testsRoutes from '../../src/routes/tests.routes.js';
import savedRoutes from '../../src/routes/saved.routes.js';
import historyRoutes from '../../src/routes/history.routes.js';
import analyticsRoutes from '../../src/routes/analytics.routes.js';
import authRoutes from '../../src/routes/auth.routes.js';
import validationRoutes from '../../src/routes/validation.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Test server running' });
});

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

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
