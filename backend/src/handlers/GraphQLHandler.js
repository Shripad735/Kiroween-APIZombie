import axios from 'axios';
import ProtocolHandler from './ProtocolHandler.js';

/**
 * GraphQLHandler - Handles GraphQL queries and mutations
 */
class GraphQLHandler extends ProtocolHandler {
  /**
   * Execute a GraphQL query or mutation
   * @param {Object} request - The API request object
   * @param {Object} authConfig - Authentication configuration (optional)
   * @returns {Promise<Object>} Standardized API response
   */
  async execute(request, authConfig = null) {
    const startTime = Date.now();

    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        throw new Error(`Invalid GraphQL request: ${validation.errors.join(', ')}`);
      }

      // Inject authentication
      const authenticatedRequest = this.injectAuthentication(request, authConfig);

      // Build GraphQL request body
      const graphqlBody = {
        query: authenticatedRequest.query,
      };

      if (authenticatedRequest.variables) {
        graphqlBody.variables = authenticatedRequest.variables;
      }

      // Build axios config
      const axiosConfig = {
        method: 'post',
        url: authenticatedRequest.endpoint,
        headers: {
          'Content-Type': 'application/json',
          ...authenticatedRequest.headers,
        },
        data: graphqlBody,
        timeout: 30000, // 30 second timeout
      };

      // Execute request
      const response = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      // Check for GraphQL errors
      if (response.data?.errors) {
        return {
          statusCode: 200, // GraphQL returns 200 even with errors
          headers: response.headers,
          body: response.data,
          error: `GraphQL errors: ${response.data.errors.map(e => e.message).join(', ')}`,
          duration,
          success: false,
        };
      }

      return this.formatResponse(response, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      return this.formatError(error, duration);
    }
  }

  /**
   * Validate GraphQL request structure
   * @param {Object} request - The API request object
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateRequest(request) {
    const errors = [];

    if (!request.query) {
      errors.push('query is required for GraphQL requests');
    } else if (typeof request.query !== 'string') {
      errors.push('query must be a string');
    }

    if (!request.endpoint) {
      errors.push('endpoint is required');
    } else {
      // Validate URL format
      try {
        new URL(request.endpoint);
      } catch (e) {
        errors.push('endpoint must be a valid URL');
      }
    }

    if (request.variables && typeof request.variables !== 'object') {
      errors.push('variables must be an object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default GraphQLHandler;
