import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import ProtocolHandler from './ProtocolHandler.js';
import fs from 'fs';
import path from 'path';

/**
 * gRPCHandler - Handles gRPC requests
 */
class gRPCHandler extends ProtocolHandler {
  constructor() {
    super();
    this.clients = new Map(); // Cache gRPC clients
  }

  /**
   * Execute a gRPC request
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
        throw new Error(`Invalid gRPC request: ${validation.errors.join(', ')}`);
      }

      // Inject authentication (gRPC uses metadata)
      const authenticatedRequest = this.injectAuthentication(request, authConfig);

      // Get or create gRPC client
      const client = await this.getClient(authenticatedRequest);

      // Build metadata
      const metadata = new grpc.Metadata();
      
      // Add custom headers/metadata
      if (authenticatedRequest.headers) {
        Object.entries(authenticatedRequest.headers).forEach(([key, value]) => {
          metadata.add(key, value);
        });
      }

      // Add metadata from request
      if (authenticatedRequest.metadata) {
        Object.entries(authenticatedRequest.metadata).forEach(([key, value]) => {
          metadata.add(key, value);
        });
      }

      // Execute gRPC call
      const response = await this.makeGrpcCall(
        client,
        authenticatedRequest.service,
        authenticatedRequest.rpcMethod,
        authenticatedRequest.body || {},
        metadata
      );

      const duration = Date.now() - startTime;

      return {
        statusCode: 0, // gRPC uses status codes, 0 = OK
        headers: this.metadataToObject(response.metadata),
        body: response.data,
        duration,
        success: true,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        statusCode: error.code || 2, // 2 = UNKNOWN in gRPC
        headers: {},
        body: null,
        error: error.message,
        duration,
        success: false,
      };
    }
  }

  /**
   * Get or create gRPC client
   * @param {Object} request - The API request object
   * @returns {Promise<Object>} gRPC client
   */
  async getClient(request) {
    const clientKey = `${request.endpoint}_${request.service}`;
    
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey);
    }

    // For now, we'll return a mock client since we need proto files
    // In production, this would load the proto file and create a real client
    throw new Error('gRPC client creation requires proto file configuration. This feature is not yet fully implemented.');
  }

  /**
   * Make a gRPC call
   * @param {Object} client - gRPC client
   * @param {string} service - Service name
   * @param {string} method - RPC method name
   * @param {Object} data - Request data
   * @param {Object} metadata - gRPC metadata
   * @returns {Promise<Object>} Response with data and metadata
   */
  makeGrpcCall(client, service, method, data, metadata) {
    return new Promise((resolve, reject) => {
      const rpcMethod = client[method];
      
      if (!rpcMethod) {
        return reject(new Error(`Method ${method} not found on gRPC client`));
      }

      rpcMethod.call(client, data, metadata, (error, response) => {
        if (error) {
          return reject(error);
        }
        resolve({
          data: response,
          metadata: metadata,
        });
      });
    });
  }

  /**
   * Convert gRPC metadata to plain object
   * @param {Object} metadata - gRPC metadata
   * @returns {Object} Plain object
   */
  metadataToObject(metadata) {
    if (!metadata) return {};
    
    const obj = {};
    const map = metadata.getMap();
    
    Object.entries(map).forEach(([key, value]) => {
      obj[key] = value;
    });
    
    return obj;
  }

  /**
   * Validate gRPC request structure
   * @param {Object} request - The API request object
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateRequest(request) {
    const errors = [];

    if (!request.service) {
      errors.push('service is required for gRPC requests');
    }

    if (!request.rpcMethod) {
      errors.push('rpcMethod is required for gRPC requests');
    }

    if (!request.endpoint) {
      errors.push('endpoint is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Inject authentication for gRPC (uses metadata instead of headers)
   * @param {Object} request - The API request object
   * @param {Object} authConfig - Authentication configuration
   * @returns {Object} Request with authentication injected
   */
  injectAuthentication(request, authConfig) {
    if (!authConfig) return request;

    const metadata = { ...request.metadata };

    switch (authConfig.authType) {
      case 'apikey':
        metadata[authConfig.apiKey?.key || 'api-key'] = this.decryptValue(authConfig.apiKey?.value, authConfig);
        break;

      case 'bearer':
        metadata['authorization'] = `Bearer ${this.decryptValue(authConfig.bearerToken?.token, authConfig)}`;
        break;

      case 'basic':
        const username = authConfig.basic?.username || '';
        const password = this.decryptValue(authConfig.basic?.password, authConfig) || '';
        const credentials = Buffer.from(`${username}:${password}`).toString('base64');
        metadata['authorization'] = `Basic ${credentials}`;
        break;

      case 'oauth2':
        const tokenType = authConfig.oauth2?.tokenType || 'Bearer';
        const accessToken = this.decryptValue(authConfig.oauth2?.accessToken, authConfig);
        metadata['authorization'] = `${tokenType} ${accessToken}`;
        break;
    }

    return { ...request, metadata };
  }
}

export default gRPCHandler;
