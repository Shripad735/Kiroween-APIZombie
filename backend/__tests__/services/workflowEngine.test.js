import { jest } from '@jest/globals';
import WorkflowEngine from '../../src/services/workflowEngine.service.js';

// Mock protocol handlers
const mockExecute = jest.fn();
jest.unstable_mockModule('../../src/handlers/index.js', () => ({
  getProtocolHandler: jest.fn(() => ({
    execute: mockExecute,
  })),
}));

// Mock models
jest.unstable_mockModule('../../src/models/index.js', () => ({
  AuthConfig: {
    findOne: jest.fn(),
  },
  RequestHistory: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({}),
  })),
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

describe('WorkflowEngine Service', () => {
  let engine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new WorkflowEngine();
  });

  describe('executeWorkflow', () => {
    it('should execute a simple workflow successfully', async () => {
      const workflow = {
        _id: 'workflow-1',
        name: 'Test Workflow',
        steps: [
          {
            order: 1,
            name: 'Step 1',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/users',
            },
            variableMappings: [],
          },
        ],
      };

      mockExecute.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: { users: [] },
        success: true,
      });

      const result = await engine.executeWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].success).toBe(true);
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    it('should execute multiple steps in sequence', async () => {
      const workflow = {
        _id: 'workflow-1',
        name: 'Multi-step Workflow',
        steps: [
          {
            order: 1,
            name: 'Step 1',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/users',
            },
            variableMappings: [],
          },
          {
            order: 2,
            name: 'Step 2',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/posts',
            },
            variableMappings: [],
          },
        ],
      };

      mockExecute.mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: { data: 'test' },
        success: true,
      });

      const result = await engine.executeWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });

    it('should halt execution when a step fails', async () => {
      const workflow = {
        _id: 'workflow-1',
        name: 'Failing Workflow',
        steps: [
          {
            order: 1,
            name: 'Step 1',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/users',
            },
            variableMappings: [],
          },
          {
            order: 2,
            name: 'Step 2',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/posts',
            },
            variableMappings: [],
          },
        ],
      };

      // First step fails
      mockExecute.mockResolvedValueOnce({
        statusCode: 500,
        headers: {},
        body: null,
        error: 'Server error',
        success: false,
      });

      const result = await engine.executeWorkflow(workflow);

      expect(result.success).toBe(false);
      expect(result.steps).toHaveLength(1); // Only first step executed
      expect(result.error).toContain('Step 1 failed');
      expect(mockExecute).toHaveBeenCalledTimes(1); // Second step not executed
    });

    it('should continue execution when continueOnFailure is true', async () => {
      const workflow = {
        _id: 'workflow-1',
        name: 'Continue on Failure',
        steps: [
          {
            order: 1,
            name: 'Step 1',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/users',
            },
            variableMappings: [],
            continueOnFailure: true,
          },
          {
            order: 2,
            name: 'Step 2',
            apiRequest: {
              protocol: 'rest',
              method: 'GET',
              endpoint: 'https://api.test.com/posts',
            },
            variableMappings: [],
          },
        ],
      };

      mockExecute
        .mockResolvedValueOnce({
          statusCode: 500,
          headers: {},
          body: null,
          error: 'Server error',
          success: false,
        })
        .mockResolvedValueOnce({
          statusCode: 200,
          headers: {},
          body: { data: 'test' },
          success: true,
        });

      const result = await engine.executeWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });
  });

  describe('resolveVariables', () => {
    it('should resolve variables from previous steps', () => {
      const step = {
        apiRequest: {
          protocol: 'rest',
          method: 'POST',
          endpoint: 'https://api.test.com/posts',
          body: {
            userId: '{{userId}}',
            title: 'Test Post',
          },
        },
        variableMappings: [
          {
            sourceStep: 1,
            sourcePath: 'id',
            targetVariable: 'userId',
          },
        ],
      };

      const context = {
        step1: { id: '123', name: 'John' },
      };

      const resolved = engine.resolveVariables(step, context);

      expect(resolved.body.userId).toBe('123');
      expect(resolved.body.title).toBe('Test Post');
    });

    it('should return request as-is when no variable mappings', () => {
      const step = {
        apiRequest: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://api.test.com/users',
        },
        variableMappings: [],
      };

      const context = {};
      const resolved = engine.resolveVariables(step, context);

      expect(resolved).toEqual(step.apiRequest);
    });
  });

  describe('extractResponseData', () => {
    it('should extract data using JSONPath', () => {
      const responseData = {
        user: {
          id: '123',
          name: 'John',
        },
      };

      const result = engine.extractResponseData(responseData, 'user.id');

      expect(result).toBe('123');
    });

    it('should handle nested paths', () => {
      const responseData = {
        data: {
          users: [
            { id: '1', name: 'John' },
            { id: '2', name: 'Jane' },
          ],
        },
      };

      const result = engine.extractResponseData(responseData, 'data.users[0].name');

      expect(result).toBe('John');
    });

    it('should return null for invalid paths', () => {
      const responseData = { user: { id: '123' } };
      const result = engine.extractResponseData(responseData, 'invalid.path');

      expect(result).toBeNull();
    });
  });

  describe('runAssertions', () => {
    it('should validate statusCode assertion', () => {
      const assertions = [
        { type: 'statusCode', expected: 200 },
      ];

      const response = {
        statusCode: 200,
        body: {},
      };

      const results = engine.runAssertions(assertions, response, 100);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should validate responseTime assertion', () => {
      const assertions = [
        { type: 'responseTime', expected: 1000 },
      ];

      const response = { statusCode: 200, body: {} };
      const duration = 500;

      const results = engine.runAssertions(assertions, response, duration);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
      expect(results[0].actual).toBe(500);
    });

    it('should validate bodyContains assertion', () => {
      const assertions = [
        { type: 'bodyContains', expected: 'success' },
      ];

      const response = {
        statusCode: 200,
        body: { message: 'success' },
      };

      const results = engine.runAssertions(assertions, response, 100);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should validate headerExists assertion', () => {
      const assertions = [
        { type: 'headerExists', expected: 'content-type' },
      ];

      const response = {
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: {},
      };

      const results = engine.runAssertions(assertions, response, 100);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should fail assertions when conditions not met', () => {
      const assertions = [
        { type: 'statusCode', expected: 200 },
      ];

      const response = {
        statusCode: 404,
        body: {},
      };

      const results = engine.runAssertions(assertions, response, 100);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(false);
    });
  });

  describe('getExecutionState', () => {
    it('should return current execution state', () => {
      const state = engine.getExecutionState();

      expect(state).toHaveProperty('currentStep');
      expect(state).toHaveProperty('results');
      expect(state).toHaveProperty('context');
    });
  });
});
