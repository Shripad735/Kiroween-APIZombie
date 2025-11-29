import express from 'express';
import {
  uploadSpec,
  listSpecs,
  getSpecById,
  deleteSpec,
  introspectGraphQL,
} from '../controllers/specs.controller.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';
import { validateObjectId } from '../middleware/sanitization.middleware.js';

const router = express.Router();

// POST /api/specs/upload - Upload API specification
router.post('/upload', uploadLimiter, uploadSpec);

// POST /api/specs/introspect - Introspect GraphQL endpoint
router.post('/introspect', uploadLimiter, introspectGraphQL);

// GET /api/specs - List all specifications
router.get('/', listSpecs);

// GET /api/specs/:id - Get specification details
router.get('/:id', validateObjectId('id'), getSpecById);

// DELETE /api/specs/:id - Delete specification
router.delete('/:id', validateObjectId('id'), deleteSpec);

export default router;
