import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent injection attacks
 */

// Characters that could be used for injection attacks
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /<iframe[^>]*>.*?<\/iframe>/gi, // Iframes
  /eval\(/gi, // Eval function
  /expression\(/gi, // CSS expressions
];

/**
 * Sanitize a string value
 * @param {string} value - The value to sanitize
 * @returns {string} - Sanitized value
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  let sanitized = value;
  
  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Recursively sanitize an object
 * @param {any} obj - The object to sanitize
 * @returns {any} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json(errorResponse(
      'SANITIZATION_ERROR',
      'Invalid input data',
      error.message,
      ['Check your input data format']
    ));
  }
};

/**
 * Validate that required fields are present
 * @param {string[]} fields - Array of required field names
 * @returns {Function} - Express middleware function
 */
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json(errorResponse(
        'MISSING_REQUIRED_FIELDS',
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields },
        ['Ensure all required fields are provided']
      ));
    }
    
    next();
  };
};

/**
 * Validate MongoDB ObjectId format
 * @param {string} paramName - Name of the parameter to validate
 * @returns {Function} - Express middleware function
 */
export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdPattern.test(id)) {
      return res.status(400).json(errorResponse(
        'INVALID_ID',
        `Invalid ${paramName} format`,
        { [paramName]: id },
        ['Ensure you are using a valid MongoDB ObjectId format']
      ));
    }
    
    next();
  };
};

export default {
  sanitizeInput,
  validateRequiredFields,
  validateObjectId,
};
