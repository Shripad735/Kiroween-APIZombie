import express from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = express.Router();

/**
 * @route   GET /api/analytics
 * @desc    Get analytics data with time-based grouping
 * @query   startDate, endDate, groupBy (daily/weekly/monthly), userId
 * @access  Public (should be protected in production)
 */
router.get('/', getAnalytics);

export default router;
