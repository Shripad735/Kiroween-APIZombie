import RequestHistory from '../models/RequestHistory.js';

/**
 * Get analytics data
 * GET /api/analytics
 * Query params: startDate, endDate, groupBy (daily, weekly, monthly), userId
 */
export const getAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'daily',
      userId = 'default-user',
    } = req.query;

    // Build date range query
    const query = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Calculate success rate
    const totalRequests = await RequestHistory.countDocuments(query);
    const successfulRequests = await RequestHistory.countDocuments({
      ...query,
      success: true,
    });
    const successRate = totalRequests > 0 
      ? (successfulRequests / totalRequests) * 100 
      : 0;

    // Calculate average response time
    const avgResponseTimeResult = await RequestHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);
    const averageResponseTime = avgResponseTimeResult.length > 0 
      ? avgResponseTimeResult[0].avgDuration 
      : 0;

    // Get most-used endpoints
    const mostUsedEndpoints = await RequestHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            endpoint: '$request.endpoint',
            method: '$request.method',
            protocol: '$request.protocol',
          },
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          successRate: {
            $avg: { $cond: ['$success', 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          endpoint: '$_id.endpoint',
          method: '$_id.method',
          protocol: '$_id.protocol',
          count: 1,
          avgDuration: { $round: ['$avgDuration', 2] },
          successRate: { $multiply: ['$successRate', 100] },
        },
      },
    ]);

    // Time-based grouping
    let timeSeriesData = [];
    
    if (groupBy === 'daily') {
      timeSeriesData = await RequestHistory.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
            },
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: ['$success', 1, 0] },
            },
            avgDuration: { $avg: '$duration' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
            },
            totalRequests: 1,
            successfulRequests: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulRequests', '$totalRequests'] },
                100,
              ],
            },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
      ]);
    } else if (groupBy === 'weekly') {
      timeSeriesData = await RequestHistory.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              week: { $week: '$timestamp' },
            },
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: ['$success', 1, 0] },
            },
            avgDuration: { $avg: '$duration' },
          },
        },
        { $sort: { '_id.year': 1, '_id.week': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            week: '$_id.week',
            totalRequests: 1,
            successfulRequests: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulRequests', '$totalRequests'] },
                100,
              ],
            },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
      ]);
    } else if (groupBy === 'monthly') {
      timeSeriesData = await RequestHistory.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
            },
            totalRequests: { $sum: 1 },
            successfulRequests: {
              $sum: { $cond: ['$success', 1, 0] },
            },
            avgDuration: { $avg: '$duration' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            date: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
              },
            },
            totalRequests: 1,
            successfulRequests: 1,
            successRate: {
              $multiply: [
                { $divide: ['$successfulRequests', '$totalRequests'] },
                100,
              ],
            },
            avgDuration: { $round: ['$avgDuration', 2] },
          },
        },
      ]);
    }

    // Protocol breakdown
    const protocolBreakdown = await RequestHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$request.protocol',
          count: { $sum: 1 },
          successRate: {
            $avg: { $cond: ['$success', 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          protocol: '$_id',
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$count', totalRequests] },
              100,
            ],
          },
          successRate: { $multiply: ['$successRate', 100] },
        },
      },
    ]);

    // Status code distribution
    const statusCodeDistribution = await RequestHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$response.statusCode',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          statusCode: '$_id',
          count: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests: totalRequests - successfulRequests,
          successRate: Math.round(successRate * 100) / 100,
          averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        },
        mostUsedEndpoints,
        timeSeriesData,
        protocolBreakdown,
        statusCodeDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ANALYTICS_FAILED',
        message: 'Failed to fetch analytics data',
        details: error.message,
      },
    });
  }
};
