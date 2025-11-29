import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// ANSI color codes for terminal output
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
 * Test REST to GraphQL translation
 */
async function testRESTtoGraphQL() {
  log.section('Testing REST to GraphQL Translation');

  try {
    const restRequest = {
      method: 'GET',
      endpoint: '/users/123',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    log.info('Translating REST request to GraphQL...');
    console.log('REST Request:', JSON.stringify(restRequest, null, 2));

    const response = await axios.post(`${BASE_URL}/api/translate`, {
      sourceRequest: restRequest,
      sourceProtocol: 'rest',
      targetProtocol: 'graphql',
    });

    if (response.data.success) {
      log.success('REST to GraphQL translation successful');
      console.log('\nTranslated GraphQL Request:');
      console.log(JSON.stringify(response.data.data.translated, null, 2));
      console.log('\nExplanation:');
      console.log(response.data.data.explanation);
      return true;
    } else {
      log.error('Translation failed');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log.error(`REST to GraphQL translation failed: ${error.message}`);
    if (error.response) {
      console.log('Error response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test GraphQL to REST translation
 */
async function testGraphQLtoREST() {
  log.section('Testing GraphQL to REST Translation');

  try {
    const graphqlRequest = {
      query: `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `,
      variables: {
        id: '123',
      },
      operationType: 'query',
    };

    log.info('Translating GraphQL query to REST...');
    console.log('GraphQL Request:', JSON.stringify(graphqlRequest, null, 2));

    const response = await axios.post(`${BASE_URL}/api/translate`, {
      sourceRequest: graphqlRequest,
      sourceProtocol: 'graphql',
      targetProtocol: 'rest',
    });

    if (response.data.success) {
      log.success('GraphQL to REST translation successful');
      console.log('\nTranslated REST Request:');
      console.log(JSON.stringify(response.data.data.translated, null, 2));
      console.log('\nExplanation:');
      console.log(response.data.data.explanation);
      return true;
    } else {
      log.error('Translation failed');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log.error(`GraphQL to REST translation failed: ${error.message}`);
    if (error.response) {
      console.log('Error response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test REST POST to GraphQL mutation
 */
async function testRESTPostToGraphQLMutation() {
  log.section('Testing REST POST to GraphQL Mutation');

  try {
    const restRequest = {
      method: 'POST',
      endpoint: '/users',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'John Doe',
        email: 'john@example.com',
      },
    };

    log.info('Translating REST POST to GraphQL mutation...');
    console.log('REST Request:', JSON.stringify(restRequest, null, 2));

    const response = await axios.post(`${BASE_URL}/api/translate`, {
      sourceRequest: restRequest,
      sourceProtocol: 'rest',
      targetProtocol: 'graphql',
    });

    if (response.data.success) {
      log.success('REST POST to GraphQL mutation translation successful');
      console.log('\nTranslated GraphQL Mutation:');
      console.log(JSON.stringify(response.data.data.translated, null, 2));
      console.log('\nExplanation:');
      console.log(response.data.data.explanation);
      return true;
    } else {
      log.error('Translation failed');
      console.log(response.data);
      return false;
    }
  } catch (error) {
    log.error(`REST POST to GraphQL mutation failed: ${error.message}`);
    if (error.response) {
      console.log('Error response:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

/**
 * Test validation errors
 */
async function testValidationErrors() {
  log.section('Testing Validation Errors');

  const tests = [
    {
      name: 'Missing source request',
      data: {
        sourceProtocol: 'rest',
        targetProtocol: 'graphql',
      },
    },
    {
      name: 'Missing source protocol',
      data: {
        sourceRequest: { method: 'GET', endpoint: '/test' },
        targetProtocol: 'graphql',
      },
    },
    {
      name: 'Same source and target protocol',
      data: {
        sourceRequest: { method: 'GET', endpoint: '/test' },
        sourceProtocol: 'rest',
        targetProtocol: 'rest',
      },
    },
    {
      name: 'Unsupported protocol',
      data: {
        sourceRequest: { method: 'GET', endpoint: '/test' },
        sourceProtocol: 'soap',
        targetProtocol: 'rest',
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      log.info(`Testing: ${test.name}`);
      const response = await axios.post(`${BASE_URL}/api/translate`, test.data);
      
      // Should not succeed
      log.error(`Expected error but got success for: ${test.name}`);
      failed++;
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        log.success(`Correctly rejected: ${test.name}`);
        console.log(`  Error: ${error.response.data.error.message}`);
        passed++;
      } else {
        log.error(`Unexpected error for: ${test.name}`);
        console.log(error.message);
        failed++;
      }
    }
  }

  console.log(`\nValidation Tests: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Test gRPC translation (should return not supported)
 */
async function testGRPCTranslation() {
  log.section('Testing gRPC Translation (Should Not Be Supported)');

  try {
    const grpcRequest = {
      service: 'UserService',
      method: 'GetUser',
      message: { id: '123' },
    };

    log.info('Attempting gRPC to REST translation...');

    const response = await axios.post(`${BASE_URL}/api/translate`, {
      sourceRequest: grpcRequest,
      sourceProtocol: 'grpc',
      targetProtocol: 'rest',
    });

    log.error('gRPC translation should not be supported yet');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log.success('Correctly returned "not supported" for gRPC translation');
      console.log(`  Message: ${error.response.data.error.message}`);
      return true;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Protocol Translation API Test Suite     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}`);

  const results = [];

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    log.success('Server is running');
  } catch (error) {
    log.error('Server is not running. Please start the backend server first.');
    process.exit(1);
  }

  // Run tests
  results.push(await testRESTtoGraphQL());
  results.push(await testGraphQLtoREST());
  results.push(await testRESTPostToGraphQLMutation());
  results.push(await testValidationErrors());
  results.push(await testGRPCTranslation());

  // Summary
  log.section('Test Summary');
  const passed = results.filter((r) => r === true).length;
  const failed = results.filter((r) => r === false).length;

  console.log(`Total: ${results.length} test suites`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
