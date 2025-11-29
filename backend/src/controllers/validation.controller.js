import {
  validateResponse,
  highlightMismatches,
  validateWithApiSpec,
  validateDataTypes,
  validateRequiredFields,
  validateConstraints,
} from '../services/responseValidator.service.js';
import { APISpec } from '../models/index.js';
import logger from '../utils/logger.js';
import { successResponse } from '../utils/responseFormatter.js';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware.js';

/**
 * Validate response against a JSON schema
 * POST /api/validate/response
 */
export const validateResponseEndpoint = asyncHandler(async (req, res) => {
  const { response, schema } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!schema) {
    throw createError('INVALID_INPUT', 'Schema object is required for validation');
  }

  // Perform validation
  const validationResult = validateResponse(response, schema);

  // Return result
  return res.json(
    successResponse(validationResult, 'Response validation completed')
  );
});

/**
 * Highlight mismatches between response and schema
 * POST /api/validate/mismatches
 */
export const highlightMismatchesEndpoint = asyncHandler(async (req, res) => {
  const { response, schema } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!schema) {
    throw createError('INVALID_INPUT', 'Schema object is required');
  }

  // Get mismatches
  const mismatches = highlightMismatches(response, schema);

  // Return result
  return res.json(
    successResponse({
      mismatches,
      count: mismatches.length,
      hasErrors: mismatches.length > 0,
    }, 'Mismatch analysis completed')
  );
});

/**
 * Validate response using API specification
 * POST /api/validate/auto
 */
export const validateWithSpecEndpoint = asyncHandler(async (req, res) => {
  const { response, apiSpecId, endpoint, method, statusCode = 200 } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!apiSpecId) {
    throw createError('INVALID_INPUT', 'API specification ID is required for automatic validation');
  }

  if (!endpoint || !method) {
    throw createError('INVALID_INPUT', 'Endpoint and method are required for automatic validation');
  }

  // Fetch API specification
  const apiSpec = await APISpec.findById(apiSpecId);

  if (!apiSpec) {
    throw createError('NOT_FOUND', `API specification with ID ${apiSpecId} not found`);
  }

  // Perform automatic validation
  const validationResult = validateWithApiSpec(
    response,
    apiSpec,
    endpoint,
    method,
    statusCode
  );

  // Return result
  return res.json(
    successResponse(validationResult, 'Automatic validation completed')
  );
});

/**
 * Validate data types in response
 * POST /api/validate/types
 */
export const validateTypesEndpoint = asyncHandler(async (req, res) => {
  const { response, typeDefinitions } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!typeDefinitions || typeof typeDefinitions !== 'object') {
    throw createError('INVALID_INPUT', 'Type definitions object is required');
  }

  // Validate types
  const validationResult = validateDataTypes(response, typeDefinitions);

  // Return result
  return res.json(
    successResponse(validationResult, 'Type validation completed')
  );
});

/**
 * Validate required fields in response
 * POST /api/validate/required
 */
export const validateRequiredEndpoint = asyncHandler(async (req, res) => {
  const { response, requiredFields } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!Array.isArray(requiredFields)) {
    throw createError('INVALID_INPUT', 'Required fields must be an array');
  }

  // Validate required fields
  const validationResult = validateRequiredFields(response, requiredFields);

  // Return result
  return res.json(
    successResponse(validationResult, 'Required fields validation completed')
  );
});

/**
 * Validate constraints in response
 * POST /api/validate/constraints
 */
export const validateConstraintsEndpoint = asyncHandler(async (req, res) => {
  const { response, constraints } = req.body;

  // Validate input
  if (!response) {
    throw createError('INVALID_INPUT', 'Response object is required');
  }

  if (!constraints || typeof constraints !== 'object') {
    throw createError('INVALID_INPUT', 'Constraints object is required');
  }

  // Validate constraints
  const validationResult = validateConstraints(response, constraints);

  // Return result
  return res.json(
    successResponse(validationResult, 'Constraints validation completed')
  );
});
