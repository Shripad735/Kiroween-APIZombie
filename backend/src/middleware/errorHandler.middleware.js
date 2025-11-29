import logger from '../utils/logger.js';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null, suggestions = []) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.suggestions = suggestions;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error messages and suggestions
 */
const ERROR_CATALOG = {
  // Authentication & Authorization Errors
  AUTH_FAILED: {
    message: 'Authentication failed',
    statusCode: 401,
    suggestions: [
      'Verify your API key or credentials are correct',
      'Check if your authentication token has expired',
      'Ensure you have the necessary permissions',
    ],
  },
  INVALID_API_KEY: {
    message: 'Invalid or missing API key',
    statusCode: 401,
    suggestions: [
      'Include a valid API key in the X-API-Key header',
      'Check your API key configuration in settings',
    ],
  },
  UNAUTHORIZED: {
    message: 'Unauthorized access',
    statusCode: 403,
    suggestions: [
      'You do not have permission to access this resource',
      'Contact your administrator for access',
    ],
  },

  // Validation Errors
  INVALID_INPUT: {
    message: 'Invalid input provided',
    statusCode: 400,
    suggestions: [
      'Check that all required fields are provided',
      'Ensure data types match the expected format',
      'Review the API documentation for correct input format',
    ],
  },
  INVALID_API_SPEC: {
    message: 'Invalid API specification format',
    statusCode: 400,
    suggestions: [
      'Ensure the file is a valid OpenAPI/Swagger, GraphQL schema, or gRPC proto file',
      'Check for syntax errors in the specification',
      'Verify the file is not corrupted',
    ],
  },
  MISSING_REQUIRED_FIELD: {
    message: 'Required field is missing',
    statusCode: 400,
    suggestions: [
      'Check the API documentation for required fields',
      'Ensure all mandatory parameters are included',
    ],
  },

  // Resource Errors
  NOT_FOUND: {
    message: 'Resource not found',
    statusCode: 404,
    suggestions: [
      'Verify the resource ID is correct',
      'Check if the resource has been deleted',
      'Ensure you are using the correct endpoint',
    ],
  },
  ALREADY_EXISTS: {
    message: 'Resource already exists',
    statusCode: 409,
    suggestions: [
      'Use a different name or identifier',
      'Update the existing resource instead of creating a new one',
    ],
  },

  // External API Errors
  EXTERNAL_API_ERROR: {
    message: 'External API request failed',
    statusCode: 502,
    suggestions: [
      'Check if the target API is accessible',
      'Verify the API endpoint URL is correct',
      'Ensure authentication credentials are valid',
      'Check if the API is experiencing downtime',
    ],
  },
  API_TIMEOUT: {
    message: 'API request timed out',
    statusCode: 504,
    suggestions: [
      'The target API took too long to respond',
      'Try again later or increase the timeout setting',
      'Check if the API endpoint is correct',
    ],
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Rate limit exceeded',
    statusCode: 429,
    suggestions: [
      'Wait a moment before making more requests',
      'Consider upgrading your plan for higher limits',
      'Implement request throttling in your application',
    ],
  },

  // LLM/AI Errors
  LLM_ERROR: {
    message: 'AI processing failed',
    statusCode: 500,
    suggestions: [
      'Try rephrasing your input',
      'Check if the Groq API service is available',
      'Simplify your request and try again',
    ],
  },
  LLM_TIMEOUT: {
    message: 'AI processing timed out',
    statusCode: 504,
    suggestions: [
      'The AI model took too long to respond',
      'Try with a simpler or shorter input',
      'Try again in a moment',
    ],
  },
  INVALID_LLM_RESPONSE: {
    message: 'AI generated an invalid response',
    statusCode: 500,
    suggestions: [
      'Try rephrasing your input more clearly',
      'Provide more context or details',
      'Try again with a different approach',
    ],
  },

  // Database Errors
  DATABASE_ERROR: {
    message: 'Database operation failed',
    statusCode: 500,
    suggestions: [
      'Try again in a moment',
      'Contact support if the problem persists',
    ],
  },
  CONNECTION_ERROR: {
    message: 'Database connection failed',
    statusCode: 503,
    suggestions: [
      'The database is temporarily unavailable',
      'Try again in a moment',
      'Contact support if the problem persists',
    ],
  },

  // Workflow Errors
  WORKFLOW_EXECUTION_FAILED: {
    message: 'Workflow execution failed',
    statusCode: 500,
    suggestions: [
      'Check the workflow step that failed',
      'Verify all API endpoints in the workflow are accessible',
      'Ensure variable mappings are correct',
    ],
  },
  WORKFLOW_STEP_FAILED: {
    message: 'Workflow step failed',
    statusCode: 500,
    suggestions: [
      'Review the error details for the failed step',
      'Check if the API endpoint is accessible',
      'Verify the request parameters are correct',
    ],
  },

  // Protocol Translation Errors
  TRANSLATION_NOT_POSSIBLE: {
    message: 'Protocol translation not possible',
    statusCode: 400,
    suggestions: [
      'Some protocol features cannot be directly translated',
      'Review the explanation for details',
      'Consider manual adaptation of the request',
    ],
  },

  // Test Generation Errors
  TEST_GENERATION_FAILED: {
    message: 'Test generation failed',
    statusCode: 500,
    suggestions: [
      'Ensure the API specification is valid and complete',
      'Try generating tests for a specific endpoint',
      'Check if the endpoint has sufficient documentation',
    ],
  },

  // File Upload Errors
  FILE_TOO_LARGE: {
    message: 'File size exceeds limit',
    statusCode: 413,
    suggestions: [
      'Maximum file size is 10MB',
      'Compress or reduce the file size',
      'Split large specifications into smaller files',
    ],
  },
  INVALID_FILE_TYPE: {
    message: 'Invalid file type',
    statusCode: 400,
    suggestions: [
      'Only JSON, YAML, and proto files are supported',
      'Check the file extension and format',
    ],
  },

  // Generic Errors
  INTERNAL_SERVER_ERROR: {
    message: 'An unexpected error occurred',
    statusCode: 500,
    suggestions: [
      'Try again in a moment',
      'Contact support if the problem persists',
    ],
  },
  SERVICE_UNAVAILABLE: {
    message: 'Service temporarily unavailable',
    statusCode: 503,
    suggestions: [
      'The service is undergoing maintenance',
      'Try again in a few minutes',
    ],
  },
};

/**
 * Get error details from catalog
 */
export const getErrorDetails = (code) => {
  return ERROR_CATALOG[code] || ERROR_CATALOG.INTERNAL_SERVER_ERROR;
};

/**
 * Create a standardized error
 */
export const createError = (code, customMessage = null, details = null) => {
  const errorInfo = getErrorDetails(code);
  return new AppError(
    code,
    customMessage || errorInfo.message,
    errorInfo.statusCode,
    details,
    errorInfo.suggestions
  );
};

/**
 * Centralized error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    error: {
      code: err.code || 'UNKNOWN_ERROR',
      message: err.message,
      stack: err.stack,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Handle operational errors (expected errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json(
      errorResponse(err.code, err.message, err.details, err.suggestions)
    );
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json(
      errorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        details,
        ['Check the provided data and try again']
      )
    );
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json(
      errorResponse(
        'INVALID_ID',
        `Invalid ${err.path}: ${err.value}`,
        null,
        ['Ensure you are using a valid ID format']
      )
    );
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json(
      errorResponse(
        'DUPLICATE_ENTRY',
        `A record with this ${field} already exists`,
        null,
        [`Use a different ${field}`, 'Update the existing record instead']
      )
    );
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse(
        'INVALID_TOKEN',
        'Invalid authentication token',
        null,
        ['Ensure you are using a valid token', 'Try logging in again']
      )
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse(
        'TOKEN_EXPIRED',
        'Authentication token has expired',
        null,
        ['Please log in again to get a new token']
      )
    );
  }

  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json(
        errorResponse(
          'FILE_TOO_LARGE',
          'File size exceeds the limit',
          null,
          ['Maximum file size is 10MB', 'Compress or reduce the file size']
        )
      );
    }
    return res.status(400).json(
      errorResponse(
        'FILE_UPLOAD_ERROR',
        err.message,
        null,
        ['Check the file and try again']
      )
    );
  }

  // Handle axios errors (external API calls)
  if (err.isAxiosError) {
    const statusCode = err.response?.status || 502;
    const details = {
      url: err.config?.url,
      method: err.config?.method,
      statusCode: err.response?.status,
      statusText: err.response?.statusText,
    };

    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return res.status(504).json(
        errorResponse(
          'API_TIMEOUT',
          'External API request timed out',
          details,
          getErrorDetails('API_TIMEOUT').suggestions
        )
      );
    }

    return res.status(statusCode).json(
      errorResponse(
        'EXTERNAL_API_ERROR',
        err.response?.data?.message || 'External API request failed',
        details,
        getErrorDetails('EXTERNAL_API_ERROR').suggestions
      )
    );
  }

  // Handle CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json(
      errorResponse(
        'CORS_ERROR',
        'Cross-Origin Request Blocked',
        null,
        ['Ensure your origin is allowed', 'Contact support for CORS configuration']
      )
    );
  }

  // Handle unexpected errors (programming errors)
  logger.error('Unexpected error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred';

  const details =
    process.env.NODE_ENV === 'development'
      ? { stack: err.stack, name: err.name }
      : null;

  return res.status(500).json(
    errorResponse(
      'INTERNAL_SERVER_ERROR',
      message,
      details,
      getErrorDetails('INTERNAL_SERVER_ERROR').suggestions
    )
  );
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json(
    errorResponse(
      'NOT_FOUND',
      `Route ${req.method} ${req.originalUrl} not found`,
      null,
      [
        'Check the URL and HTTP method',
        'Review the API documentation for available endpoints',
      ]
    )
  );
};
