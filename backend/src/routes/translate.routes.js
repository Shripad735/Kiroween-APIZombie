import express from 'express';
import { translate } from '../controllers/translate.controller.js';
import { aiLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateGroqApiKey } from '../middleware/apiKey.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/translate
 * @desc    Translate API request between protocols (REST, GraphQL, gRPC)
 * @access  Public
 */
router.post('/', aiLimiter, validateGroqApiKey, translate);

export default router;
