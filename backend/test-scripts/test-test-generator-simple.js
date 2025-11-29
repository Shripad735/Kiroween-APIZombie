/**
 * Simplified Test script for Test Generator Engine
 * Directly creates API spec in database to test test generation
 */

import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import APISpec from '../src/models/APISpec.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// ANSI color codes
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
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log.success('Connected to MongoDB');
    return true;
  } catch (error) {
    log.error(`MongoDB connection error: ${error.message}`);
    return false;
  }
}

/**
 * Create API spec directly in database
 */
async function createAPISpecInDB() {
  log.section('Creating API spec directly in database');

  try {
    const apiSpec = new APISpec({
      name: 'Test User API',
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
            '200': { description: 'Success' },
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
      userId: 'default-user',
    });

    await apiSpec.save();
    testApiSpecId = apiSpec._id.toString();
    log.success(`Created API spec with ID: ${testApiSpecId}`);
    return true;
  } catch (error) {
    log.error(`Error creating API spec: ${error.message}`);
    return false;
  }
}

/**
 * Test: Generate test suite
 */
async function testGenerateTestSuite() {
  log.section('Test: Generating test suite for /users endpoint');

  try {
    const requestData = {
      apiSpecId: testApiSpecId,
      endpoint: '/users',
      name: 'User API Test Suite',
      description: 'Comprehensive tests for user management',
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

      // Verify we have tests from all required categories
      const requiredCategories = ['success', 'error', 'edge', 'security'];
      const missingCategories = requiredCategories.filter(
        (cat) => !categories[cat] || categories[cat] === 0
      );

      if (missingCategories.length === 0) {
        log.success('All required test categories present');
      } else {
        log.error(`Missing categories: ${missingCategories.join(', ')}`);
      }

      // Check if test code was generated
      if (response.data.data.testCode) {
        log.success('Jest test code generated successfully');
        const codeLines = response.data.data.testCode.split('\n').length;
        log.info(`Generated ${codeLines} lines of test code`);
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
 * Test: Get test suite by ID
 */
async function testGetTestSuite() {
  log.section('Test: Retrieving test suite by ID');

  try {
    const response = await axios.get(`${API_URL}/tests/${testSuiteId}`);

    if (response.data.success && response.data.data.testSuite) {
      const testSuite = response.data.data.testSuite;
      log.success(`Retrieved test suite: ${testSuite.name}`);
      log.info(`Endpoint: ${testSuite.endpoint}`);
      log.info(`Test count: ${testSuite.testCount}`);
      return true;
    } else {
      log.error('Failed to retrieve test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error retrieving test suite: ${error.message}`);
    return false;
  }
}

/**
 * Test: List test suites
 */
async function testListTestSuites() {
  log.section('Test: Listing all test suites');

  try {
    const response = await axios.get(`${API_URL}/tests`);

    if (response.data.success && response.data.data.testSuites) {
      const testSuites = response.data.data.testSuites;
      log.success(`Retrieved ${testSuites.length} test suite(s)`);

      testSuites.forEach((ts, index) => {
        console.log(`\n  ${index + 1}. ${ts.name}`);
        console.log(`     Endpoint: ${ts.endpoint}`);
        console.log(`     Tests: ${ts.testCount}`);
      });

      return true;
    } else {
      log.error('Failed to list test suites');
      return false;
    }
  } catch (error) {
    log.error(`Error listing test suites: ${error.message}`);
    return false;
  }
}

/**
 * Test: Run test suite
 */
async function testRunTestSuite() {
  log.section('Test: Running test suite');

  try {
    const requestData = {
      testSuiteId: testSuiteId,
    };

    const response = await axios.post(`${API_URL}/tests/run`, requestData);

    if (response.data.success) {
      log.success('Test suite execution initiated');
      log.info('Note: Actual test execution is not fully implemented yet');
      return true;
    } else {
      log.error('Failed to run test suite');
      return false;
    }
  } catch (error) {
    log.error(`Error running test suite: ${error.message}`);
    return false;
  }
}

/**
 * Cleanup: Delete test data
 */
async function cleanup() {
  log.section('Cleanup: Removing test data');

  try {
    // Delete test suite
    if (testSuiteId) {
      await axios.delete(`${API_URL}/tests/${testSuiteId}`);
      log.success('Deleted test suite');
    }

    // Delete API spec from database
    if (testApiSpecId) {
      await APISpec.findByIdAndDelete(testApiSpecId);
      log.success('Deleted API spec');
    }

    await mongoose.connection.close();
    log.success('Closed database connection');

    return true;
  } catch (error) {
    log.error(`Cleanup error: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║    Test Generator Engine - Simplified Integration Test    ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  log.info(`Testing API at: ${BASE_URL}`);
  log.info('Make sure the backend server is running!\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Connect to database
  if (!(await connectDB())) {
    log.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }

  const tests = [
    { name: 'Create API Spec in DB', fn: createAPISpecInDB },
    { name: 'Generate Test Suite', fn: testGenerateTestSuite },
    { name: 'Get Test Suite', fn: testGetTestSuite },
    { name: 'List Test Suites', fn: testListTestSuites },
    { name: 'Run Test Suite', fn: testRunTestSuite },
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

  // Cleanup
  await cleanup();

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
