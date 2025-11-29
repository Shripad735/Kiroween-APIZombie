import { jest } from '@jest/globals';
import { parseNaturalLanguage, buildPrompt, clearCache, getCacheStats } from '../../src/services/nlEngine.service.js';

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
    debug: jest.fn(),
  },
}));

describe('NLEngine Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
  });

  describe('buildPrompt', () => {
    it('should build a basic prompt without API spec', () => {
      const input = 'get all users';
      const prompt = buildPrompt(input, null);

      expect(prompt).toContain(input);
      expect(prompt).toContain('Natural Language Input');
      expect(prompt).toContain('Generate a JSON object');
    });

    it('should include API spec context when provided', () => {
      const input = 'get all users';
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints: [
          { method: 'GET', path: '/users', description: 'Get all users' },
        ],
      };

      const prompt = buildPrompt(input, apiSpec);

      expect(prompt).toContain('Test API');
      expect(prompt).toContain('https://api.test.com');
      expect(prompt).toContain('/users');
    });

    it('should limit endpoints to 20 when spec has many endpoints', () => {
      const input = 'test';
      const endpoints = Array.from({ length: 30 }, (_, i) => ({
        method: 'GET',
        path: `/endpoint${i}`,
      }));
      
      const apiSpec = {
        name: 'Test API',
        baseUrl: 'https://api.test.com',
        type: 'rest',
        endpoints,
      };

      const prompt = buildPrompt(input, apiSpec);

      expect(prompt).toContain('and 10 more endpoints');
    });
  });

  describe('parseNaturalLanguage', () => {
    it('should parse natural language and return API request', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'rest',
                method: 'GET',
                endpoint: '/users',
                headers: { 'Content-Type': 'application/json' },
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await parseNaturalLanguage('get all users');

      expect(result).toHaveProperty('protocol', 'rest');
      expect(result).toHaveProperty('method', 'GET');
      expect(result).toHaveProperty('endpoint', '/users');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should use cache for identical inputs', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'rest',
                method: 'GET',
                endpoint: '/users',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      // First call
      await parseNaturalLanguage('get all users');
      expect(mockCreate).toHaveBeenCalledTimes(1);

      // Second call with same input should use cache
      await parseNaturalLanguage('get all users');
      expect(mockCreate).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should set default protocol to rest if missing', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                endpoint: '/users',
                method: 'GET',
              }),
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await parseNaturalLanguage('get all users');

      expect(result.protocol).toBe('rest');
    });

    it('should add default Content-Type header when body exists', async () => {
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

      const result = await parseNaturalLanguage('create a user named John');

      expect(result.headers['Content-Type']).toBe('application/json');
    });

    it('should throw error when LLM returns empty response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      await expect(parseNaturalLanguage('test')).rejects.toThrow('Empty response from Groq API');
    });

    it('should throw error when LLM returns invalid JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'This is not JSON' } }],
      });

      await expect(parseNaturalLanguage('test')).rejects.toThrow('No valid JSON found in LLM response');
    });

    it('should throw error when generated request missing endpoint', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                protocol: 'rest',
                method: 'GET',
              }),
            },
          },
        ],
      });

      await expect(parseNaturalLanguage('test')).rejects.toThrow('Generated request missing endpoint or query');
    });

    it('should handle API key errors', async () => {
      mockCreate.mockRejectedValue(new Error('API key is invalid'));

      await expect(parseNaturalLanguage('test')).rejects.toThrow('Groq API key is invalid or missing');
    });

    it('should handle rate limit errors', async () => {
      mockCreate.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(parseNaturalLanguage('test')).rejects.toThrow('Rate limit exceeded for Groq API');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('ttl');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.ttl).toBe('number');
    });
  });
});
