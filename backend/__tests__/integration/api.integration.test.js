// Integration tests for API endpoints
// Note: These tests require MongoDB to be running

import request from 'supertest';
import mongoose from 'mongoose';
import app from './testServer.js';
import APISpec from '../../src/models/APISpec.js';
import APIRequest from '../../src/models/APIRequest.js';
import Workflow from '../../src/models/Workflow.js';
import TestSuite from '../../src/models/TestSuite.js';
import RequestHistory from '../../src/models/RequestHistory.js';

// Test data
const sampleOpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        responses: { '200': { description: 'Success' } }
      },
      post: {
        summary: 'Create user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '201': { description: 'Created' } }
      }
    }
  }
};

const sampleGraphQLSchema = `
  type User {
    id: ID!
    name: String!
    email: String!
  }
  
  type Query {
    users: [User!]!
    user(id: ID!): User
  }
  
  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`;

describe('API Integration Tests', () => {
  let apiSpecId;
  let savedRequestId;
  let workflowId;

  beforeAll(async () => {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    // Clear test data before each test
    await APISpec.deleteMany({});
    await APIRequest.deleteMany({});
    await Workflow.deleteMany({});
    await TestSuite.deleteMany({});
    await RequestHistory.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close connections
    await mongoose.connection.close();
  });

  // ==================== /api/specs endpoints ====================
  describe('POST /api/specs/upload', () => {
    it('should upload and parse OpenAPI specification', async () => {
      const response = await request(app)
        .post('/api/specs/upload')
        .send({
          name: 'Test API',
          type: 'openapi',
          baseUrl: 'https://api.example.com',
          specification: sampleOpenAPISpec
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test API');
      expect(response.body.data.type).toBe('openapi');
      expect(response.body.data.endpointCount).toBeGreaterThan(0);

      apiSpecId = response.body.data.id;
    });

    it('should upload and parse GraphQL schema', async () => {
      const response = await request(app)
        .post('/api/specs/upload')
        .send({
          name: 'GraphQL API',
          type: 'graphql',
          baseUrl: 'https://api.example.com/graphql',
          specification: sampleGraphQLSchema
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('graphql');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/specs/upload')
        .send({
          name: 'Test API'
          // Missing type and baseUrl
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('should return error for invalid type', async () => {
      const response = await request(app)
        .post('/api/specs/upload')
        .send({
          name: 'Test API',
          type: 'invalid',
          baseUrl: 'https://api.example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TYPE');
    });
  });

  describe('GET /api/specs', () => {
    beforeEach(async () => {
      // Create test specs
      await APISpec.create({
        name: 'Test API 1',
        type: 'openapi',
        baseUrl: 'https://api1.example.com',
        specification: sampleOpenAPISpec,
        endpoints: [{ path: '/users', method: 'GET' }],
        userId: 'default-user'
      });

      await APISpec.create({
        name: 'Test API 2',
        type: 'graphql',
        baseUrl: 'https://api2.example.com/graphql',
        specification: {},
        endpoints: [{ name: 'users', type: 'query' }],
        userId: 'default-user'
      });
    });

    it('should list all API specifications', async () => {
      const response = await request(app)
        .get('/api/specs');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('type');
    });

    it('should filter specs by type', async () => {
      const response = await request(app)
        .get('/api/specs?type=graphql');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('graphql');
    });
  });

  describe('GET /api/specs/:id', () => {
    beforeEach(async () => {
      const spec = await APISpec.create({
        name: 'Test API',
        type: 'openapi',
        baseUrl: 'https://api.example.com',
        specification: sampleOpenAPISpec,
        endpoints: [{ path: '/users', method: 'GET' }],
        userId: 'default-user'
      });
      apiSpecId = spec._id.toString();
    });

    it('should get API specification by ID', async () => {
      const response = await request(app)
        .get(`/api/specs/${apiSpecId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test API');
      expect(response.body.data.endpoints).toBeDefined();
    });

    it('should return 404 for non-existent spec', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/specs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SPEC_NOT_FOUND');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/specs/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/specs/:id', () => {
    beforeEach(async () => {
      const spec = await APISpec.create({
        name: 'Test API',
        type: 'openapi',
        baseUrl: 'https://api.example.com',
        specification: sampleOpenAPISpec,
        endpoints: [],
        userId: 'default-user'
      });
      apiSpecId = spec._id.toString();
    });

    it('should delete API specification', async () => {
      const response = await request(app)
        .delete(`/api/specs/${apiSpecId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const spec = await APISpec.findById(apiSpecId);
      expect(spec).toBeNull();
    });

    it('should return 404 for non-existent spec', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/specs/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== /api/nl/parse endpoint ====================
  describe('POST /api/nl/parse', () => {
    it('should parse natural language without API spec', async () => {
      const response = await request(app)
        .post('/api/nl/parse')
        .send({
          input: 'get all users from the API'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.request).toBeDefined();
      expect(response.body.data.request).toHaveProperty('protocol');
      expect(response.body.data.request).toHaveProperty('endpoint');
    });

    it('should parse natural language with API spec', async () => {
      // Create API spec first
      const spec = await APISpec.create({
        name: 'Test API',
        type: 'openapi',
        baseUrl: 'https://api.example.com',
        specification: sampleOpenAPISpec,
        endpoints: [{ path: '/users', method: 'GET' }],
        userId: 'default-user'
      });

      const response = await request(app)
        .post('/api/nl/parse')
        .send({
          input: 'get all users',
          apiSpecId: spec._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.request).toBeDefined();
    });

    it('should return error for empty input', async () => {
      const response = await request(app)
        .post('/api/nl/parse')
        .send({
          input: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for missing input', async () => {
      const response = await request(app)
        .post('/api/nl/parse')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== /api/execute endpoint ====================
  describe('POST /api/execute', () => {
    it('should execute REST API request', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://jsonplaceholder.typicode.com/users/1',
          headers: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('duration');
    });

    it('should return error for missing protocol', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          method: 'GET',
          endpoint: 'https://api.example.com/users'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid protocol', async () => {
      const response = await request(app)
        .post('/api/execute')
        .send({
          protocol: 'invalid',
          method: 'GET',
          endpoint: 'https://api.example.com/users'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== /api/execute/workflow endpoint ====================
  describe('POST /api/execute/workflow', () => {
    it('should execute workflow with single step', async () => {
      const response = await request(app)
        .post('/api/execute/workflow')
        .send({
          name: 'Test Workflow',
          steps: [
            {
              order: 1,
              apiRequest: {
                protocol: 'rest',
                method: 'GET',
                endpoint: 'https://jsonplaceholder.typicode.com/users/1',
                headers: {}
              }
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.results[0]).toHaveProperty('success');
    });

    it('should execute workflow with multiple steps', async () => {
      const response = await request(app)
        .post('/api/execute/workflow')
        .send({
          name: 'Multi-step Workflow',
          steps: [
            {
              order: 1,
              apiRequest: {
                protocol: 'rest',
                method: 'GET',
                endpoint: 'https://jsonplaceholder.typicode.com/users/1',
                headers: {}
              }
            },
            {
              order: 2,
              apiRequest: {
                protocol: 'rest',
                method: 'GET',
                endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
                headers: {}
              }
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(2);
    });

    it('should return error for missing steps', async () => {
      const response = await request(app)
        .post('/api/execute/workflow')
        .send({
          name: 'Test Workflow'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== /api/translate endpoint ====================
  describe('POST /api/translate', () => {
    it('should translate REST to GraphQL', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          sourceProtocol: 'rest',
          targetProtocol: 'graphql',
          request: {
            method: 'GET',
            endpoint: '/users',
            headers: {}
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('translated');
      expect(response.body.data).toHaveProperty('explanation');
    });

    it('should return error for missing source protocol', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          targetProtocol: 'graphql',
          request: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid protocol', async () => {
      const response = await request(app)
        .post('/api/translate')
        .send({
          sourceProtocol: 'invalid',
          targetProtocol: 'graphql',
          request: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ==================== /api/tests/* endpoints ====================
  describe('POST /api/tests/generate', () => {
    beforeEach(async () => {
      const spec = await APISpec.create({
        name: 'Test API',
        type: 'openapi',
        baseUrl: 'https://api.example.com',
        specification: sampleOpenAPISpec,
        endpoints: [{ path: '/users', method: 'GET' }],
        userId: 'default-user'
      });
      apiSpecId = spec._id.toString();
    });

    it('should generate test suite for endpoint', async () => {
      const response = await request(app)
        .post('/api/tests/generate')
        .send({
          apiSpecId: apiSpecId,
          endpoint: '/users',
          method: 'GET'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tests).toBeDefined();
      expect(Array.isArray(response.body.data.tests)).toBe(true);
    });

    it('should return error for missing API spec ID', async () => {
      const response = await request(app)
        .post('/api/tests/generate')
        .send({
          endpoint: '/users',
          method: 'GET'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tests/:id', () => {
    beforeEach(async () => {
      const testSuite = await TestSuite.create({
        name: 'User API Tests',
        apiSpecId: new mongoose.Types.ObjectId(),
        endpoint: '/users',
        tests: [
          {
            name: 'Get all users',
            description: 'Should return list of users',
            request: {
              protocol: 'rest',
              method: 'GET',
              endpoint: '/users',
              headers: {}
            },
            expectedResponse: {
              statusCode: 200
            },
            category: 'success'
          }
        ],
        userId: 'default-user'
      });
      savedRequestId = testSuite._id.toString();
    });

    it('should get test suite by ID', async () => {
      const response = await request(app)
        .get(`/api/tests/${savedRequestId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('User API Tests');
    });
  });

  // ==================== /api/saved/* endpoints ====================
  describe('POST /api/saved/requests', () => {
    it('should save API request', async () => {
      const response = await request(app)
        .post('/api/saved/requests')
        .send({
          name: 'Get Users',
          description: 'Fetch all users',
          request: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://api.example.com/users',
            headers: {}
          },
          tags: ['users', 'get']
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      savedRequestId = response.body.data.id;
    });

    it('should return error for missing request data', async () => {
      const response = await request(app)
        .post('/api/saved/requests')
        .send({
          name: 'Get Users'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/saved/requests', () => {
    beforeEach(async () => {
      await APIRequest.create({
        name: 'Get Users',
        description: 'Fetch all users',
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://api.example.com/users',
        headers: {},
        tags: ['users'],
        userId: 'default-user'
      });

      await APIRequest.create({
        name: 'Create User',
        description: 'Create new user',
        protocol: 'rest',
        method: 'POST',
        endpoint: 'https://api.example.com/users',
        headers: {},
        body: { name: 'Test' },
        tags: ['users'],
        userId: 'default-user'
      });
    });

    it('should list all saved requests', async () => {
      const response = await request(app)
        .get('/api/saved/requests');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter saved requests by tag', async () => {
      const response = await request(app)
        .get('/api/saved/requests?tag=users');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/saved/workflows', () => {
    it('should save workflow', async () => {
      const response = await request(app)
        .post('/api/saved/workflows')
        .send({
          name: 'User Creation Flow',
          description: 'Create and verify user',
          steps: [
            {
              order: 1,
              apiRequest: {
                protocol: 'rest',
                method: 'POST',
                endpoint: 'https://api.example.com/users',
                headers: {},
                body: { name: 'Test User' }
              }
            }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      workflowId = response.body.data.id;
    });

    it('should return error for missing steps', async () => {
      const response = await request(app)
        .post('/api/saved/workflows')
        .send({
          name: 'User Creation Flow',
          description: 'Create and verify user'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/saved/workflows', () => {
    beforeEach(async () => {
      await Workflow.create({
        name: 'Test Workflow',
        description: 'Test workflow description',
        steps: [
          {
            order: 1,
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: '/users',
              headers: {}
            }
          }
        ],
        userId: 'default-user'
      });
    });

    it('should list all saved workflows', async () => {
      const response = await request(app)
        .get('/api/saved/workflows');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Workflow');
    });
  });

  // ==================== /api/history endpoint ====================
  describe('GET /api/history', () => {
    beforeEach(async () => {
      // Create test history entries
      await RequestHistory.create({
        userId: 'default-user',
        request: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://api.example.com/users',
          headers: {}
        },
        response: {
          statusCode: 200,
          data: { users: [] }
        },
        duration: 150,
        success: true
      });

      await RequestHistory.create({
        userId: 'default-user',
        request: {
          protocol: 'rest',
          method: 'POST',
          endpoint: 'https://api.example.com/users',
          headers: {},
          body: { name: 'Test' }
        },
        response: {
          statusCode: 500,
          data: { error: 'Server error' }
        },
        duration: 200,
        success: false
      });
    });

    it('should get request history', async () => {
      const response = await request(app)
        .get('/api/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('request');
      expect(response.body.data[0]).toHaveProperty('response');
      expect(response.body.data[0]).toHaveProperty('duration');
    });

    it('should filter history by success status', async () => {
      const response = await request(app)
        .get('/api/history?success=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].success).toBe(true);
    });

    it('should filter history by protocol', async () => {
      const response = await request(app)
        .get('/api/history?protocol=rest');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/history', () => {
    beforeEach(async () => {
      await RequestHistory.create({
        userId: 'default-user',
        request: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://api.example.com/users',
          headers: {}
        },
        response: { statusCode: 200 },
        duration: 150,
        success: true
      });
    });

    it('should clear request history', async () => {
      const response = await request(app)
        .delete('/api/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const history = await RequestHistory.find({ userId: 'default-user' });
      expect(history).toHaveLength(0);
    });
  });
});
