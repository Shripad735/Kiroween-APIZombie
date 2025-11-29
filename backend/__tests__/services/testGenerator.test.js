import { jest } from '@jest/globals';
import { generateTestSuite, formatTestCode } from '../../src/services/testGenerator.service.js';

// Mock the Groq SDK
const mockCreate = jest.fn();
jest.unstable_mockModule('../../src/config/groq.js', () => ({
  default: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
  GROQ_CONFIG: {
    model: 'test-model',
    temperature: 0.7,
    max_completion_tokens: 8192,
    top_p: 1,
    stream: false,
    stop: null,
  },
}));

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('TestGenerator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTestSuite', () => {
    it('should generate comprehensive test suite', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [
          {
            path: '/users',
            method: 'GET',
            description: 'Get all users',
          },
        ],
      };

      const mockTests = [
        {
          name: 'Should get all users successfully',
          description: 'Valid request returns user list',
          request: {
            protocol: 'rest',
            method: 'GET',
            endpoint: '/users',
            headers: {},
          },
          expectedResponse: {
            statusCode: 200,
            assertions: [],
          },
          category: 'success',
        },
        {
          name: 'Should handle invalid auth',
          description: 'Missing auth returns 401',
          request: {
            protocol: 'rest',
            method: 'GET',
            endpoint: '/users',
            headers: {},
          },
          expectedResponse: {
            statusCode: 401,
            assertions: [],
          },
          category: 'security',
        },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTests),
            },
          },
        ],
      });

      const result = await generateTestSuite(apiSpec, '/users');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('request');
      expect(result[0]).toHaveProperty('expectedResponse');
      expect(result[0]).toHaveProperty('category');
    });

    it('should validate and fix test case structure', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [],
      };

      const mockTests = [
        {
          // Missing name and category
          request: {
            protocol: 'rest',
            method: 'GET',
            endpoint: '/users',
          },
        },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockTests),
            },
          },
        ],
      });

      const result = await generateTestSuite(apiSpec, '/users');

      expect(result[0].name).toBeDefined();
      expect(result[0].category).toBe('success');
      expect(result[0].expectedResponse).toBeDefined();
    });

    it('should throw error when LLM returns empty response', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(generateTestSuite(apiSpec, '/users')).rejects.toThrow('Empty response from Groq API');
    });

    it('should throw error when LLM returns invalid JSON', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Not a JSON array' } }],
      });

      await expect(generateTestSuite(apiSpec, '/users')).rejects.toThrow('No valid JSON array found');
    });

    it('should throw error when test suite is empty', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '[]' } }],
      });

      await expect(generateTestSuite(apiSpec, '/users')).rejects.toThrow('empty or invalid');
    });

    it('should handle API key errors', async () => {
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [],
      };

      mockCreate.mockRejectedValue(new Error('API key is invalid'));

      await expect(generateTestSuite(apiSpec, '/users')).rejects.toThrow('Groq API key is invalid');
    });
  });

  describe('formatTestCode', () => {
    it('should format test cases as Jest code', () => {
      const testCases = [
        {
          name: 'Should get all users',
          description: 'Valid request',
          request: {
            protocol: 'rest',
            method: 'GET',
            endpoint: '/users',
            headers: {},
          },
          expectedResponse: {
            statusCode: 200,
            assertions: [
              {
                type: 'equals',
                path: '$.data.length',
                expected: 10,
              },
            ],
          },
          category: 'success',
        },
      ];

      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
      };

      const code = formatTestCode(testCases, apiSpec, '/users');

      expect(code).toContain('describe');
      expect(code).toContain('test');
      expect(code).toContain('expect');
      expect(code).toContain('axios');
      expect(code).toContain('Should get all users');
    });

    it('should group tests by category', () => {
      const testCases = [
        {
          name: 'Success test',
          request: { protocol: 'rest', method: 'GET', endpoint: '/users' },
          expectedResponse: { statusCode: 200, assertions: [] },
          category: 'success',
        },
        {
          name: 'Error test',
          request: { protocol: 'rest', method: 'GET', endpoint: '/users' },
          expectedResponse: { statusCode: 404, assertions: [] },
          category: 'error',
        },
      ];

      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
      };

      const code = formatTestCode(testCases, apiSpec, '/users');

      expect(code).toContain('SUCCESS CASES');
      expect(code).toContain('ERROR CASES');
    });

    it('should handle POST requests with body', () => {
      const testCases = [
        {
          name: 'Create user',
          request: {
            protocol: 'rest',
            method: 'POST',
            endpoint: '/users',
            body: { name: 'John' },
          },
          expectedResponse: { statusCode: 201, assertions: [] },
          category: 'success',
        },
      ];

      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
      };

      const code = formatTestCode(testCases, apiSpec, '/users');

      expect(code).toContain('axios.post');
      expect(code).toContain('John');
    });

    it('should handle GraphQL requests', () => {
      const testCases = [
        {
          name: 'Query users',
          request: {
            protocol: 'graphql',
            query: 'query { users { id } }',
            variables: {},
          },
          expectedResponse: { statusCode: 200, assertions: [] },
          category: 'success',
        },
      ];

      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
      };

      const code = formatTestCode(testCases, apiSpec, '/graphql');

      expect(code).toContain('query { users { id } }');
    });
  });
});
