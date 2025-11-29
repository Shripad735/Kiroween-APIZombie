import axios from 'axios';
import ProtocolHandler from './ProtocolHandler.js';

/**
 * RESTHandler - Handles REST API requests
 */
class RESTHandler extends ProtocolHandler {
  /**
   * Execute a REST API request
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
        throw new Error(`Invalid REST request: ${validation.errors.join(', ')}`);
      }

      // Inject authentication
      const authenticatedRequest = this.injectAuthentication(request, authConfig);

      // Build axios config
      const axiosConfig = {
        method: authenticatedRequest.method.toLowerCase(),
        url: authenticatedRequest.endpoint,
        headers: authenticatedRequest.headers || {},
        timeout: 30000, // 30 second timeout
      };

      // Add body for methods that support it
      if (['post', 'put', 'patch'].includes(axiosConfig.method) && authenticatedRequest.body) {
        axiosConfig.data = authenticatedRequest.body;
      }

      // Add query params for API key in query location
      if (authConfig?.authType === 'apikey' && authConfig.apiKey?.location === 'query') {
        const url = new URL(authenticatedRequest.endpoint);
        url.searchParams.set(
          authConfig.apiKey.key,
          this.decryptValue(authConfig.apiKey.value, authConfig)
        );
        axiosConfig.url = url.toString();
      }

      // Execute request
      const response = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      return this.formatResponse(response, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      return this.formatError(error, duration);
    }
  }

  /**
   * Validate REST request structure
   * @param {Object} request - The API request object
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateRequest(request) {
    const errors = [];

    if (!request.method) {
      errors.push('method is required');
    } else if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
      errors.push('method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
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

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default RESTHandler;
