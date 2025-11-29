/**
 * Test script for error handling and logging system
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Colors for console output
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

/**
 * Test error response format
 */
async function testErrorResponseFormat() {
  log.section('Testing Error Response Format');

  try {
    // Test 404 - Route not found
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      log.error('Should have thrown 404 error');
    } catch (error) {
      if (error.response?.status === 404) {
        const data = error.response.data;
        if (
          data.success === false &&
          data.error?.code === 'NOT_FOUND' &&
          data.error?.message &&
          Array.isArray(data.error?.suggestions) &&
          data.timestamp
        ) {
          log.success('404 error format is correct');
          console.log('  Response:', JSON.stringify(data, null, 2));
        } else {
          log.error('404 error format is incorrect');
          console.log('  Response:', JSON.stringify(data, null, 2));
        }
      }
    }

    // Test 400 - Invalid input
    try {
      await axios.post(`${BASE_URL}/api/nl/parse`, {});
      log.error('Should have thrown 400 error');
    } catch (error) {
      if (error.response?.status === 400) {
        const data = error.response.data;
        if (
          data.success === false &&
          data.error?.code === 'INVALID_INPUT' &&
          data.error?.message &&
          Array.isArray(data.error?.suggestions)
        ) {
          log.success('400 error format is correct');
          console.log('  Error code:', data.error.code);
          console.log('  Message:', data.error.message);
          console.log('  Suggestions:', data.error.suggestions);
        } else {
          log.error('400 error format is incorrect');
          console.log('  Response:', JSON.stringify(data, null, 2));
        }
      }
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
  }
}

/**
 * Test request logging
 */
async function testRequestLogging() {
  log.section('Testing Request Logging');

  try {
    // Make a successful request
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      log.success('Health check successful');
      log.info('Check server logs for request/response logging');
      log.info('Look for: "Incoming request" and "Outgoing response" messages');
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
  }
}

/**
 * Test different error types
 */
async function testErrorTypes() {
  log.section('Testing Different Error Types');

  const tests = [
    {
      name: 'Invalid Input (empty string)',
      request: () => axios.post(`${BASE_URL}/api/nl/parse`, { input: '' }),
      expectedCode: 'INVALID_INPUT',
      expectedStatus: 400,
    },
    {
      name: 'Invalid Input (missing field)',
      request: () => axios.post(`${BASE_URL}/api/nl/parse`, {}),
      expectedCode: 'INVALID_INPUT',
      expectedStatus: 400,
    },
    {
      name: 'Not Found (invalid spec ID)',
      request: () =>
        axios.post(`${BASE_URL}/api/nl/parse`, {
          input: 'test',
          apiSpecId: '507f1f77bcf86cd799439011', // Valid ObjectId format but doesn't exist
        }),
      expectedCode: 'NOT_FOUND',
      expectedStatus: 404,
    },
    {
      name: 'Route Not Found',
      request: () => axios.get(`${BASE_URL}/api/invalid/route`),
      expectedCode: 'NOT_FOUND',
      expectedStatus: 404,
    },
  ];

  for (const test of tests) {
    try {
      await test.request();
      log.error(`${test.name}: Should have thrown error`);
    } catch (error) {
      if (error.response?.status === test.expectedStatus) {
        const data = error.response.data;
        if (data.error?.code === test.expectedCode) {
          log.success(`${test.name}: Correct error code (${test.expectedCode})`);
          if (data.error.suggestions && data.error.suggestions.length > 0) {
            log.info(`  Suggestions provided: ${data.error.suggestions.length}`);
          }
        } else {
          log.error(
            `${test.name}: Wrong error code (expected ${test.expectedCode}, got ${data.error?.code})`
          );
        }
      } else {
        log.error(
          `${test.name}: Wrong status code (expected ${test.expectedStatus}, got ${error.response?.status})`
        );
      }
    }
  }
}

/**
 * Test user-friendly error messages
 */
async function testUserFriendlyMessages() {
  log.section('Testing User-Friendly Error Messages');

  try {
    await axios.post(`${BASE_URL}/api/nl/parse`, { input: '' });
  } catch (error) {
    const data = error.response?.data;
    if (data?.error) {
      log.info('Error message: ' + data.error.message);
      log.info('Suggestions:');
      data.error.suggestions?.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });

      if (
        data.error.message &&
        data.error.suggestions &&
        data.error.suggestions.length > 0
      ) {
        log.success('User-friendly messages are present');
      } else {
        log.error('User-friendly messages are missing');
      }
    }
  }
}

/**
 * Test async handler error catching
 */
async function testAsyncHandlerErrorCatching() {
  log.section('Testing Async Handler Error Catching');

  try {
    // This should trigger an error in the controller
    await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: 'test request',
      apiSpecId: 'invalid-id-format', // Invalid ObjectId format
    });
    log.error('Should have thrown error for invalid ObjectId');
  } catch (error) {
    if (error.response?.status === 400) {
      const data = error.response.data;
      // Mongoose CastError should be caught and converted to user-friendly error
      if (data.error?.code === 'INVALID_ID') {
        log.success('Mongoose CastError properly handled');
        log.info(`  Message: ${data.error.message}`);
      } else {
        log.error(`Unexpected error code: ${data.error?.code}`);
      }
    } else {
      log.error(`Unexpected status code: ${error.response?.status}`);
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  APIZombie Error Handling & Logging Test Suite');
  console.log('='.repeat(60));

  log.info('Testing against: ' + BASE_URL);
  log.info('Make sure the backend server is running!\n');

  try {
    // Check if server is running
    await axios.get(`${BASE_URL}/health`);
    log.success('Server is running\n');
  } catch (error) {
    log.error('Server is not running. Please start the backend server first.');
    log.info('Run: cd backend && npm run dev');
    process.exit(1);
  }

  await testErrorResponseFormat();
  await testRequestLogging();
  await testErrorTypes();
  await testUserFriendlyMessages();
  await testAsyncHandlerErrorCatching();

  console.log('\n' + '='.repeat(60));
  log.info('Test suite completed!');
  log.info('Check the server console/logs for detailed logging output');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch((error) => {
  log.error('Test suite failed: ' + error.message);
  process.exit(1);
});
