import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

/**
 * Test the Natural Language API endpoints
 */
async function testNLAPI() {
  console.log('🧪 Testing Natural Language API...\n');

  try {
    // Test 1: Parse simple natural language without API spec
    console.log('Test 1: Parse "get all users" without API spec');
    const test1 = await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: 'get all users',
    });
    console.log('✅ Success:', JSON.stringify(test1.data, null, 2));
    console.log('\n---\n');

    // Test 2: Parse with more complex input
    console.log('Test 2: Parse "create a new user with name John and email john@example.com"');
    const test2 = await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: 'create a new user with name John and email john@example.com',
    });
    console.log('✅ Success:', JSON.stringify(test2.data, null, 2));
    console.log('\n---\n');

    // Test 3: Parse with GraphQL intent
    console.log('Test 3: Parse "query all posts with their authors"');
    const test3 = await axios.post(`${BASE_URL}/api/nl/parse`, {
      input: 'query all posts with their authors',
    });
    console.log('✅ Success:', JSON.stringify(test3.data, null, 2));
    console.log('\n---\n');

    // Test 4: Test improve endpoint with history
    console.log('Test 4: Improve with historical context');
    const test4 = await axios.post(`${BASE_URL}/api/nl/improve`, {
      input: 'get user details',
      history: [
        { method: 'GET', endpoint: '/api/users', protocol: 'rest' },
        { method: 'POST', endpoint: '/api/users', protocol: 'rest' },
      ],
    });
    console.log('✅ Success:', JSON.stringify(test4.data, null, 2));
    console.log('\n---\n');

    // Test 5: Test error handling - empty input
    console.log('Test 5: Error handling - empty input');
    try {
      await axios.post(`${BASE_URL}/api/nl/parse`, {
        input: '',
      });
    } catch (error) {
      console.log('✅ Expected error:', error.response.data);
    }
    console.log('\n---\n');

    // Test 6: Test error handling - invalid API spec ID
    console.log('Test 6: Error handling - invalid API spec ID');
    try {
      await axios.post(`${BASE_URL}/api/nl/parse`, {
        input: 'get all users',
        apiSpecId: '507f1f77bcf86cd799439011', // Non-existent ID
      });
    } catch (error) {
      console.log('✅ Expected error:', error.response.data);
    }
    console.log('\n---\n');

    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests
testNLAPI();
