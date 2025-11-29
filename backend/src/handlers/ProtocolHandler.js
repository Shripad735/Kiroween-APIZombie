/**
 * Base ProtocolHandler interface
 * All protocol handlers must implement these methods
 */
class ProtocolHandler {
  /**
   * Execute an API request
   * @param {Object} request - The API request object
   * @param {Object} authConfig - Authentication configuration (optional)
   * @returns {Promise<Object>} Standardized API response
   */
  async execute(request, authConfig = null) {
    throw new Error('execute() must be implemented by subclass');
  }

  /**
   * Validate request structure for this protocol
   * @param {Object} request - The API request object
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateRequest(request) {
    throw new Error('validateRequest() must be implemented by subclass');
  }

  /**
   * Format response to standardized structure
   * @param {Object} response - Raw response from API
   * @param {number} duration - Request duration in milliseconds
   * @returns {Object} Standardized response object
   */
  formatResponse(response, duration) {
    return {
      statusCode: response.status || response.statusCode || 200,
      headers: response.headers || {},
      body: response.data || response.body || response,
      duration,
      success: true,
    };
  }

  /**
   * Format error response
   * @param {Error} error - Error object
   * @param {number} duration - Request duration in milliseconds
   * @returns {Object} Standardized error response
   */
  formatError(error, duration) {
    return {
      statusCode: error.response?.status || error.statusCode || 500,
      headers: error.response?.headers || {},
      body: error.response?.data || null,
      error: error.message,
      duration,
      success: false,
    };
  }

  /**
   * Inject authentication headers/credentials into request
   * @param {Object} request - The API request object
   * @param {Object} authConfig - Authentication configuration
   * @returns {Object} Request with authentication injected
   */
  injectAuthentication(request, authConfig) {
    if (!authConfig) return request;

    const headers = { ...request.headers };

    switch (authConfig.authType) {
      case 'apikey':
        if (authConfig.apiKey?.location === 'header') {
          headers[authConfig.apiKey.key] = this.decryptValue(authConfig.apiKey.value, authConfig);
        }
        // Query params handled in specific handlers
        break;

      case 'bearer':
        headers['Authorization'] = `Bearer ${this.decryptValue(authConfig.bearerToken?.token, authConfig)}`;
        break;

      case 'basic':
        const username = authConfig.basic?.username || '';
        const password = this.decryptValue(authConfig.basic?.password, authConfig) || '';
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;

      case 'oauth2':
        const tokenType = authConfig.oauth2?.tokenType || 'Bearer';
        const accessToken = this.decryptValue(authConfig.oauth2?.accessToken, authConfig);
        headers['Authorization'] = `${tokenType} ${accessToken}`;
        break;
    }

    return { ...request, headers };
  }

  /**
   * Decrypt encrypted value from auth config
   * @param {string} encryptedValue - Encrypted value
   * @param {Object} authConfig - Auth config with decrypt method
   * @returns {string} Decrypted value
   */
  decryptValue(encryptedValue, authConfig) {
    if (!encryptedValue) return '';
    // If authConfig has decryptValue method, use it
    if (authConfig && typeof authConfig.decryptValue === 'function') {
      return authConfig.decryptValue(encryptedValue);
    }
    // Otherwise return as-is (for testing or unencrypted values)
    return encryptedValue;
  }
}

export default ProtocolHandler;
