import express from 'express';
import {
  generateTests,
  runTests,
  getTestSuite,
  listTestSuites,
  deleteTestSuite,
} from '../controllers/tests.controller.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateGroqApiKey } from '../middleware/apiKey.middleware.js';
import { validateObjectId } from '../middleware/sanitization.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/tests/generate
 * @desc    Generate test suite for an API endpoint
 * @access  Public (TODO: Add authentication)
 */
router.post('/generate', aiLimiter, validateGroqApiKey, generateTests);

/**
 * @route   POST /api/tests/run
 * @desc    Run test suite
 * @access  Public (TODO: Add authentication)
 */
router.post('/run', runTests);

/**
 * @route   GET /api/tests
 * @desc    List all test suites
 * @access  Public (TODO: Add authentication)
 */
router.get('/', listTestSuites);

/**
 * @route   GET /api/tests/:id
 * @desc    Get test suite by ID
 * @access  Public (TODO: Add authentication)
 */
router.get('/:id', validateObjectId('id'), getTestSuite);

/**
 * @route   DELETE /api/tests/:id
 * @desc    Delete test suite
 * @access  Public (TODO: Add authentication)
 */
router.delete('/:id', validateObjectId('id'), deleteTestSuite);

export default router;
