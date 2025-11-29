/**
 * Standard success response formatter
 */
export const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Standard error response formatter
 */
export const errorResponse = (code, message, details = null, suggestions = []) => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      suggestions,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Pagination helper
 */
export const paginateResponse = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};
