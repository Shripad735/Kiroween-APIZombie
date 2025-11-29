import { jest } from '@jest/globals';
import {
  translateRESTtoGraphQL,
  translateGraphQLtoREST,
  translateProtocol,
  clearCache,
  getCacheStats,
} from '../../src/services/protocolTranslator.service.js';

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
    temperature: 0.3,
    max_completion_tokens: 1024,
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

describe('ProtocolTranslator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
  });

  describe('translateRESTtoGraphQL', () => {
    it('should translate REST GET to GraphQL query', async () => {
      const restRequest = {
        method: 'GET',
        endpoint: 'https://api.test.com/users',
        headers: {},
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'graphql',
                query: 'query { users { id name } }',
                operationType: 'query',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateRESTtoGraphQL(restRequest);

      expect(result.protocol).toBe('graphql');
      expect(result.query).toBeDefined();
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should translate REST POST to GraphQL mutation', async () => {
      const restRequest = {
        method: 'POST',
        endpoint: 'https://api.test.com/users',
        headers: { 'Content-Type': 'application/json' },
        body: { name: 'John' },
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'graphql',
                query: 'mutation { createUser(name: "John") { id name } }',
                operationType: 'mutation',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateRESTtoGraphQL(restRequest);

      expect(result.protocol).toBe('graphql');
      expect(result.operationType).toBe('mutation');
    });

    it('should use cache for identical translations', async () => {
      const restRequest = {
        method: 'GET',
        endpoint: 'https://api.test.com/users',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'graphql',
                query: 'query { users { id } }',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await translateRESTtoGraphQL(restRequest);
      expect(mockCreate).toHaveBeenCalledTimes(1);

      await translateRESTtoGraphQL(restRequest);
      expect(mockCreate).toHaveBeenCalledTimes(1); // Still 1, used cache
    });

    it('should throw error for invalid REST request', async () => {
      await expect(translateRESTtoGraphQL(null)).rejects.toThrow('Invalid REST request');
    });

    it('should throw error when translation missing query', async () => {
      const restRequest = {
        method: 'GET',
        endpoint: 'https://api.test.com/users',
      };

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'graphql',
              }),
            },
          },
        ],
      });

      await expect(translateRESTtoGraphQL(restRequest)).rejects.toThrow('missing GraphQL query');
    });
  });

  describe('translateGraphQLtoREST', () => {
    it('should translate GraphQL query to REST GET', async () => {
      const graphqlRequest = {
        query: 'query { users { id name } }',
        operationType: 'query',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'rest',
                method: 'GET',
                endpoint: '/users',
                headers: {},
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateGraphQLtoREST(graphqlRequest);

      expect(result.protocol).toBe('rest');
      expect(result.method).toBe('GET');
      expect(result.endpoint).toBeDefined();
    });

    it('should translate GraphQL mutation to REST POST', async () => {
      const graphqlRequest = {
        query: 'mutation { createUser(name: "John") { id } }',
        operationType: 'mutation',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'rest',
                method: 'POST',
                endpoint: '/users',
                body: { name: 'John' },
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateGraphQLtoREST(graphqlRequest);

      expect(result.protocol).toBe('rest');
      expect(result.method).toBe('POST');
    });

    it('should add default Content-Type header when body exists', async () => {
      const graphqlRequest = {
        query: 'mutation { createUser(name: "John") { id } }',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                method: 'POST',
                endpoint: '/users',
                body: { name: 'John' },
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateGraphQLtoREST(graphqlRequest);

      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should throw error for invalid GraphQL request', async () => {
      await expect(translateGraphQLtoREST({})).rejects.toThrow('missing query field');
    });
  });

  describe('translateProtocol', () => {
    it('should route REST to GraphQL translation', async () => {
      const restRequest = {
        method: 'GET',
        endpoint: 'https://api.test.com/users',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'graphql',
                query: 'query { users { id } }',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateProtocol(restRequest, 'rest', 'graphql');

      expect(result.sourceProtocol).toBe('rest');
      expect(result.targetProtocol).toBe('graphql');
      expect(result.translated).toBeDefined();
      expect(result.explanation).toBeDefined();
    });

    it('should throw error for same source and target protocols', async () => {
      const request = { method: 'GET', endpoint: '/users' };

      await expect(translateProtocol(request, 'rest', 'rest')).rejects.toThrow(
        'Source and target protocols cannot be the same'
      );
    });

    it('should throw error for unsupported protocols', async () => {
      const request = { method: 'GET', endpoint: '/users' };

      await expect(translateProtocol(request, 'soap', 'rest')).rejects.toThrow(
        'not supported'
      );
    });

    it('should handle GraphQL to REST translation', async () => {
      const graphqlRequest = {
        query: 'query { users { id } }',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                method: 'GET',
                endpoint: '/users',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await translateProtocol(graphqlRequest, 'graphql', 'rest');

      expect(result.sourceProtocol).toBe('graphql');
      expect(result.targetProtocol).toBe('rest');
    });
  });

  describe('Cache Management', () => {
    it('should clear translation cache', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('ttl');
    });
  });
});
