import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import logger from '../utils/logger.js';

/**
 * ResponseValidator Service
 * Validates API responses against expected schemas
 */

// Initialize AJV with options
const ajv = new Ajv({
  allErrors: true, // Collect all errors, not just the first one
  verbose: true, // Include schema and data in errors
  strict: false, // Allow additional properties by default
});

// Add format validators (email, uri, date-time, etc.)
addFormats(ajv);

/**
 * Validate response against expected schema
 * @param {Object} response - The API response to validate
 * @param {Object} expectedSchema - JSON Schema to validate against
 * @returns {Object} Validation result with success flag and errors
 */
export const validateResponse = (response, expectedSchema) => {
  try {
    if (!expectedSchema) {
      return {
        success: true,
        message: 'No schema provided for validation',
        errors: [],
      };
    }

    // Compile the schema
    const validate = ajv.compile(expectedSchema);

    // Validate the response
    const valid = validate(response);

    if (valid) {
      logger.info('Response validation passed');
      return {
        success: true,
        message: 'Response matches expected schema',
        errors: [],
      };
    }

    // Validation failed - format errors
    const formattedErrors = validate.errors.map((error) => ({
      field: error.instancePath || '/',
      message: error.message,
      keyword: error.keyword,
      params: error.params,
      schemaPath: error.schemaPath,
    }));

    logger.warn('Response validation failed', { errors: formattedErrors });

    return {
      success: false,
      message: 'Response does not match expected schema',
      errors: formattedErrors,
    };
  } catch (error) {
    logger.error('Error during response validation:', error);
    return {
      success: false,
      message: `Validation error: ${error.message}`,
      errors: [
        {
          field: 'schema',
          message: error.message,
          keyword: 'error',
        },
      ],
    };
  }
};

/**
 * Highlight specific field mismatches between response and schema
 * @param {Object} response - The API response
 * @param {Object} expectedSchema - JSON Schema
 * @returns {Array} Array of detailed mismatch information
 */
export const highlightMismatches = (response, expectedSchema) => {
  try {
    if (!expectedSchema) {
      return [];
    }

    const validate = ajv.compile(expectedSchema);
    const valid = validate(response);

    if (valid) {
      return [];
    }

    // Process errors to create detailed mismatch information
    const mismatches = validate.errors.map((error) => {
      const fieldPath = error.instancePath || '/';
      const fieldValue = getValueAtPath(response, fieldPath);

      return {
        field: fieldPath,
        actualValue: fieldValue,
        expectedType: error.params?.type || 'unknown',
        issue: error.message,
        keyword: error.keyword,
        schemaPath: error.schemaPath,
        details: formatErrorDetails(error),
      };
    });

    logger.info(`Found ${mismatches.length} field mismatches`);
    return mismatches;
  } catch (error) {
    logger.error('Error highlighting mismatches:', error);
    return [
      {
        field: 'error',
        issue: error.message,
        details: 'Failed to process schema validation',
      },
    ];
  }
};

/**
 * Get value at a JSON path
 * @param {Object} obj - Object to traverse
 * @param {String} path - JSON path (e.g., "/user/name")
 * @returns {*} Value at path or undefined
 */
const getValueAtPath = (obj, path) => {
  if (path === '/' || path === '') {
    return obj;
  }

  const parts = path.split('/').filter((p) => p !== '');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
};

/**
 * Format error details for better readability
 * @param {Object} error - AJV error object
 * @returns {String} Formatted error details
 */
const formatErrorDetails = (error) => {
  switch (error.keyword) {
    case 'type':
      return `Expected type '${error.params.type}' but got '${typeof error.data}'`;
    
    case 'required':
      return `Missing required field: '${error.params.missingProperty}'`;
    
    case 'enum':
      return `Value must be one of: ${error.params.allowedValues.join(', ')}`;
    
    case 'minimum':
      return `Value must be >= ${error.params.limit}`;
    
    case 'maximum':
      return `Value must be <= ${error.params.limit}`;
    
    case 'minLength':
      return `String length must be >= ${error.params.limit}`;
    
    case 'maxLength':
      return `String length must be <= ${error.params.limit}`;
    
    case 'pattern':
      return `Value must match pattern: ${error.params.pattern}`;
    
    case 'format':
      return `Value must be a valid ${error.params.format}`;
    
    case 'additionalProperties':
      return `Additional property not allowed: '${error.params.additionalProperty}'`;
    
    default:
      return error.message;
  }
};

/**
 * Validate response with automatic schema extraction from API spec
 * @param {Object} response - The API response
 * @param {Object} apiSpec - API specification object
 * @param {String} endpoint - Endpoint path
 * @param {String} method - HTTP method
 * @param {Number} statusCode - Response status code
 * @returns {Object} Validation result
 */
export const validateWithApiSpec = (response, apiSpec, endpoint, method, statusCode = 200) => {
  try {
    if (!apiSpec || !apiSpec.specification) {
      return {
        success: true,
        message: 'No API specification available for automatic validation',
        errors: [],
      };
    }

    // Extract schema from OpenAPI spec
    if (apiSpec.type === 'openapi' || apiSpec.type === 'rest') {
      const schema = extractOpenAPISchema(apiSpec.specification, endpoint, method, statusCode);
      
      if (schema) {
        return validateResponse(response, schema);
      }
    }

    // For GraphQL, schema validation is more complex
    if (apiSpec.type === 'graphql') {
      logger.info('GraphQL schema validation not yet implemented');
      return {
        success: true,
        message: 'GraphQL schema validation not yet implemented',
        errors: [],
      };
    }

    // For gRPC, use proto definitions
    if (apiSpec.type === 'grpc') {
      logger.info('gRPC schema validation not yet implemented');
      return {
        success: true,
        message: 'gRPC schema validation not yet implemented',
        errors: [],
      };
    }

    return {
      success: true,
      message: 'No schema found in API specification',
      errors: [],
    };
  } catch (error) {
    logger.error('Error in automatic validation:', error);
    return {
      success: false,
      message: `Automatic validation error: ${error.message}`,
      errors: [],
    };
  }
};

/**
 * Extract response schema from OpenAPI specification
 * @param {Object} spec - OpenAPI specification
 * @param {String} endpoint - Endpoint path
 * @param {String} method - HTTP method
 * @param {Number} statusCode - Response status code
 * @returns {Object|null} JSON Schema or null
 */
const extractOpenAPISchema = (spec, endpoint, method, statusCode) => {
  try {
    const paths = spec.paths || {};
    const pathItem = paths[endpoint];

    if (!pathItem) {
      logger.warn(`Endpoint ${endpoint} not found in OpenAPI spec`);
      return null;
    }

    const operation = pathItem[method.toLowerCase()];

    if (!operation) {
      logger.warn(`Method ${method} not found for endpoint ${endpoint}`);
      return null;
    }

    const responses = operation.responses || {};
    const response = responses[statusCode] || responses['200'] || responses['default'];

    if (!response) {
      logger.warn(`No response definition found for status ${statusCode}`);
      return null;
    }

    // OpenAPI 3.x format
    if (response.content) {
      const jsonContent = response.content['application/json'];
      if (jsonContent && jsonContent.schema) {
        return resolveSchema(jsonContent.schema, spec);
      }
    }

    // OpenAPI 2.x (Swagger) format
    if (response.schema) {
      return resolveSchema(response.schema, spec);
    }

    return null;
  } catch (error) {
    logger.error('Error extracting OpenAPI schema:', error);
    return null;
  }
};

/**
 * Resolve schema references ($ref) in OpenAPI spec
 * @param {Object} schema - Schema object that may contain $ref
 * @param {Object} spec - Full OpenAPI specification
 * @returns {Object} Resolved schema
 */
const resolveSchema = (schema, spec) => {
  if (!schema.$ref) {
    return schema;
  }

  // Parse $ref (e.g., "#/components/schemas/User")
  const refPath = schema.$ref.replace('#/', '').split('/');
  let resolved = spec;

  for (const part of refPath) {
    resolved = resolved[part];
    if (!resolved) {
      logger.warn(`Could not resolve schema reference: ${schema.$ref}`);
      return schema;
    }
  }

  return resolved;
};

/**
 * Validate data types in response
 * @param {Object} response - The API response
 * @param {Object} typeDefinitions - Expected type definitions
 * @returns {Object} Validation result
 */
export const validateDataTypes = (response, typeDefinitions) => {
  const errors = [];

  for (const [field, expectedType] of Object.entries(typeDefinitions)) {
    const value = getValueAtPath(response, `/${field}`);
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== expectedType) {
      errors.push({
        field: `/${field}`,
        expectedType,
        actualType,
        message: `Expected type '${expectedType}' but got '${actualType}'`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'All data types are correct' : 'Type validation failed',
    errors,
  };
};

/**
 * Validate required fields in response
 * @param {Object} response - The API response
 * @param {Array} requiredFields - Array of required field paths
 * @returns {Object} Validation result
 */
export const validateRequiredFields = (response, requiredFields) => {
  const errors = [];

  for (const field of requiredFields) {
    const value = getValueAtPath(response, `/${field}`);

    if (value === undefined || value === null) {
      errors.push({
        field: `/${field}`,
        message: `Required field '${field}' is missing or null`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'All required fields are present' : 'Required field validation failed',
    errors,
  };
};

/**
 * Validate value constraints (min, max, pattern, etc.)
 * @param {Object} response - The API response
 * @param {Object} constraints - Constraint definitions
 * @returns {Object} Validation result
 */
export const validateConstraints = (response, constraints) => {
  const errors = [];

  for (const [field, constraint] of Object.entries(constraints)) {
    const value = getValueAtPath(response, `/${field}`);

    if (value === undefined || value === null) {
      continue; // Skip if field doesn't exist
    }

    // Minimum value constraint
    if (constraint.minimum !== undefined && value < constraint.minimum) {
      errors.push({
        field: `/${field}`,
        message: `Value ${value} is less than minimum ${constraint.minimum}`,
      });
    }

    // Maximum value constraint
    if (constraint.maximum !== undefined && value > constraint.maximum) {
      errors.push({
        field: `/${field}`,
        message: `Value ${value} is greater than maximum ${constraint.maximum}`,
      });
    }

    // Pattern constraint (for strings)
    if (constraint.pattern && typeof value === 'string') {
      const regex = new RegExp(constraint.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: `/${field}`,
          message: `Value does not match pattern ${constraint.pattern}`,
        });
      }
    }

    // Enum constraint
    if (constraint.enum && !constraint.enum.includes(value)) {
      errors.push({
        field: `/${field}`,
        message: `Value must be one of: ${constraint.enum.join(', ')}`,
      });
    }
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? 'All constraints are satisfied' : 'Constraint validation failed',
    errors,
  };
};

export default {
  validateResponse,
  highlightMismatches,
  validateWithApiSpec,
  validateDataTypes,
  validateRequiredFields,
  validateConstraints,
};
