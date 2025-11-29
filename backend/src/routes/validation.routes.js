import express from 'express';
import {
  validateResponseEndpoint,
  highlightMismatchesEndpoint,
  validateWithSpecEndpoint,
  validateTypesEndpoint,
  validateRequiredEndpoint,
  validateConstraintsEndpoint,
} from '../controllers/validation.controller.js';

const router = express.Router();

/**
 * POST /api/validate/response
 * Validate a response against a JSON schema
 * 
 * Request body:
 * {
 *   response: object,
 *   schema: object (JSON Schema)
 * }
 */
router.post('/response', validateResponseEndpoint);

/**
 * POST /api/validate/mismatches
 * Highlight specific field mismatches between response and schema
 * 
 * Request body:
 * {
 *   response: object,
 *   schema: object (JSON Schema)
 * }
 */
router.post('/mismatches', highlightMismatchesEndpoint);

/**
 * POST /api/validate/auto
 * Automatically validate response using API specification
 * 
 * Request body:
 * {
 *   response: object,
 *   apiSpecId: string,
 *   endpoint: string,
 *   method: string,
 *   statusCode?: number (default: 200)
 * }
 */
router.post('/auto', validateWithSpecEndpoint);

/**
 * POST /api/validate/types
 * Validate data types in response
 * 
 * Request body:
 * {
 *   response: object,
 *   typeDefinitions: object (field -> type mapping)
 * }
 */
router.post('/types', validateTypesEndpoint);

/**
 * POST /api/validate/required
 * Validate required fields in response
 * 
 * Request body:
 * {
 *   response: object,
 *   requiredFields: string[] (array of field names)
 * }
 */
router.post('/required', validateRequiredEndpoint);

/**
 * POST /api/validate/constraints
 * Validate value constraints in response
 * 
 * Request body:
 * {
 *   response: object,
 *   constraints: object (field -> constraint mapping)
 * }
 */
router.post('/constraints', validateConstraintsEndpoint);

export default router;
