import AuthConfig from '../models/AuthConfig.js';
import APISpec from '../models/APISpec.js';
import logger from '../utils/logger.js';

/**
 * Validate auth configuration based on type
 */
const validateAuthConfig = (authType, config) => {
  const errors = [];

  switch (authType) {
    case 'apikey':
      if (!config.apiKey?.key) {
        errors.push('API key name is required');
      }
      if (!config.apiKey?.value) {
        errors.push('API key value is required');
      }
      if (config.apiKey?.location && !['header', 'query'].includes(config.apiKey.location)) {
        errors.push('API key location must be either "header" or "query"');
      }
      break;

    case 'bearer':
      if (!config.bearerToken?.token) {
        errors.push('Bearer token is required');
      }
      break;

    case 'basic':
      if (!config.basic?.username) {
        errors.push('Username is required for basic auth');
      }
      if (!config.basic?.password) {
        errors.push('Password is required for basic auth');
      }
      break;

    case 'oauth2':
      if (!config.oauth2?.accessToken && !config.oauth2?.clientId) {
        errors.push('Either access token or client credentials are required for OAuth 2.0');
      }
      if (config.oauth2?.clientId && !config.oauth2?.clientSecret) {
        errors.push('Client secret is required when client ID is provided');
      }
      if (config.oauth2?.clientId && (!config.oauth2?.authUrl || !config.oauth2?.tokenUrl)) {
        errors.push('Auth URL and Token URL are required for OAuth 2.0 client credentials flow');
      }
      break;

    default:
      errors.push('Invalid auth type. Must be one of: apikey, bearer, basic, oauth2');
  }

  return errors;
};

/**
 * Save authentication configuration
 * POST /api/auth/config
 */
export const saveAuthConfig = async (req, res, next) => {
  try {
    const { apiSpecId, authType, apiKey, bearerToken, basic, oauth2 } = req.body;
    const userId = req.userId || 'default-user';

    // Validate required fields
    if (!apiSpecId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'API Spec ID is required',
        },
      });
    }

    if (!authType) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Auth type is required',
        },
      });
    }

    // Verify API spec exists
    const apiSpec = await APISpec.findOne({ _id: apiSpecId, userId });
    if (!apiSpec) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'API_SPEC_NOT_FOUND',
          message: 'API specification not found',
        },
      });
    }

    // Build config object for validation
    const configData = { apiKey, bearerToken, basic, oauth2 };
    
    // Validate auth configuration
    const validationErrors = validateAuthConfig(authType, configData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid authentication configuration',
          details: validationErrors,
        },
      });
    }

    // Check if auth config already exists for this API spec
    const existingConfig = await AuthConfig.findOne({ apiSpecId, userId });
    
    if (existingConfig) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFIG_EXISTS',
          message: 'Authentication configuration already exists for this API. Use PUT to update.',
          suggestions: ['Use PUT /api/auth/config/:apiId to update existing configuration'],
        },
      });
    }

    // Create new auth config
    const authConfig = new AuthConfig({
      apiSpecId,
      authType,
      apiKey,
      bearerToken,
      basic,
      oauth2,
      userId,
    });

    await authConfig.save();

    logger.info(`Auth config created for API spec: ${apiSpecId}`);

    // Return response with masked credentials
    const response = {
      id: authConfig._id,
      apiSpecId: authConfig.apiSpecId,
      authType: authConfig.authType,
      createdAt: authConfig.createdAt,
    };

    // Add masked credential info based on type
    if (authType === 'apikey') {
      response.apiKey = {
        key: authConfig.apiKey.key,
        value: '***masked***',
        location: authConfig.apiKey.location,
      };
    } else if (authType === 'bearer') {
      response.bearerToken = { token: '***masked***' };
    } else if (authType === 'basic') {
      response.basic = {
        username: authConfig.basic.username,
        password: '***masked***',
      };
    } else if (authType === 'oauth2') {
      response.oauth2 = {
        accessToken: authConfig.oauth2.accessToken ? '***masked***' : undefined,
        refreshToken: authConfig.oauth2.refreshToken ? '***masked***' : undefined,
        tokenType: authConfig.oauth2.tokenType,
        expiresAt: authConfig.oauth2.expiresAt,
        clientId: authConfig.oauth2.clientId,
        clientSecret: authConfig.oauth2.clientSecret ? '***masked***' : undefined,
        authUrl: authConfig.oauth2.authUrl,
        tokenUrl: authConfig.oauth2.tokenUrl,
        scope: authConfig.oauth2.scope,
      };
    }

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get authentication configuration by API spec ID
 * GET /api/auth/config/:apiId
 */
export const getAuthConfig = async (req, res, next) => {
  try {
    const { apiId } = req.params;
    const userId = req.userId || 'default-user';

    const authConfig = await AuthConfig.findOne({ apiSpecId: apiId, userId });

    if (!authConfig) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Authentication configuration not found for this API',
        },
      });
    }

    // Return response with masked credentials
    const response = {
      id: authConfig._id,
      apiSpecId: authConfig.apiSpecId,
      authType: authConfig.authType,
      createdAt: authConfig.createdAt,
      updatedAt: authConfig.updatedAt,
    };

    // Add masked credential info based on type
    const authType = authConfig.authType;
    if (authType === 'apikey') {
      response.apiKey = {
        key: authConfig.apiKey.key,
        value: '***masked***',
        location: authConfig.apiKey.location,
      };
    } else if (authType === 'bearer') {
      response.bearerToken = { token: '***masked***' };
    } else if (authType === 'basic') {
      response.basic = {
        username: authConfig.basic.username,
        password: '***masked***',
      };
    } else if (authType === 'oauth2') {
      response.oauth2 = {
        accessToken: authConfig.oauth2.accessToken ? '***masked***' : undefined,
        refreshToken: authConfig.oauth2.refreshToken ? '***masked***' : undefined,
        tokenType: authConfig.oauth2.tokenType,
        expiresAt: authConfig.oauth2.expiresAt,
        clientId: authConfig.oauth2.clientId,
        clientSecret: authConfig.oauth2.clientSecret ? '***masked***' : undefined,
        authUrl: authConfig.oauth2.authUrl,
        tokenUrl: authConfig.oauth2.tokenUrl,
        scope: authConfig.oauth2.scope,
      };
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid API specification ID',
        },
      });
    }
    next(error);
  }
};

/**
 * Update authentication configuration
 * PUT /api/auth/config/:apiId
 */
export const updateAuthConfig = async (req, res, next) => {
  try {
    const { apiId } = req.params;
    const { authType, apiKey, bearerToken, basic, oauth2 } = req.body;
    const userId = req.userId || 'default-user';

    // Find existing config
    const authConfig = await AuthConfig.findOne({ apiSpecId: apiId, userId });

    if (!authConfig) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Authentication configuration not found for this API',
          suggestions: ['Use POST /api/auth/config to create a new configuration'],
        },
      });
    }

    // If authType is being changed, validate the new type
    const newAuthType = authType || authConfig.authType;
    
    // Build config object for validation
    const configData = {
      apiKey: apiKey || authConfig.apiKey,
      bearerToken: bearerToken || authConfig.bearerToken,
      basic: basic || authConfig.basic,
      oauth2: oauth2 || authConfig.oauth2,
    };

    // Validate auth configuration
    const validationErrors = validateAuthConfig(newAuthType, configData);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid authentication configuration',
          details: validationErrors,
        },
      });
    }

    // Update fields
    if (authType) authConfig.authType = authType;
    if (apiKey) authConfig.apiKey = apiKey;
    if (bearerToken) authConfig.bearerToken = bearerToken;
    if (basic) authConfig.basic = basic;
    if (oauth2) authConfig.oauth2 = oauth2;

    await authConfig.save();

    logger.info(`Auth config updated for API spec: ${apiId}`);

    // Return response with masked credentials
    const response = {
      id: authConfig._id,
      apiSpecId: authConfig.apiSpecId,
      authType: authConfig.authType,
      updatedAt: authConfig.updatedAt,
    };

    // Add masked credential info based on type
    const finalAuthType = authConfig.authType;
    if (finalAuthType === 'apikey') {
      response.apiKey = {
        key: authConfig.apiKey.key,
        value: '***masked***',
        location: authConfig.apiKey.location,
      };
    } else if (finalAuthType === 'bearer') {
      response.bearerToken = { token: '***masked***' };
    } else if (finalAuthType === 'basic') {
      response.basic = {
        username: authConfig.basic.username,
        password: '***masked***',
      };
    } else if (finalAuthType === 'oauth2') {
      response.oauth2 = {
        accessToken: authConfig.oauth2.accessToken ? '***masked***' : undefined,
        refreshToken: authConfig.oauth2.refreshToken ? '***masked***' : undefined,
        tokenType: authConfig.oauth2.tokenType,
        expiresAt: authConfig.oauth2.expiresAt,
        clientId: authConfig.oauth2.clientId,
        clientSecret: authConfig.oauth2.clientSecret ? '***masked***' : undefined,
        authUrl: authConfig.oauth2.authUrl,
        tokenUrl: authConfig.oauth2.tokenUrl,
        scope: authConfig.oauth2.scope,
      };
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid API specification ID',
        },
      });
    }
    next(error);
  }
};

/**
 * Delete authentication configuration
 * DELETE /api/auth/config/:apiId
 */
export const deleteAuthConfig = async (req, res, next) => {
  try {
    const { apiId } = req.params;
    const userId = req.userId || 'default-user';

    const authConfig = await AuthConfig.findOneAndDelete({ apiSpecId: apiId, userId });

    if (!authConfig) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: 'Authentication configuration not found for this API',
        },
      });
    }

    logger.info(`Auth config deleted for API spec: ${apiId}`);

    res.json({
      success: true,
      message: 'Authentication configuration deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid API specification ID',
        },
      });
    }
    next(error);
  }
};
