import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * Test automatic validation integration with execute endpoint
 */
async function testValidationIntegration() {
  console.log('🧪 Testing Validation Integration with Execute Endpoint\n');

  try {
    // First, create a test API spec
    console.log('Step 1: Creating test API specification...');
    
    const testSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            responses: {
              '200': {
                description: 'List of users',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          name: { type: 'string' },
                          email: { type: 'string', format: 'email' },
                        },
                        required: ['id', 'name', 'email'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const specResponse = await axios.post(`${API_URL}/specs/upload`, {
      name: 'Test API',
      type: 'openapi',
      baseUrl: 'https://jsonplaceholder.typicode.com',
      specification: testSpec,
    });

    const apiSpecId = specResponse.data.data.id;
    console.log('✅ API spec created:', apiSpecId);
    console.log('');

    // Test 2: Execute request with automatic validation (valid response)
    console.log('Step 2: Executing request with automatic validation...');
    
    const executeResponse = await axios.post(`${API_URL}/execute`, {
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: '/users',
        headers: {},
      },
      apiSpecId: apiSpecId,
      validateResponse: true,
      saveToHistory: false,
    });

    console.log('✅ Request executed successfully');
    console.log('Response status:', executeResponse.data.data.statusCode);
    console.log('Validation result:', executeResponse.data.data.validation);
    console.log('');

    // Test 3: Test validation with schema validation
    console.log('Step 3: Testing schema validation directly...');
    
    const validResponse = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    const validationResult = await axios.post(`${API_URL}/validate/response`, {
      response: validResponse,
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name', 'email'],
      },
    });

    console.log('✅ Direct validation result:', validationResult.data.data);
    console.log('');

    // Test 4: Test with invalid data
    console.log('Step 4: Testing validation with invalid data...');
    
    const invalidResponse = {
      id: 'not-a-number',
      name: 123,
      email: 'invalid-email',
    };

    const invalidValidationResult = await axios.post(`${API_URL}/validate/response`, {
      response: invalidResponse,
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
        required: ['id', 'name', 'email'],
      },
    });

    console.log('✅ Invalid data validation result:');
    console.log('Success:', invalidValidationResult.data.data.success);
    console.log('Errors found:', invalidValidationResult.data.data.errors.length);
    invalidValidationResult.data.data.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.field}: ${err.message}`);
    });
    console.log('');

    // Clean up - delete the test spec
    console.log('Step 5: Cleaning up test data...');
    await axios.delete(`${API_URL}/specs/${apiSpecId}`);
    console.log('✅ Test spec deleted');
    console.log('');

    console.log('✅ All integration tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error?.details) {
      console.error('Details:', error.response.data.error.details);
    }
    process.exit(1);
  }
}

// Run tests
console.log('Starting validation integration tests...');
console.log('Make sure the backend server is running on port 5000\n');

testValidationIntegration();
