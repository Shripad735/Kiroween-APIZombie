import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Comprehensive test suite for Response Validation Engine
 */
async function runComprehensiveTests() {
  console.log('🧪 Comprehensive Response Validation Engine Tests\n');
  console.log('='.repeat(60));
  console.log('\n');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Basic Schema Validation - Valid Response
  try {
    console.log('Test 1: Basic schema validation with valid response');
    const result = await axios.post(`${API_URL}/validate/response`, {
      response: {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      },
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          age: { type: 'number' },
        },
        required: ['id', 'name', 'email'],
      },
    });

    if (result.data.data.success) {
      console.log('✅ PASSED: Valid response validated correctly\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Valid response should pass validation\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 2: Schema Validation - Invalid Types
  try {
    console.log('Test 2: Schema validation with invalid types');
    const result = await axios.post(`${API_URL}/validate/response`, {
      response: {
        id: 'not-a-number',
        name: 123,
        email: 'invalid-email',
      },
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    });

    if (!result.data.data.success && result.data.data.errors.length === 3) {
      console.log('✅ PASSED: Invalid types detected correctly\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should detect 3 type errors\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 3: Required Fields Validation
  try {
    console.log('Test 3: Required fields validation');
    const result = await axios.post(`${API_URL}/validate/required`, {
      response: {
        id: 1,
        name: 'John',
      },
      requiredFields: ['id', 'name', 'email', 'phone'],
    });

    if (!result.data.data.success && result.data.data.errors.length === 2) {
      console.log('✅ PASSED: Missing required fields detected\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should detect 2 missing fields\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 4: Data Type Validation
  try {
    console.log('Test 4: Data type validation');
    const result = await axios.post(`${API_URL}/validate/types`, {
      response: {
        id: 123,
        name: 'John',
        isActive: true,
        tags: ['developer', 'javascript'],
      },
      typeDefinitions: {
        id: 'number',
        name: 'string',
        isActive: 'boolean',
        tags: 'array',
      },
    });

    if (result.data.data.success) {
      console.log('✅ PASSED: All data types correct\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: All types should be valid\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 5: Constraint Validation - Minimum/Maximum
  try {
    console.log('Test 5: Constraint validation (min/max)');
    const result = await axios.post(`${API_URL}/validate/constraints`, {
      response: {
        age: 15,
        score: 150,
      },
      constraints: {
        age: { minimum: 18, maximum: 100 },
        score: { minimum: 0, maximum: 100 },
      },
    });

    if (!result.data.data.success && result.data.data.errors.length === 2) {
      console.log('✅ PASSED: Constraint violations detected\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should detect 2 constraint violations\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 6: Constraint Validation - Pattern
  try {
    console.log('Test 6: Constraint validation (pattern)');
    const result = await axios.post(`${API_URL}/validate/constraints`, {
      response: {
        username: 'john_doe',
        email: 'john@example.com',
      },
      constraints: {
        username: { pattern: '^[a-z]+$' }, // Only lowercase letters
      },
    });

    if (!result.data.data.success && result.data.data.errors.length === 1) {
      console.log('✅ PASSED: Pattern violation detected\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should detect pattern violation\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 7: Constraint Validation - Enum
  try {
    console.log('Test 7: Constraint validation (enum)');
    const result = await axios.post(`${API_URL}/validate/constraints`, {
      response: {
        status: 'pending',
        role: 'superadmin',
      },
      constraints: {
        status: { enum: ['active', 'inactive', 'pending'] },
        role: { enum: ['user', 'admin', 'moderator'] },
      },
    });

    if (!result.data.data.success && result.data.data.errors.length === 1) {
      console.log('✅ PASSED: Enum violation detected\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should detect 1 enum violation\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 8: Highlight Mismatches
  try {
    console.log('Test 8: Highlight mismatches functionality');
    const result = await axios.post(`${API_URL}/validate/mismatches`, {
      response: {
        id: 'abc',
        age: 200,
      },
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          age: { type: 'number', maximum: 150 },
        },
      },
    });

    if (result.data.data.count === 2 && result.data.data.hasErrors) {
      console.log('✅ PASSED: Mismatches highlighted correctly\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Should highlight 2 mismatches\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 9: Nested Object Validation
  try {
    console.log('Test 9: Nested object validation');
    const result = await axios.post(`${API_URL}/validate/response`, {
      response: {
        user: {
          id: 1,
          profile: {
            name: 'John',
            age: 30,
          },
        },
      },
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              profile: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                },
                required: ['name', 'age'],
              },
            },
            required: ['id', 'profile'],
          },
        },
      },
    });

    if (result.data.data.success) {
      console.log('✅ PASSED: Nested object validated correctly\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Nested object should be valid\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Test 10: Array Validation
  try {
    console.log('Test 10: Array validation');
    const result = await axios.post(`${API_URL}/validate/response`, {
      response: {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      },
      schema: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
              required: ['id', 'name'],
            },
          },
        },
      },
    });

    if (result.data.data.success) {
      console.log('✅ PASSED: Array validated correctly\n');
      passedTests++;
    } else {
      console.log('❌ FAILED: Array should be valid\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAILED:', error.message, '\n');
    failedTests++;
  }

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${passedTests + failedTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed successfully!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
console.log('Starting comprehensive validation tests...');
console.log('Make sure the backend server is running on port 5000\n');

runComprehensiveTests();
