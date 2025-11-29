import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test data
const testResponse = {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  tags: ['developer', 'javascript'],
};

const validSchema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    age: { type: 'number', minimum: 0, maximum: 150 },
    isActive: { type: 'boolean' },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['id', 'name', 'email'],
};

const invalidResponse = {
  id: 'not-a-number', // Should be number
  name: 123, // Should be string
  email: 'invalid-email', // Invalid email format
  age: 200, // Exceeds maximum
  // Missing required field: isActive
};

async function testValidation() {
  console.log('🧪 Testing Response Validation Engine\n');

  try {
    // Test 1: Valid response validation
    console.log('Test 1: Validating a valid response...');
    const validResult = await axios.post(`${API_URL}/validate/response`, {
      response: testResponse,
      schema: validSchema,
    });
    console.log('✅ Valid response result:', validResult.data.data);
    console.log('');

    // Test 2: Invalid response validation
    console.log('Test 2: Validating an invalid response...');
    const invalidResult = await axios.post(`${API_URL}/validate/response`, {
      response: invalidResponse,
      schema: validSchema,
    });
    console.log('✅ Invalid response result:', invalidResult.data.data);
    console.log('Errors found:', invalidResult.data.data.errors.length);
    console.log('');

    // Test 3: Highlight mismatches
    console.log('Test 3: Highlighting mismatches...');
    const mismatchResult = await axios.post(`${API_URL}/validate/mismatches`, {
      response: invalidResponse,
      schema: validSchema,
    });
    console.log('✅ Mismatches found:', mismatchResult.data.data.count);
    console.log('Mismatch details:');
    mismatchResult.data.data.mismatches.forEach((m, i) => {
      console.log(`  ${i + 1}. Field: ${m.field}`);
      console.log(`     Issue: ${m.issue}`);
      console.log(`     Details: ${m.details}`);
    });
    console.log('');

    // Test 4: Validate data types
    console.log('Test 4: Validating data types...');
    const typeResult = await axios.post(`${API_URL}/validate/types`, {
      response: testResponse,
      typeDefinitions: {
        id: 'number',
        name: 'string',
        email: 'string',
        age: 'number',
        isActive: 'boolean',
        tags: 'array',
      },
    });
    console.log('✅ Type validation result:', typeResult.data.data);
    console.log('');

    // Test 5: Validate required fields
    console.log('Test 5: Validating required fields...');
    const requiredResult = await axios.post(`${API_URL}/validate/required`, {
      response: testResponse,
      requiredFields: ['id', 'name', 'email'],
    });
    console.log('✅ Required fields validation:', requiredResult.data.data);
    console.log('');

    // Test 6: Validate missing required fields
    console.log('Test 6: Validating missing required fields...');
    const missingRequiredResult = await axios.post(`${API_URL}/validate/required`, {
      response: { id: 1 }, // Missing name and email
      requiredFields: ['id', 'name', 'email'],
    });
    console.log('✅ Missing required fields result:', missingRequiredResult.data.data);
    console.log('');

    // Test 7: Validate constraints
    console.log('Test 7: Validating constraints...');
    const constraintResult = await axios.post(`${API_URL}/validate/constraints`, {
      response: testResponse,
      constraints: {
        age: { minimum: 18, maximum: 100 },
        name: { pattern: '^[A-Za-z ]+$' },
      },
    });
    console.log('✅ Constraint validation result:', constraintResult.data.data);
    console.log('');

    // Test 8: Validate constraint violations
    console.log('Test 8: Validating constraint violations...');
    const violationResult = await axios.post(`${API_URL}/validate/constraints`, {
      response: { age: 15, name: 'John123' },
      constraints: {
        age: { minimum: 18, maximum: 100 },
        name: { pattern: '^[A-Za-z ]+$' },
      },
    });
    console.log('✅ Constraint violation result:', violationResult.data.data);
    console.log('');

    console.log('✅ All validation tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
console.log('Starting validation tests...');
console.log('Make sure the backend server is running on port 5000\n');

testValidation();
