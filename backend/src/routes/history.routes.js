import express from 'express';
import {
  getHistory,
  clearHistory,
  getHistoryById,
} from '../controllers/history.controller.js';

const router = express.Router();

// GET /api/history - Get request history with filtering
router.get('/', getHistory);

// GET /api/history/:id - Get a single history entry
router.get('/:id', getHistoryById);

// DELETE /api/history - Clear history
router.delete('/', clearHistory);

export default router;
