/**
 * Test script for Test Generator Engine
 * Tests the /api/tests endpoints
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

let testApiSpecId = null;
let testSuiteId = null;

/**
 * Test 1: Create a sample API spec for testing
 */
async function createSampleAPISpec() {
  log.section('Test 1: Creating sample API spec for test generation');

  try {
    const sampleSpec = {
      name: 'Sample User API',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: {
        openapi: '3.0.0',
        info: { title: 'User API', version: '1.0.0' },
      },
      endpoints: [
        {
          path: '/users',
          method: 'GET',
          description: 'Get all users',
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                },
              },
            },
          },
        },
        {
          path: '/users',
          method: 'POST',
          description: 'Create a new user',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    age: { type: 'number' },
                  },
                  required: ['name', 'email'],
                },
              },
            },
          },
          responses: {
            '201': { description: 'User created' },
            '400': { description: 'Invalid input' },
          },
        },
        {
          path: '/users/{id}',
          method: 'GET',
          description: 'Get user by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': { description: 'Success' },
            '404': { description: 'User not found' },
          },
        },
      ],
    };

    const response = await axios.post(`${API_URL}/specs/upload`, sampleSpec);

    if (response.data.success && response.data.data.id) {
      testApiSpecId = response.data.data.id;
      log.success(`Created sample API spec with ID: ${testApiSpecId}`);
      return true;
    } else {
      log.error('Failed to create sample API spec');
      return false;
    }
  } catch (error) {
    log.error(`Error creating sample API spec: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 2: Generate test suite for an endpoint
 */
async function testGenerateTestSuite() {
  log.section('Test 2: Generating test suite for /users endpoint');

  try {
    const requestData = {
      apiSpecId: testApiSpecId,
      endpoint: '/users',
      name: 'User API Test Suite',
      description: 'Comprehensive tests for user management endpoints',
    };

    log.info('Sending request to generate tests...');
    const response = await axios.post(`${API_URL}/tests/generate`, requestData);

    if (response.data.success && response.data.data.testSuite) {
      const testSuite = response.data.data.testSuite;
      testSuiteId = testSuite.id;

      log.success(`Generated test suite with ID: ${testSuiteId}`);
      log.info(`Test suite name: ${testSuite.name}`);
      log.info(`Number of tests: ${testSuite.testCount}`);

      // Display test categories
      const categories = {};
      testSuite.tests.forEach((test) => {
        categories[test.category] = (categories[test.category] || 0) + 1;
      });

      log.info('Test breakdown by category:');
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} tests`);
      });

      // Display first test as example
      if (testSuite.tests.length > 0) {
        log.info('\nExample test case:');
        console.log(JSON.stringify(testSuite.tests[0], null, 2));
      }

      // Check if test code was generated
      if (response.data.data.testCode) {
        log.success('Jest test code generated successfully');
        log.info('First 500 characters of test code:');
        console.log(response.data.data.testCode.substring(0, 500) + '...\n');
      }

      return true;
    } else {
      log.error('Failed to generate test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error generating test suite: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 3: Get test suite by ID
 */
async function testGetTestSuite() {
  log.section('Test 3: Retrieving test suite by ID');

  try {
    const response = await axios.get(`${API_URL}/tests/${testSuiteId}`);

    if (response.data.success && response.data.data.testSuite) {
      const testSuite = response.data.data.testSuite;
      log.success(`Retrieved test suite: ${testSuite.name}`);
      log.info(`Endpoint: ${testSuite.endpoint}`);
      log.info(`Test count: ${testSuite.testCount}`);
      log.info(`Created at: ${testSuite.createdAt}`);
      return true;
    } else {
      log.error('Failed to retrieve test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error retrieving test suite: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 4: List all test suites
 */
async function testListTestSuites() {
  log.section('Test 4: Listing all test suites');

  try {
    const response = await axios.get(`${API_URL}/tests`);

    if (response.data.success && response.data.data.testSuites) {
      const testSuites = response.data.data.testSuites;
      log.success(`Retrieved ${testSuites.length} test suite(s)`);

      testSuites.forEach((ts, index) => {
        console.log(`\n  ${index + 1}. ${ts.name}`);
        console.log(`     Endpoint: ${ts.endpoint}`);
        console.log(`     Tests: ${ts.testCount}`);
        console.log(`     API: ${ts.apiSpec?.name || 'N/A'}`);
      });

      return true;
    } else {
      log.error('Failed to list test suites');
      return false;
    }
  } catch (error) {
    log.error(`Error listing test suites: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 5: Run test suite (mock execution)
 */
async function testRunTestSuite() {
  log.section('Test 5: Running test suite');

  try {
    const requestData = {
      testSuiteId: testSuiteId,
    };

    const response = await axios.post(`${API_URL}/tests/run`, requestData);

    if (response.data.success) {
      log.success('Test suite execution initiated');
      log.info('Note: Actual test execution is not fully implemented yet');

      if (response.data.data.results) {
        console.log('\nResults:', JSON.stringify(response.data.data.results, null, 2));
      }

      return true;
    } else {
      log.error('Failed to run test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error running test suite: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 6: Generate tests for different endpoint
 */
async function testGenerateForDifferentEndpoint() {
  log.section('Test 6: Generating tests for /users/{id} endpoint');

  try {
    const requestData = {
      apiSpecId: testApiSpecId,
      endpoint: '/users/{id}',
      name: 'Get User By ID Tests',
    };

    const response = await axios.post(`${API_URL}/tests/generate`, requestData);

    if (response.data.success && response.data.data.testSuite) {
      const testSuite = response.data.data.testSuite;
      log.success(`Generated test suite with ${testSuite.testCount} tests`);
      return true;
    } else {
      log.error('Failed to generate test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error generating test suite: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 7: Delete test suite
 */
async function testDeleteTestSuite() {
  log.section('Test 7: Deleting test suite');

  try {
    const response = await axios.delete(`${API_URL}/tests/${testSuiteId}`);

    if (response.data.success) {
      log.success(`Deleted test suite with ID: ${testSuiteId}`);
      return true;
    } else {
      log.error('Failed to delete test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error deleting test suite: ${error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test 8: Error handling - Invalid API spec ID
 */
async function testErrorHandling() {
  log.section('Test 8: Testing error handling with invalid API spec ID');

  try {
    const requestData = {
      apiSpecId: '000000000000000000000000', // Invalid ID
      endpoint: '/users',
    };

    await axios.post(`${API_URL}/tests/generate`, requestData);
    log.error('Should have thrown an error for invalid API spec ID');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      log.success('Correctly handled invalid API spec ID with 404 error');
      return true;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║         Test Generator Engine - Integration Tests         ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  log.info(`Testing API at: ${BASE_URL}`);
  log.info('Make sure the backend server is running!\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: 'Create Sample API Spec', fn: createSampleAPISpec },
    { name: 'Generate Test Suite', fn: testGenerateTestSuite },
    { name: 'Get Test Suite', fn: testGetTestSuite },
    { name: 'List Test Suites', fn: testListTestSuites },
    { name: 'Run Test Suite', fn: testRunTestSuite },
    { name: 'Generate for Different Endpoint', fn: testGenerateForDifferentEndpoint },
    { name: 'Delete Test Suite', fn: testDeleteTestSuite },
    { name: 'Error Handling', fn: testErrorHandling },
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\n${colors.yellow}Test Summary:${colors.reset}`);
  console.log(`  Total:  ${results.total}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
