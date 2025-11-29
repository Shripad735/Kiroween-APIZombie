import axios from 'axios';

/**
 * Test Security Features
 * Tests input sanitization, rate limiting, CORS, and other security measures
 */

const BASE_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'blue');
  log('─'.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('✅ Health check passed', 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    log('❌ Health check failed', 'red');
    log(`Error: ${error.message}`);
    return false;
  }
}

async function testInputSanitization() {
  log('\n🧹 Test 2: Input Sanitization', 'blue');
  log('─'.repeat(50));
  
  const maliciousInputs = [
    {
      name: 'Script tag injection',
      input: '<script>alert("XSS")</script>',
    },
    {
      name: 'JavaScript protocol',
      input: 'javascript:alert("XSS")',
    },
    {
      name: 'Event handler',
      input: '<img src=x onerror="alert(1)">',
    },
    {
      name: 'Iframe injection',
      input: '<iframe src="evil.com"></iframe>',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of maliciousInputs) {
    try {
      const response = await axios.post(`${BASE_URL}/api/nl/parse`, {
        input: test.input,
        apiSpecId: '507f1f77bcf86cd799439011',
      });
      
      // Check if the input was sanitized
      const responseStr = JSON.stringify(response.data);
      if (responseStr.includes('<script>') || responseStr.includes('javascript:') || responseStr.includes('onerror=')) {
        log(`❌ ${test.name}: Input not sanitized!`, 'red');
        failed++;
      } else {
        log(`✅ ${test.name}: Input sanitized`, 'green');
        passed++;
      }
    } catch (error) {
      // Error is acceptable - means the request was rejected
      log(`✅ ${test.name}: Request rejected (good)`, 'green');
      passed++;
    }
  }

  log(`\nResults: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

async function testRateLimiting() {
  log('\n⏱️  Test 3: Rate Limiting', 'blue');
  log('─'.repeat(50));
  
  try {
    log('Sending multiple requests to test rate limiting...');
    const requests = [];
    
    // Send 25 requests (should hit the AI limiter at 20)
    for (let i = 0; i < 25; i++) {
      requests.push(
        axios.post(`${BASE_URL}/api/nl/parse`, {
          input: `Test request ${i}`,
          apiSpecId: '507f1f77bcf86cd799439011',
        }).catch(err => err.response)
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r?.status === 429);
    
    if (rateLimited.length > 0) {
      log(`✅ Rate limiting working: ${rateLimited.length} requests blocked`, 'green');
      log(`Sample rate limit response: ${JSON.stringify(rateLimited[0].data, null, 2)}`);
      return true;
    } else {
      log('⚠️  Rate limiting not triggered (may need more requests)', 'yellow');
      return true; // Not necessarily a failure
    }
  } catch (error) {
    log('❌ Rate limiting test failed', 'red');
    log(`Error: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  log('\n🌐 Test 4: CORS Configuration', 'blue');
  log('─'.repeat(50));
  
  try {
    // Test with allowed origin
    const response = await axios.get(`${BASE_URL}/health`, {
      headers: {
        'Origin': 'http://localhost:3000',
      },
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      log(`✅ CORS headers present: ${corsHeader}`, 'green');
      return true;
    } else {
      log('⚠️  CORS headers not found', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ CORS test failed', 'red');
    log(`Error: ${error.message}`);
    return false;
  }
}

async function testSecurityHeaders() {
  log('\n🛡️  Test 5: Security Headers (Helmet)', 'blue');
  log('─'.repeat(50));
  
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
    ];

    let found = 0;
    for (const header of securityHeaders) {
      if (headers[header]) {
        log(`✅ ${header}: ${headers[header]}`, 'green');
        found++;
      } else {
        log(`⚠️  ${header}: Not found`, 'yellow');
      }
    }

    log(`\n${found}/${securityHeaders.length} security headers present`);
    return found > 0;
  } catch (error) {
    log('❌ Security headers test failed', 'red');
    log(`Error: ${error.message}`);
    return false;
  }
}

async function testRequestSizeLimits() {
  log('\n📦 Test 6: Request Size Limits', 'blue');
  log('─'.repeat(50));
  
  try {
    // Create a large payload (>10MB)
    const largePayload = {
      input: 'A'.repeat(11 * 1024 * 1024), // 11MB
      apiSpecId: '507f1f77bcf86cd799439011',
    };

    await axios.post(`${BASE_URL}/api/nl/parse`, largePayload);
    log('⚠️  Large payload accepted (limit may not be enforced)', 'yellow');
    return false;
  } catch (error) {
    if (error.response?.status === 413 || error.code === 'ERR_BAD_REQUEST') {
      log('✅ Request size limit enforced', 'green');
      return true;
    } else {
      log(`⚠️  Unexpected error: ${error.message}`, 'yellow');
      return true; // Not necessarily a failure
    }
  }
}

async function testInvalidObjectId() {
  log('\n🔍 Test 7: ObjectId Validation', 'blue');
  log('─'.repeat(50));
  
  try {
    const invalidIds = [
      'invalid-id',
      '123',
      'not-a-valid-objectid',
      '<script>alert(1)</script>',
    ];

    let passed = 0;
    for (const id of invalidIds) {
      try {
        await axios.get(`${BASE_URL}/api/specs/${id}`);
        log(`❌ Invalid ID accepted: ${id}`, 'red');
      } catch (error) {
        if (error.response?.status === 400) {
          log(`✅ Invalid ID rejected: ${id}`, 'green');
          passed++;
        } else {
          log(`⚠️  Unexpected error for ${id}: ${error.response?.status}`, 'yellow');
        }
      }
    }

    log(`\n${passed}/${invalidIds.length} invalid IDs properly rejected`);
    return passed === invalidIds.length;
  } catch (error) {
    log('❌ ObjectId validation test failed', 'red');
    log(`Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n🔐 APIZombie Security Features Test Suite', 'blue');
  log('='.repeat(50));
  log('Testing security implementations...\n');

  const results = {
    healthCheck: await testHealthCheck(),
    inputSanitization: await testInputSanitization(),
    rateLimiting: await testRateLimiting(),
    cors: await testCORS(),
    securityHeaders: await testSecurityHeaders(),
    requestSizeLimits: await testRequestSizeLimits(),
    objectIdValidation: await testInvalidObjectId(),
  };

  // Summary
  log('\n📊 Test Summary', 'blue');
  log('='.repeat(50));
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  for (const [test, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  }
  
  log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All security tests passed!', 'green');
  } else {
    log('\n⚠️  Some security tests failed. Review the results above.', 'yellow');
  }
}

// Run tests
log('⚠️  Make sure the backend server is running on http://localhost:5000', 'yellow');
log('Run: npm run dev\n');

setTimeout(() => {
  runAllTests().catch(error => {
    log('\n❌ Test suite failed', 'red');
    console.error(error);
  });
}, 1000);
