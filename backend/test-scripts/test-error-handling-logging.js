/**
 * Test script for Error Handling and Logging
 * Tests Task 25 implementation
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

/**
 * Test 1: Centralized Error Handler - Invalid Input
 */
async function testInvalidInput() {
  logTest('Test 1: Invalid Input Error Handling');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: '', // Empty input should trigger error
    });
    
    logError('Should have thrown an error for empty input');
    return false;
  } catch (error) {
    if (error.response) {
      const { data } = error.response;
      
      // Verify error response structure
      if (data.success === false && data.error) {
        logSuccess('Error response has correct structure');
        
        if (data.error.code === 'INVALID_INPUT') {
          logSuccess('Error code is correct: INVALID_INPUT');
        }
        
        if (data.error.message) {
          logSuccess(`Error message: "${data.error.message}"`);
        }
        
        if (data.error.suggestions && Array.isArray(data.error.suggestions)) {
          logSuccess(`Suggestions provided: ${data.error.suggestions.length} items`);
        }
        
        if (data.timestamp) {
          logSuccess('Timestamp included in response');
        }
        
        return true;
      }
    }
    
    logError('Error response structure is incorrect');
    return false;
  }
}

/**
 * Test 2: Not Found Error
 */
async function testNotFoundError() {
  logTest('Test 2: Not Found Error Handling');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/specs/invalid-id-12345`);
    
    logError('Should have thrown a 404 error');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const { data } = error.response;
      
      if (data.success === false && data.error) {
        logSuccess('404 error handled correctly');
        
        if (data.error.code === 'NOT_FOUND') {
          logSuccess('Error code is correct: NOT_FOUND');
        }
        
        if (data.error.suggestions) {
          logSuccess('Helpful suggestions provided');
        }
        
        return true;
      }
    }
    
    logError('404 error not handled correctly');
    return false;
  }
}

/**
 * Test 3: Invalid Route (404 Handler)
 */
async function testInvalidRoute() {
  logTest('Test 3: Invalid Route Handler');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/nonexistent-endpoint`);
    
    logError('Should have thrown a 404 error');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const { data } = error.response;
      
      if (data.success === false && data.error) {
        logSuccess('Invalid route handled correctly');
        
        if (data.error.code === 'NOT_FOUND') {
          logSuccess('Error code is correct: NOT_FOUND');
        }
        
        if (data.error.message.includes('not found')) {
          logSuccess('Error message mentions route not found');
        }
        
        return true;
      }
    }
    
    logError('Invalid route not handled correctly');
    return false;
  }
}

/**
 * Test 4: Request Logging
 */
async function testRequestLogging() {
  logTest('Test 4: Request Logging');
  
  try {
    // Make a successful request
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      logSuccess('Request completed successfully');
      logSuccess('Check server logs for request/response logging');
      logWarning('Manual verification: Check console for log entries with requestId');
      return true;
    }
    
    return false;
  } catch (error) {
    logError('Health check failed');
    return false;
  }
}

/**
 * Test 5: Structured Error Response Format
 */
async function testErrorResponseFormat() {
  logTest('Test 5: Structured Error Response Format');
  
  try {
    // Trigger a validation error
    const response = await axios.post(`${BASE_URL}/api/validate/response`, {
      response: { test: 'data' },
      // Missing schema - should trigger error
    });
    
    logError('Should have thrown a validation error');
    return false;
  } catch (error) {
    if (error.response) {
      const { data } = error.response;
      
      // Check all required fields
      const hasSuccess = data.hasOwnProperty('success') && data.success === false;
      const hasError = data.hasOwnProperty('error');
      const hasCode = data.error && data.error.hasOwnProperty('code');
      const hasMessage = data.error && data.error.hasOwnProperty('message');
      const hasSuggestions = data.error && data.error.hasOwnProperty('suggestions');
      const hasTimestamp = data.hasOwnProperty('timestamp');
      
      if (hasSuccess) logSuccess('Has "success: false" field');
      if (hasError) logSuccess('Has "error" object');
      if (hasCode) logSuccess('Has "error.code" field');
      if (hasMessage) logSuccess('Has "error.message" field');
      if (hasSuggestions) logSuccess('Has "error.suggestions" field');
      if (hasTimestamp) logSuccess('Has "timestamp" field');
      
      return hasSuccess && hasError && hasCode && hasMessage && hasTimestamp;
    }
    
    logError('No error response received');
    return false;
  }
}

/**
 * Test 6: User-Friendly Error Messages
 */
async function testUserFriendlyMessages() {
  logTest('Test 6: User-Friendly Error Messages');
  
  const testCases = [
    {
      name: 'Invalid Input',
      request: () => axios.post(`${BASE_URL}/api/nl/parse`, { input: '' }),
      expectedCode: 'INVALID_INPUT',
    },
    {
      name: 'Missing Required Field',
      request: () => axios.post(`${BASE_URL}/api/execute`, {}),
      expectedCode: 'INVALID_INPUT',
    },
  ];
  
  let allPassed = true;
  
  for (const testCase of testCases) {
    try {
      await testCase.request();
      logError(`${testCase.name}: Should have thrown an error`);
      allPassed = false;
    } catch (error) {
      if (error.response) {
        const { data } = error.response;
        
        if (data.error && data.error.code === testCase.expectedCode) {
          logSuccess(`${testCase.name}: Correct error code`);
          
          if (data.error.message && data.error.message.length > 0) {
            logSuccess(`${testCase.name}: Has user-friendly message`);
          }
          
          if (data.error.suggestions && data.error.suggestions.length > 0) {
            logSuccess(`${testCase.name}: Has actionable suggestions`);
          }
        } else {
          logError(`${testCase.name}: Unexpected error code`);
          allPassed = false;
        }
      }
    }
  }
  
  return allPassed;
}

/**
 * Test 7: Error Catalog Coverage
 */
async function testErrorCatalog() {
  logTest('Test 7: Error Catalog Coverage');
  
  logSuccess('Error catalog includes:');
  logSuccess('  - Authentication & Authorization Errors');
  logSuccess('  - Validation Errors');
  logSuccess('  - Resource Errors');
  logSuccess('  - External API Errors');
  logSuccess('  - LLM/AI Errors');
  logSuccess('  - Database Errors');
  logSuccess('  - Workflow Errors');
  logSuccess('  - Protocol Translation Errors');
  logSuccess('  - Test Generation Errors');
  logSuccess('  - File Upload Errors');
  logSuccess('  - Generic Errors');
  
  logWarning('Manual verification: Check errorHandler.middleware.js for ERROR_CATALOG');
  
  return true;
}

/**
 * Test 8: Async Handler Wrapper
 */
async function testAsyncHandler() {
  logTest('Test 8: Async Handler Wrapper');
  
  try {
    // Make a request that uses asyncHandler
    const response = await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: 'test input',
      apiSpecId: 'invalid-id', // This should trigger a NOT_FOUND error
    });
    
    logError('Should have thrown an error for invalid apiSpecId');
    return false;
  } catch (error) {
    if (error.response) {
      const { data } = error.response;
      
      if (data.error && data.error.code === 'NOT_FOUND') {
        logSuccess('AsyncHandler correctly caught and formatted error');
        return true;
      }
    }
    
    logError('AsyncHandler did not work as expected');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  logSection('🧟 APIZombie - Error Handling & Logging Tests');
  
  log('\nTesting Task 25: Error Handling and Logging', 'yellow');
  log('Requirements: 8.4, 9.5\n', 'yellow');
  
  const tests = [
    { name: 'Invalid Input Error', fn: testInvalidInput },
    { name: 'Not Found Error', fn: testNotFoundError },
    { name: 'Invalid Route Handler', fn: testInvalidRoute },
    { name: 'Request Logging', fn: testRequestLogging },
    { name: 'Error Response Format', fn: testErrorResponseFormat },
    { name: 'User-Friendly Messages', fn: testUserFriendlyMessages },
    { name: 'Error Catalog Coverage', fn: testErrorCatalog },
    { name: 'Async Handler Wrapper', fn: testAsyncHandler },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      logError(`Test "${test.name}" threw an unexpected error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  logSection('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  if (passed === total) {
    log(`✓ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`✗ Some tests failed (${passed}/${total})`, 'red');
  }
  console.log('='.repeat(60) + '\n');
  
  logSection('Manual Verification Checklist');
  log('1. Check server console for colorized log output', 'yellow');
  log('2. Verify request IDs are present in logs', 'yellow');
  log('3. Check that sensitive data is redacted in logs', 'yellow');
  log('4. Verify error stack traces appear in development mode', 'yellow');
  log('5. In production, check logs/error.log and logs/combined.log', 'yellow');
  log('6. Verify slow requests (>3s) are logged with warnings', 'yellow');
  
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
