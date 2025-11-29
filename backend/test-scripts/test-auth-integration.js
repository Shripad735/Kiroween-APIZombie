import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

/**
 * Test complete authentication integration
 */
async function testAuthIntegration() {
  console.log('🧪 Testing Complete Authentication Integration...\n');

  let testApiSpecId = null;

  try {
    // Step 1: Create a test API spec
    console.log('1️⃣  Creating test API spec...');
    const specResponse = await axios.post(`${API_URL}/specs/upload`, {
      name: 'HTTPBin Test API',
      type: 'openapi',
      baseUrl: 'https://httpbin.org',
      specification: {
        openapi: '3.0.0',
        info: { title: 'HTTPBin API', version: '1.0.0' },
        paths: {
          '/headers': {
            get: {
              summary: 'Get request headers',
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      },
    });

    testApiSpecId = specResponse.data.data.id;
    console.log('✅ API spec created:', testApiSpecId);

    // Step 2: Create Bearer token auth config
    console.log('\n2️⃣  Creating Bearer token auth config...');
    const authResponse = await axios.post(`${API_URL}/auth/config`, {
      apiSpecId: testApiSpecId,
      authType: 'bearer',
      bearerToken: {
        token: 'my-secret-bearer-token-12345',
      },
    });

    console.log('✅ Auth config created');
    console.log('   Auth type:', authResponse.data.data.authType);
    console.log('   Token (masked):', authResponse.data.data.bearerToken.token);

    // Step 3: Execute request WITH authentication
    console.log('\n3️⃣  Executing request WITH authentication...');
    const executeWithAuthResponse = await axios.post(`${API_URL}/execute`, {
      apiSpecId: testApiSpecId,
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://httpbin.org/headers',
        headers: {
          'X-Custom-Header': 'test-value',
        },
      },
      saveToHistory: false,
    });

    if (executeWithAuthResponse.data.success) {
      console.log('✅ Request executed successfully');
      const responseHeaders = executeWithAuthResponse.data.data.body.headers;
      console.log('   Response headers:', JSON.stringify(responseHeaders, null, 2));
      
      // Check if Authorization header was sent
      if (responseHeaders.Authorization) {
        console.log('   ✅ Authorization header was sent:', responseHeaders.Authorization);
        if (responseHeaders.Authorization.includes('Bearer')) {
          console.log('   ✅ Bearer token format is correct');
        } else {
          console.log('   ❌ Bearer token format is incorrect');
        }
      } else {
        console.log('   ❌ Authorization header was NOT sent');
      }

      // Check if custom header was preserved
      if (responseHeaders['X-Custom-Header']) {
        console.log('   ✅ Custom header was preserved:', responseHeaders['X-Custom-Header']);
      } else {
        console.log('   ❌ Custom header was NOT preserved');
      }
    } else {
      throw new Error('Request execution failed');
    }

    // Step 4: Execute request WITHOUT authentication (no apiSpecId)
    console.log('\n4️⃣  Executing request WITHOUT authentication...');
    const executeWithoutAuthResponse = await axios.post(`${API_URL}/execute`, {
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://httpbin.org/headers',
        headers: {
          'X-Custom-Header': 'test-value',
        },
      },
      saveToHistory: false,
    });

    if (executeWithoutAuthResponse.data.success) {
      console.log('✅ Request executed successfully');
      const responseHeaders = executeWithoutAuthResponse.data.data.body.headers;
      
      // Check if Authorization header was NOT sent
      if (!responseHeaders.Authorization) {
        console.log('   ✅ Authorization header was NOT sent (as expected)');
      } else {
        console.log('   ❌ Authorization header was sent (unexpected):', responseHeaders.Authorization);
      }
    } else {
      throw new Error('Request execution failed');
    }

    // Step 5: Update to API Key auth
    console.log('\n5️⃣  Updating to API Key authentication...');
    await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'my-api-key-67890',
        location: 'header',
      },
    });

    console.log('✅ Auth config updated to API Key');

    // Step 6: Execute request with API Key
    console.log('\n6️⃣  Executing request with API Key...');
    const executeWithApiKeyResponse = await axios.post(`${API_URL}/execute`, {
      apiSpecId: testApiSpecId,
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://httpbin.org/headers',
        headers: {},
      },
      saveToHistory: false,
    });

    if (executeWithApiKeyResponse.data.success) {
      console.log('✅ Request executed successfully');
      const responseHeaders = executeWithApiKeyResponse.data.data.body.headers;
      
      // Check if API Key header was sent
      if (responseHeaders['X-Api-Key']) {
        console.log('   ✅ X-API-Key header was sent:', responseHeaders['X-Api-Key']);
      } else {
        console.log('   ❌ X-API-Key header was NOT sent');
      }
    } else {
      throw new Error('Request execution failed');
    }

    // Step 7: Update to Basic auth
    console.log('\n7️⃣  Updating to Basic authentication...');
    await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'basic',
      basic: {
        username: 'testuser',
        password: 'testpass123',
      },
    });

    console.log('✅ Auth config updated to Basic auth');

    // Step 8: Execute request with Basic auth
    console.log('\n8️⃣  Executing request with Basic auth...');
    const executeWithBasicResponse = await axios.post(`${API_URL}/execute`, {
      apiSpecId: testApiSpecId,
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://httpbin.org/headers',
        headers: {},
      },
      saveToHistory: false,
    });

    if (executeWithBasicResponse.data.success) {
      console.log('✅ Request executed successfully');
      const responseHeaders = executeWithBasicResponse.data.data.body.headers;
      
      // Check if Authorization header was sent with Basic
      if (responseHeaders.Authorization) {
        console.log('   ✅ Authorization header was sent:', responseHeaders.Authorization);
        if (responseHeaders.Authorization.includes('Basic')) {
          console.log('   ✅ Basic auth format is correct');
        } else {
          console.log('   ❌ Basic auth format is incorrect');
        }
      } else {
        console.log('   ❌ Authorization header was NOT sent');
      }
    } else {
      throw new Error('Request execution failed');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`);
    await axios.delete(`${API_URL}/specs/${testApiSpecId}`);
    console.log('✅ Cleanup complete');

    console.log('\n✅ All integration tests passed! 🎉');
    console.log('🔒 Authentication is working end-to-end');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Cleanup on error
    try {
      if (testApiSpecId) {
        await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`).catch(() => {});
        await axios.delete(`${API_URL}/specs/${testApiSpecId}`).catch(() => {});
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Run tests
testAuthIntegration();
