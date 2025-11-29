import express from 'express';
import { parseNL, improveNL } from '../controllers/nl.controller.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateGroqApiKey } from '../middleware/apiKey.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/nl/parse
 * @desc    Parse natural language input to API request
 * @access  Public
 */
router.post('/parse', aiLimiter, validateGroqApiKey, parseNL);

/**
 * @route   POST /api/nl/improve
 * @desc    Parse natural language with historical context
 * @access  Public
 */
router.post('/improve', aiLimiter, validateGroqApiKey, improveNL);

export default router;
