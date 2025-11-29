import SwaggerParser from 'swagger-parser';
import { buildClientSchema, getIntrospectionQuery, printSchema } from 'graphql';
import protobuf from 'protobufjs';
import axios from 'axios';
import yaml from 'js-yaml';
import logger from '../utils/logger.js';

/**
 * Parse OpenAPI/Swagger specification
 * @param {Object|String} spec - OpenAPI spec object, JSON string, or YAML string
 * @returns {Object} Parsed specification with endpoints
 */
export const parseOpenAPISpec = async (spec) => {
  try {
    // Parse and validate the OpenAPI spec
    let specObject = spec;
    
    // If it's a string, try to parse as JSON first, then YAML
    if (typeof spec === 'string') {
      try {
        // Try parsing as JSON
        specObject = JSON.parse(spec);
      } catch (jsonError) {
        // Not JSON, try parsing as YAML
        try {
          specObject = yaml.load(spec);
          logger.info('Successfully parsed YAML specification');
        } catch (yamlError) {
          throw new Error(`Failed to parse specification as JSON or YAML: ${yamlError.message}`);
        }
      }
    }

    // Validate the parsed spec
    const api = await SwaggerParser.validate(specObject);
    
    const endpoints = [];
    const paths = api.paths || {};

    // Extract endpoints from paths
    for (const [path, pathItem] of Object.entries(paths)) {
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      
      for (const method of methods) {
        if (pathItem[method]) {
          const operation = pathItem[method];
          
          endpoints.push({
            path,
            method: method.toUpperCase(),
            description: operation.summary || operation.description || '',
            parameters: operation.parameters || [],
            requestBody: operation.requestBody || null,
            responses: operation.responses || {},
          });
        }
      }
    }

    logger.info(`Parsed OpenAPI spec: ${endpoints.length} endpoints found`);

    return {
      raw: api,
      endpoints,
    };
  } catch (error) {
    logger.error('OpenAPI parsing error:', error);
    throw new Error(`Failed to parse OpenAPI specification: ${error.message}`);
  }
};

/**
 * Parse GraphQL schema from SDL string
 * @param {String} schemaSDL - GraphQL schema in SDL format
 * @returns {Object} Parsed schema with endpoints
 */
export const parseGraphQLSchema = async (schemaSDL) => {
  try {
    let schemaString = schemaSDL;
    
    // If it's an object (introspection result), convert to SDL
    if (typeof schemaSDL === 'object') {
      const schema = buildClientSchema(schemaSDL);
      schemaString = printSchema(schema);
    }

    // Parse the schema to extract types
    const endpoints = [];
    
    // Extract Query type operations
    const queryMatches = schemaString.match(/type Query\s*{([^}]*)}/s);
    if (queryMatches) {
      const queryFields = queryMatches[1].trim().split('\n');
      for (const field of queryFields) {
        const fieldMatch = field.trim().match(/^(\w+)(\([^)]*\))?:\s*(.+)/);
        if (fieldMatch) {
          endpoints.push({
            path: fieldMatch[1],
            operationType: 'query',
            description: '',
            parameters: fieldMatch[2] ? [fieldMatch[2]] : [],
            responses: { type: fieldMatch[3] },
          });
        }
      }
    }

    // Extract Mutation type operations
    const mutationMatches = schemaString.match(/type Mutation\s*{([^}]*)}/s);
    if (mutationMatches) {
      const mutationFields = mutationMatches[1].trim().split('\n');
      for (const field of mutationFields) {
        const fieldMatch = field.trim().match(/^(\w+)(\([^)]*\))?:\s*(.+)/);
        if (fieldMatch) {
          endpoints.push({
            path: fieldMatch[1],
            operationType: 'mutation',
            description: '',
            parameters: fieldMatch[2] ? [fieldMatch[2]] : [],
            responses: { type: fieldMatch[3] },
          });
        }
      }
    }

    // Extract Subscription type operations
    const subscriptionMatches = schemaString.match(/type Subscription\s*{([^}]*)}/s);
    if (subscriptionMatches) {
      const subscriptionFields = subscriptionMatches[1].trim().split('\n');
      for (const field of subscriptionFields) {
        const fieldMatch = field.trim().match(/^(\w+)(\([^)]*\))?:\s*(.+)/);
        if (fieldMatch) {
          endpoints.push({
            path: fieldMatch[1],
            operationType: 'subscription',
            description: '',
            parameters: fieldMatch[2] ? [fieldMatch[2]] : [],
            responses: { type: fieldMatch[3] },
          });
        }
      }
    }

    logger.info(`Parsed GraphQL schema: ${endpoints.length} operations found`);

    return {
      raw: { schema: schemaString },
      endpoints,
    };
  } catch (error) {
    logger.error('GraphQL parsing error:', error);
    throw new Error(`Failed to parse GraphQL schema: ${error.message}`);
  }
};

/**
 * Introspect GraphQL endpoint
 * @param {String} url - GraphQL endpoint URL
 * @returns {Object} Introspected schema with endpoints
 */
export const introspectGraphQLEndpoint = async (url) => {
  try {
    // Send introspection query
    const response = await axios.post(url, {
      query: getIntrospectionQuery(),
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    if (response.data.errors) {
      throw new Error(`GraphQL introspection failed: ${JSON.stringify(response.data.errors)}`);
    }

    const introspectionResult = response.data.data;
    
    // Build schema from introspection
    const schema = buildClientSchema(introspectionResult);
    const schemaSDL = printSchema(schema);

    // Parse the schema to extract endpoints
    const parsed = await parseGraphQLSchema(schemaSDL);

    logger.info(`Introspected GraphQL endpoint: ${url}`);

    return {
      raw: { schema: schemaSDL, introspection: introspectionResult },
      endpoints: parsed.endpoints,
    };
  } catch (error) {
    logger.error('GraphQL introspection error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Cannot connect to GraphQL endpoint: ${url}`);
    }
    
    throw new Error(`Failed to introspect GraphQL endpoint: ${error.message}`);
  }
};

/**
 * Parse gRPC proto file
 * @param {String} protoContent - Proto file content
 * @returns {Object} Parsed proto with service definitions
 */
export const parseGRPCProto = async (protoContent) => {
  try {
    // Parse proto file
    const root = protobuf.parse(protoContent);
    const endpoints = [];

    // Extract services and methods
    if (root.root) {
      const services = [];
      
      // Recursively find all services
      const findServices = (namespace) => {
        if (namespace.nested) {
          for (const [name, nested] of Object.entries(namespace.nested)) {
            if (nested instanceof protobuf.Service) {
              services.push({ name, service: nested });
            } else if (nested.nested) {
              findServices(nested);
            }
          }
        }
      };

      findServices(root.root);

      // Extract methods from services
      for (const { name: serviceName, service } of services) {
        if (service.methods) {
          for (const [methodName, method] of Object.entries(service.methods)) {
            endpoints.push({
              path: `${serviceName}/${methodName}`,
              method: 'RPC',
              description: method.comment || '',
              parameters: [{
                name: 'request',
                type: method.requestType,
              }],
              responses: {
                type: method.responseType,
              },
            });
          }
        }
      }
    }

    logger.info(`Parsed gRPC proto: ${endpoints.length} methods found`);

    return {
      raw: { proto: protoContent },
      endpoints,
    };
  } catch (error) {
    logger.error('gRPC proto parsing error:', error);
    throw new Error(`Failed to parse gRPC proto file: ${error.message}`);
  }
};
