import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware
 * Logs all incoming requests and outgoing responses
 */
export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = uuidv4();
  req.requestId = requestId;

  // Capture request start time
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
  });

  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const sanitizedBody = sanitizeLogData(req.body);
    logger.debug('Request body', {
      requestId,
      body: sanitizedBody,
    });
  }

  // Capture the original res.json to log responses
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // Calculate response time
    const duration = Date.now() - startTime;

    // Log response
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: body?.success !== false,
    });

    // Log response body in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      const sanitizedBody = sanitizeLogData(body);
      logger.debug('Response body', {
        requestId,
        body: sanitizedBody,
      });
    }

    // Log slow requests (> 3 seconds)
    if (duration > 3000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
      });
    }

    return originalJson(body);
  };

  next();
};

/**
 * Sanitize sensitive data from logs
 * Removes passwords, tokens, API keys, etc.
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'auth',
    'credentials',
    'accessToken',
    'refreshToken',
    'bearer',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
};

/**
 * Performance monitoring middleware
 * Tracks API endpoint performance metrics
 */
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();

    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = {
      heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
      external: (endMemory.external - startMemory.external) / 1024 / 1024, // MB
    };

    // Log performance metrics
    logger.debug('Performance metrics', {
      requestId: req.requestId,
      endpoint: `${req.method} ${req.path}`,
      duration: `${duration.toFixed(2)}ms`,
      statusCode: res.statusCode,
      memoryDelta: {
        heapUsed: `${memoryDelta.heapUsed.toFixed(2)}MB`,
        external: `${memoryDelta.external.toFixed(2)}MB`,
      },
    });

    // Warn about high memory usage
    if (Math.abs(memoryDelta.heapUsed) > 50) {
      logger.warn('High memory usage detected', {
        requestId: req.requestId,
        endpoint: `${req.method} ${req.path}`,
        memoryDelta: `${memoryDelta.heapUsed.toFixed(2)}MB`,
      });
    }
  });

  next();
};

/**
 * Error logging middleware
 * Specifically for logging errors before they reach the error handler
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Error in request processing', {
    requestId: req.requestId,
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    },
  });

  next(err);
};
