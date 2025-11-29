import { parseNaturalLanguage, improveWithContext } from '../services/nlEngine.service.js';
import APISpec from '../models/APISpec.js';
import logger from '../utils/logger.js';
import { successResponse } from '../utils/responseFormatter.js';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware.js';

/**
 * Parse natural language input to API request
 * POST /api/nl/parse
 */
export const parseNL = asyncHandler(async (req, res) => {
  const { input, apiSpecId } = req.body;

  // Validate input
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw createError('INVALID_INPUT', 'Natural language input is required and must be a non-empty string');
  }

  // Fetch API spec if provided
  let apiSpec = null;
  if (apiSpecId) {
    apiSpec = await APISpec.findById(apiSpecId);
    
    if (!apiSpec) {
      throw createError('NOT_FOUND', `API specification with ID ${apiSpecId} not found`);
    }
  }

  // Parse natural language
  try {
    const apiRequest = await parseNaturalLanguage(input, apiSpec);

    logger.info(`Successfully parsed NL input: "${input.substring(0, 50)}..."`);

    return res.json(
      successResponse({
        request: apiRequest,
      }, 'Natural language successfully converted to API request')
    );
  } catch (error) {
    // Handle specific LLM errors
    if (error.message.includes('Groq API') || error.message.includes('LLM')) {
      throw createError('LLM_ERROR', error.message);
    }

    if (error.message.includes('rate limit')) {
      throw createError('RATE_LIMIT_EXCEEDED');
    }

    if (error.message.includes('timeout')) {
      throw createError('LLM_TIMEOUT');
    }

    // Re-throw as generic LLM error
    throw createError('LLM_ERROR', error.message);
  }
});

/**
 * Improve request generation with historical context
 * POST /api/nl/improve
 */
export const improveNL = asyncHandler(async (req, res) => {
  const { input, apiSpecId, history } = req.body;

  // Validate input
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw createError('INVALID_INPUT', 'Natural language input is required and must be a non-empty string');
  }

  // Validate history if provided
  if (history && !Array.isArray(history)) {
    throw createError('INVALID_INPUT', 'History must be an array of previous requests');
  }

  // Fetch API spec if provided
  let apiSpec = null;
  if (apiSpecId) {
    apiSpec = await APISpec.findById(apiSpecId);
    
    if (!apiSpec) {
      throw createError('NOT_FOUND', `API specification with ID ${apiSpecId} not found`);
    }
  }

  // Parse with context
  try {
    const apiRequest = await improveWithContext(input, history || [], apiSpec);

    logger.info(`Successfully parsed NL input with context: "${input.substring(0, 50)}..."`);

    return res.json(
      successResponse({
        request: apiRequest,
      }, 'Natural language successfully converted to API request with context')
    );
  } catch (error) {
    // Handle specific LLM errors
    if (error.message.includes('Groq API') || error.message.includes('LLM')) {
      throw createError('LLM_ERROR', error.message);
    }

    if (error.message.includes('rate limit')) {
      throw createError('RATE_LIMIT_EXCEEDED');
    }

    if (error.message.includes('timeout')) {
      throw createError('LLM_TIMEOUT');
    }

    // Re-throw as generic LLM error
    throw createError('LLM_ERROR', error.message);
  }
});
