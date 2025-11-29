import express from 'express';
import {
  saveAuthConfig,
  getAuthConfig,
  updateAuthConfig,
  deleteAuthConfig,
} from '../controllers/auth.controller.js';

const router = express.Router();

// POST /api/auth/config - Save authentication configuration
router.post('/config', saveAuthConfig);

// GET /api/auth/config/:apiId - Get authentication configuration by API spec ID
router.get('/config/:apiId', getAuthConfig);

// PUT /api/auth/config/:apiId - Update authentication configuration
router.put('/config/:apiId', updateAuthConfig);

// DELETE /api/auth/config/:apiId - Delete authentication configuration
router.delete('/config/:apiId', deleteAuthConfig);

export default router;
