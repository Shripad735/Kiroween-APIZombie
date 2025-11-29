import APISpec from '../models/APISpec.js';
import {
  parseOpenAPISpec,
  parseGraphQLSchema,
  parseGRPCProto,
  introspectGraphQLEndpoint,
} from '../services/specParser.service.js';
import logger from '../utils/logger.js';

/**
 * Upload and parse API specification
 * POST /api/specs/upload
 */
export const uploadSpec = async (req, res, next) => {
  try {
    const { name, type, baseUrl, specification, fileContent } = req.body;

    // Validate required fields
    if (!name || !type || !baseUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name, type, and baseUrl are required',
        },
      });
    }

    // Validate type
    if (!['openapi', 'graphql', 'grpc'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be one of: openapi, graphql, grpc',
        },
      });
    }

    let parsedSpec;
    let endpoints = [];

    // Parse based on type
    try {
      switch (type) {
        case 'openapi':
          const openApiInput = specification || fileContent;
          if (!openApiInput) {
            throw new Error('OpenAPI specification or file content is required');
          }
          parsedSpec = await parseOpenAPISpec(openApiInput);
          endpoints = parsedSpec.endpoints;
          break;

        case 'graphql':
          const graphqlInput = specification || fileContent;
          if (!graphqlInput) {
            throw new Error('GraphQL schema or file content is required');
          }
          parsedSpec = await parseGraphQLSchema(graphqlInput);
          endpoints = parsedSpec.endpoints;
          break;

        case 'grpc':
          if (!fileContent) {
            throw new Error('gRPC proto file content is required');
          }
          parsedSpec = await parseGRPCProto(fileContent);
          endpoints = parsedSpec.endpoints;
          break;

        default:
          throw new Error('Unsupported specification type');
      }
    } catch (parseError) {
      logger.error('Spec parsing error:', parseError);
      return res.status(400).json({
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: `Failed to parse ${type} specification: ${parseError.message}`,
          details: parseError.message,
        },
      });
    }

    // Create and save API spec
    const apiSpec = new APISpec({
      name,
      type,
      baseUrl,
      specification: parsedSpec.raw,
      endpoints,
      userId: req.userId || 'default-user',
    });

    await apiSpec.save();

    logger.info(`API spec created: ${apiSpec.name} (${apiSpec.type})`);

    res.status(201).json({
      success: true,
      data: {
        id: apiSpec._id,
        name: apiSpec.name,
        type: apiSpec.type,
        baseUrl: apiSpec.baseUrl,
        endpointCount: endpoints.length,
        createdAt: apiSpec.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Introspect GraphQL endpoint
 * POST /api/specs/introspect
 */
export const introspectGraphQL = async (req, res, next) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name and URL are required',
        },
      });
    }

    // Introspect GraphQL endpoint
    let parsedSpec;
    try {
      parsedSpec = await introspectGraphQLEndpoint(url);
    } catch (introspectError) {
      logger.error('GraphQL introspection error:', introspectError);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INTROSPECTION_ERROR',
          message: `Failed to introspect GraphQL endpoint: ${introspectError.message}`,
          details: introspectError.message,
        },
      });
    }

    // Create and save API spec
    const apiSpec = new APISpec({
      name,
      type: 'graphql',
      baseUrl: url,
      specification: parsedSpec.raw,
      endpoints: parsedSpec.endpoints,
      userId: req.userId || 'default-user',
    });

    await apiSpec.save();

    logger.info(`GraphQL spec introspected: ${apiSpec.name}`);

    res.status(201).json({
      success: true,
      data: {
        id: apiSpec._id,
        name: apiSpec.name,
        type: apiSpec.type,
        baseUrl: apiSpec.baseUrl,
        endpointCount: parsedSpec.endpoints.length,
        createdAt: apiSpec.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all API specifications
 * GET /api/specs
 */
export const listSpecs = async (req, res, next) => {
  try {
    const userId = req.userId || 'default-user';
    const { type } = req.query;

    const filter = { userId };
    if (type) {
      filter.type = type;
    }

    const specs = await APISpec.find(filter)
      .select('name type baseUrl endpoints createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: specs.map(spec => ({
        id: spec._id,
        name: spec.name,
        type: spec.type,
        baseUrl: spec.baseUrl,
        endpointCount: spec.endpoints.length,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get API specification by ID
 * GET /api/specs/:id
 */
export const getSpecById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId || 'default-user';

    const spec = await APISpec.findOne({ _id: id, userId });

    if (!spec) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SPEC_NOT_FOUND',
          message: 'API specification not found',
        },
      });
    }

    res.json({
      success: true,
      data: spec,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid specification ID',
        },
      });
    }
    next(error);
  }
};

/**
 * Delete API specification
 * DELETE /api/specs/:id
 */
export const deleteSpec = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId || 'default-user';

    const spec = await APISpec.findOneAndDelete({ _id: id, userId });

    if (!spec) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SPEC_NOT_FOUND',
          message: 'API specification not found',
        },
      });
    }

    logger.info(`API spec deleted: ${spec.name} (${spec._id})`);

    res.json({
      success: true,
      message: 'API specification deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid specification ID',
        },
      });
    }
    next(error);
  }
};
