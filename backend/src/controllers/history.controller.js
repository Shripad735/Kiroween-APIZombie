import RequestHistory from '../models/RequestHistory.js';

/**
 * Get request history with filtering
 * GET /api/history
 * Query params: startDate, endDate, apiSpecId, statusCode, protocol, success, page, limit
 */
export const getHistory = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      apiSpecId,
      statusCode,
      protocol,
      success,
      page = 1,
      limit = 50,
      userId = 'default-user',
    } = req.query;

    // Build query
    const query = { userId };

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // API spec filter
    if (apiSpecId) {
      query.apiSpecId = apiSpecId;
    }

    // Status code filter
    if (statusCode) {
      query['response.statusCode'] = parseInt(statusCode);
    }

    // Protocol filter
    if (protocol) {
      query['request.protocol'] = protocol;
    }

    // Success filter
    if (success !== undefined) {
      query.success = success === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await RequestHistory.countDocuments(query);

    // Execute query
    const history = await RequestHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('apiSpecId', 'name type')
      .populate('workflowId', 'name');

    res.json({
      success: true,
      data: history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_HISTORY_FAILED',
        message: 'Failed to fetch request history',
        details: error.message,
      },
    });
  }
};

/**
 * Clear request history
 * DELETE /api/history
 * Query params: userId, olderThan (optional - ISO date string)
 */
export const clearHistory = async (req, res) => {
  try {
    const { userId = 'default-user', olderThan } = req.query;

    const query = { userId };

    // If olderThan is provided, only delete history older than that date
    if (olderThan) {
      query.timestamp = { $lt: new Date(olderThan) };
    }

    const result = await RequestHistory.deleteMany(query);

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount,
      },
      message: `Successfully deleted ${result.deletedCount} history entries`,
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEAR_HISTORY_FAILED',
        message: 'Failed to clear history',
        details: error.message,
      },
    });
  }
};

/**
 * Get a single history entry by ID
 * GET /api/history/:id
 */
export const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const historyEntry = await RequestHistory.findById(id)
      .populate('apiSpecId', 'name type')
      .populate('workflowId', 'name');

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'HISTORY_NOT_FOUND',
          message: 'History entry not found',
        },
      });
    }

    res.json({
      success: true,
      data: historyEntry,
    });
  } catch (error) {
    console.error('Error fetching history entry:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_HISTORY_ENTRY_FAILED',
        message: 'Failed to fetch history entry',
        details: error.message,
      },
    });
  }
};
