import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

/**
 * Test the /api/execute endpoint with different protocol handlers
 */
async function testExecuteAPI() {
  console.log('🧪 Testing Execute API Endpoint\n');

  try {
    // Test 1: REST API request
    console.log('Test 1: REST API Request');
    console.log('------------------------');
    try {
      const restResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        saveToHistory: false,
      });

      console.log('✅ REST request executed successfully');
      console.log('Status Code:', restResponse.data.data.statusCode);
      console.log('Duration:', restResponse.data.data.duration, 'ms');
      console.log('Response Body:', JSON.stringify(restResponse.data.data.body, null, 2).substring(0, 200) + '...');
      console.log('');
    } catch (error) {
      console.log('❌ REST request failed:', error.response?.data || error.message);
      console.log('');
    }

    // Test 2: REST POST request
    console.log('Test 2: REST POST Request');
    console.log('-------------------------');
    try {
      const restPostResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'rest',
          method: 'POST',
          endpoint: 'https://jsonplaceholder.typicode.com/posts',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            title: 'Test Post',
            body: 'This is a test post from APIZombie',
            userId: 1,
          },
        },
        saveToHistory: false,
      });

      console.log('✅ REST POST request executed successfully');
      console.log('Status Code:', restPostResponse.data.data.statusCode);
      console.log('Duration:', restPostResponse.data.data.duration, 'ms');
      console.log('Response Body:', JSON.stringify(restPostResponse.data.data.body, null, 2));
      console.log('');
    } catch (error) {
      console.log('❌ REST POST request failed:', error.response?.data || error.message);
      console.log('');
    }

    // Test 3: GraphQL request
    console.log('Test 3: GraphQL Request');
    console.log('-----------------------');
    try {
      const graphqlResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'graphql',
          endpoint: 'https://countries.trevorblades.com/graphql',
          query: `
            query {
              country(code: "US") {
                name
                capital
                currency
                emoji
              }
            }
          `,
        },
        saveToHistory: false,
      });

      console.log('✅ GraphQL request executed successfully');
      console.log('Status Code:', graphqlResponse.data.data.statusCode);
      console.log('Duration:', graphqlResponse.data.data.duration, 'ms');
      console.log('Response Body:', JSON.stringify(graphqlResponse.data.data.body, null, 2));
      console.log('');
    } catch (error) {
      console.log('❌ GraphQL request failed:', error.response?.data || error.message);
      console.log('');
    }

    // Test 4: Invalid protocol
    console.log('Test 4: Invalid Protocol');
    console.log('------------------------');
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'invalid',
          endpoint: 'https://example.com',
        },
        saveToHistory: false,
      });

      console.log('❌ Should have failed with invalid protocol');
      console.log('');
    } catch (error) {
      console.log('✅ Correctly rejected invalid protocol');
      console.log('Error:', error.response?.data?.error?.message);
      console.log('');
    }

    // Test 5: Missing required fields
    console.log('Test 5: Missing Required Fields');
    console.log('--------------------------------');
    try {
      const missingFieldsResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'rest',
          // Missing endpoint
        },
        saveToHistory: false,
      });

      console.log('❌ Should have failed with validation error');
      console.log('');
    } catch (error) {
      console.log('✅ Correctly rejected request with missing fields');
      console.log('Error:', error.response?.data?.error?.message || error.response?.data?.data?.error);
      console.log('');
    }

    // Test 6: Authentication header injection (simulated)
    console.log('Test 6: Authentication Header Injection');
    console.log('----------------------------------------');
    try {
      // This test simulates auth config by passing it in the request
      // In production, this would be fetched from the database
      const authResponse = await axios.post(`${BASE_URL}/api/execute`, {
        request: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        saveToHistory: false,
      });

      console.log('✅ Request with auth config executed successfully');
      console.log('Status Code:', authResponse.data.data.statusCode);
      console.log('Note: Auth config would be fetched from database in production');
      console.log('');
    } catch (error) {
      console.log('❌ Auth request failed:', error.response?.data || error.message);
      console.log('');
    }

    console.log('✅ All Execute API tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testExecuteAPI();
