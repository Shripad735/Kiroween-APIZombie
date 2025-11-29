import express from 'express';
import {
  saveRequest,
  getSavedRequests,
  saveWorkflow,
  getSavedWorkflows,
  exportSavedItems,
  importSavedItems,
} from '../controllers/saved.controller.js';

const router = express.Router();

// POST /api/saved/requests - Save an API request
router.post('/requests', saveRequest);

// GET /api/saved/requests - Get saved requests with search and filter
router.get('/requests', getSavedRequests);

// POST /api/saved/workflows - Save a workflow
router.post('/workflows', saveWorkflow);

// GET /api/saved/workflows - Get saved workflows with search and filter
router.get('/workflows', getSavedWorkflows);

// POST /api/saved/export - Export saved items to JSON
router.post('/export', exportSavedItems);

// POST /api/saved/import - Import saved items from JSON
router.post('/import', importSavedItems);

export default router;
