import { generateTestSuite, formatTestCode, executeTests } from '../services/testGenerator.service.js';
import APISpec from '../models/APISpec.js';
import TestSuite from '../models/TestSuite.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

/**
 * Generate test suite for an API endpoint
 * POST /api/tests/generate
 */
export const generateTests = async (req, res) => {
  try {
    const { apiSpecId, endpoint, name, description } = req.body;

    // Validate input
    if (!apiSpecId) {
      return res.status(400).json(
        errorResponse('INVALID_INPUT', 'API specification ID is required')
      );
    }

    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim().length === 0) {
      return res.status(400).json(
        errorResponse('INVALID_INPUT', 'Endpoint is required and must be a non-empty string')
      );
    }

    // Fetch API spec
    const apiSpec = await APISpec.findById(apiSpecId);

    if (!apiSpec) {
      return res.status(404).json(
        errorResponse('API_SPEC_NOT_FOUND', `API specification with ID ${apiSpecId} not found`)
      );
    }

    // Generate test cases using AI
    logger.info(`Generating tests for ${apiSpec.name} - ${endpoint}`);
    const testCases = await generateTestSuite(apiSpec, endpoint);

    // Create test suite document
    const testSuite = new TestSuite({
      name: name || `Test Suite for ${endpoint}`,
      description: description || `Auto-generated test suite for ${apiSpec.name} - ${endpoint}`,
      apiSpecId: apiSpec._id,
      endpoint: endpoint,
      tests: testCases,
      generatedBy: 'ai',
      userId: 'default-user', // TODO: Use actual user ID from auth
    });

    // Save to database
    await testSuite.save();

    logger.info(`Successfully generated and saved test suite with ${testCases.length} tests`);

    // Generate formatted test code
    const testCode = formatTestCode(testCases, apiSpec, endpoint);

    return res.status(201).json(
      successResponse(
        {
          testSuite: {
            id: testSuite._id,
            name: testSuite.name,
            description: testSuite.description,
            endpoint: testSuite.endpoint,
            testCount: testCases.length,
            tests: testCases,
            createdAt: testSuite.createdAt,
          },
          testCode: testCode,
        },
        'Test suite successfully generated'
      )
    );
  } catch (error) {
    logger.error('Error in generateTests controller:', error);

    // Handle specific error types
    if (error.message.includes('Groq API')) {
      return res.status(503).json(
        errorResponse(
          'LLM_SERVICE_ERROR',
          error.message,
          null,
          ['The AI service is temporarily unavailable. Please try again later.']
        )
      );
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json(
        errorResponse(
          'RATE_LIMIT_EXCEEDED',
          error.message,
          null,
          ['Too many requests. Please wait a moment before trying again.']
        )
      );
    }

    return res.status(500).json(
      errorResponse(
        'TEST_GENERATION_ERROR',
        error.message,
        null,
        ['Try selecting a different endpoint or check the API specification.']
      )
    );
  }
};

/**
 * Run test suite
 * POST /api/tests/run
 */
export const runTests = async (req, res) => {
  try {
    const { testSuiteId, testCode } = req.body;

    // Validate input
    if (!testSuiteId && !testCode) {
      return res.status(400).json(
        errorResponse(
          'INVALID_INPUT',
          'Either testSuiteId or testCode is required'
        )
      );
    }

    let codeToExecute = testCode;
    let testSuite = null;

    // If testSuiteId provided, fetch the test suite and generate code
    if (testSuiteId) {
      testSuite = await TestSuite.findById(testSuiteId).populate('apiSpecId');

      if (!testSuite) {
        return res.status(404).json(
          errorResponse('TEST_SUITE_NOT_FOUND', `Test suite with ID ${testSuiteId} not found`)
        );
      }

      // Generate test code from test suite
      codeToExecute = formatTestCode(
        testSuite.tests,
        testSuite.apiSpecId,
        testSuite.endpoint
      );
    }

    // Execute tests
    logger.info('Executing test suite');
    const results = await executeTests(codeToExecute);

    // Update test suite with results if testSuiteId was provided
    if (testSuite) {
      testSuite.lastRunAt = new Date();
      testSuite.lastRunResults = results.results;
      await testSuite.save();
    }

    logger.info('Test execution completed');

    return res.json(
      successResponse(
        {
          results: results,
          testSuiteId: testSuite?._id,
        },
        'Tests executed successfully'
      )
    );
  } catch (error) {
    logger.error('Error in runTests controller:', error);

    return res.status(500).json(
      errorResponse(
        'TEST_EXECUTION_ERROR',
        error.message,
        null,
        ['Check that the test code is valid and all dependencies are available.']
      )
    );
  }
};

/**
 * Get test suite by ID
 * GET /api/tests/:id
 */
export const getTestSuite = async (req, res) => {
  try {
    const { id } = req.params;

    const testSuite = await TestSuite.findById(id).populate('apiSpecId');

    if (!testSuite) {
      return res.status(404).json(
        errorResponse('TEST_SUITE_NOT_FOUND', `Test suite with ID ${id} not found`)
      );
    }

    // Generate test code
    const testCode = formatTestCode(
      testSuite.tests,
      testSuite.apiSpecId,
      testSuite.endpoint
    );

    return res.json(
      successResponse({
        testSuite: {
          id: testSuite._id,
          name: testSuite.name,
          description: testSuite.description,
          endpoint: testSuite.endpoint,
          apiSpec: {
            id: testSuite.apiSpecId._id,
            name: testSuite.apiSpecId.name,
            type: testSuite.apiSpecId.type,
          },
          testCount: testSuite.tests.length,
          tests: testSuite.tests,
          lastRunAt: testSuite.lastRunAt,
          lastRunResults: testSuite.lastRunResults,
          createdAt: testSuite.createdAt,
          updatedAt: testSuite.updatedAt,
        },
        testCode: testCode,
      })
    );
  } catch (error) {
    logger.error('Error in getTestSuite controller:', error);

    return res.status(500).json(
      errorResponse('GET_TEST_SUITE_ERROR', error.message)
    );
  }
};

/**
 * List all test suites
 * GET /api/tests
 */
export const listTestSuites = async (req, res) => {
  try {
    const { apiSpecId, limit = 50, skip = 0 } = req.query;

    const query = { userId: 'default-user' }; // TODO: Use actual user ID from auth

    if (apiSpecId) {
      query.apiSpecId = apiSpecId;
    }

    const testSuites = await TestSuite.find(query)
      .populate('apiSpecId', 'name type baseUrl')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await TestSuite.countDocuments(query);

    return res.json(
      successResponse({
        testSuites: testSuites.map((ts) => ({
          id: ts._id,
          name: ts.name,
          description: ts.description,
          endpoint: ts.endpoint,
          apiSpec: ts.apiSpecId
            ? {
                id: ts.apiSpecId._id,
                name: ts.apiSpecId.name,
                type: ts.apiSpecId.type,
              }
            : null,
          testCount: ts.tests.length,
          lastRunAt: ts.lastRunAt,
          lastRunResults: ts.lastRunResults,
          createdAt: ts.createdAt,
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: total > parseInt(skip) + parseInt(limit),
        },
      })
    );
  } catch (error) {
    logger.error('Error in listTestSuites controller:', error);

    return res.status(500).json(
      errorResponse('LIST_TEST_SUITES_ERROR', error.message)
    );
  }
};

/**
 * Delete test suite
 * DELETE /api/tests/:id
 */
export const deleteTestSuite = async (req, res) => {
  try {
    const { id } = req.params;

    const testSuite = await TestSuite.findByIdAndDelete(id);

    if (!testSuite) {
      return res.status(404).json(
        errorResponse('TEST_SUITE_NOT_FOUND', `Test suite with ID ${id} not found`)
      );
    }

    logger.info(`Deleted test suite: ${testSuite.name}`);

    return res.json(
      successResponse(
        { id: testSuite._id },
        'Test suite successfully deleted'
      )
    );
  } catch (error) {
    logger.error('Error in deleteTestSuite controller:', error);

    return res.status(500).json(
      errorResponse('DELETE_TEST_SUITE_ERROR', error.message)
    );
  }
};
