import { errorResponse } from '../utils/responseFormatter.js';

/**
 * API Key Validation Middleware
 * Validates API keys for protected endpoints
 */

/**
 * Validate API key from request headers
 * This is for protecting the APIZombie backend itself (optional feature)
 */
export const validateApiKey = (req, res, next) => {
  // Skip validation if no API key is configured
  const expectedApiKey = process.env.API_KEY;
  
  if (!expectedApiKey) {
    // No API key configured, skip validation
    return next();
  }
  
  // Get API key from header
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json(errorResponse(
      'MISSING_API_KEY',
      'API key is required',
      null,
      ['Please provide an API key in the X-API-Key header or Authorization header']
    ));
  }
  
  if (apiKey !== expectedApiKey) {
    return res.status(403).json(errorResponse(
      'INVALID_API_KEY',
      'Invalid API key',
      null,
      ['The provided API key is not valid', 'Check your API key configuration']
    ));
  }
  
  next();
};

/**
 * Optional API key validation (warns but doesn't block)
 */
export const optionalApiKey = (req, res, next) => {
  const expectedApiKey = process.env.API_KEY;
  
  if (!expectedApiKey) {
    return next();
  }
  
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (apiKey && apiKey !== expectedApiKey) {
    console.warn('⚠️ Invalid API key provided');
  }
  
  next();
};

/**
 * Validate Groq API key is configured
 */
export const validateGroqApiKey = (req, res, next) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (!groqApiKey) {
    return res.status(500).json(errorResponse(
      'GROQ_API_KEY_MISSING',
      'Groq API key is not configured',
      null,
      ['Please set GROQ_API_KEY in environment variables']
    ));
  }
  
  next();
};

export default {
  validateApiKey,
  optionalApiKey,
  validateGroqApiKey,
};
