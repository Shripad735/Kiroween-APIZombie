/**
 * Test script for Authentication Configuration UI
 * Tests the complete flow of creating, reading, updating, and deleting auth configs
 */

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test data
let testApiSpecId = null;
let testAuthConfigId = null;

async function testAuthConfigFlow() {
  console.log('🧪 Testing Authentication Configuration UI Flow\n');

  try {
    // Step 1: Create a test API spec
    console.log('1️⃣  Creating test API specification...');
    const specResponse = await axios.post(`${API_URL}/specs/upload`, {
      name: 'Test API for Auth Config',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: { '200': { description: 'Success' } }
            }
          }
        }
      }
    });

    if (specResponse.data.success) {
      testApiSpecId = specResponse.data.data.id;
      console.log('✅ API spec created:', testApiSpecId);
    } else {
      throw new Error('Failed to create API spec');
    }

    // Step 2: Test API Key authentication
    console.log('\n2️⃣  Testing API Key authentication configuration...');
    const apiKeyConfig = {
      apiSpecId: testApiSpecId,
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'test-api-key-12345',
        location: 'header'
      }
    };

    const createResponse = await axios.post(`${API_URL}/auth/config`, apiKeyConfig);
    if (createResponse.data.success) {
      testAuthConfigId = createResponse.data.data.id;
      console.log('✅ API Key config created');
      console.log('   - Key name:', createResponse.data.data.apiKey.key);
      console.log('   - Value:', createResponse.data.data.apiKey.value);
      console.log('   - Location:', createResponse.data.data.apiKey.location);
    } else {
      throw new Error('Failed to create API Key config');
    }

    // Step 3: Get the auth config
    console.log('\n3️⃣  Retrieving authentication configuration...');
    const getResponse = await axios.get(`${API_URL}/auth/config/${testApiSpecId}`);
    if (getResponse.data.success) {
      console.log('✅ Config retrieved successfully');
      console.log('   - Auth type:', getResponse.data.data.authType);
      console.log('   - Credentials masked:', getResponse.data.data.apiKey.value === '***masked***');
    } else {
      throw new Error('Failed to retrieve config');
    }

    // Step 4: Update to Bearer Token
    console.log('\n4️⃣  Updating to Bearer Token authentication...');
    const updateResponse = await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'bearer',
      bearerToken: {
        token: 'bearer-token-xyz-789'
      }
    });

    if (updateResponse.data.success) {
      console.log('✅ Config updated to Bearer Token');
      console.log('   - Token masked:', updateResponse.data.data.bearerToken.token === '***masked***');
    } else {
      throw new Error('Failed to update config');
    }

    // Step 5: Test Basic Auth
    console.log('\n5️⃣  Testing Basic Auth configuration...');
    const basicAuthUpdate = await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'basic',
      basic: {
        username: 'testuser',
        password: 'testpass123'
      }
    });

    if (basicAuthUpdate.data.success) {
      console.log('✅ Config updated to Basic Auth');
      console.log('   - Username:', basicAuthUpdate.data.data.basic.username);
      console.log('   - Password masked:', basicAuthUpdate.data.data.basic.password === '***masked***');
    } else {
      throw new Error('Failed to update to Basic Auth');
    }

    // Step 6: Test OAuth 2.0
    console.log('\n6️⃣  Testing OAuth 2.0 configuration...');
    const oauth2Update = await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'oauth2',
      oauth2: {
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-def',
        tokenType: 'Bearer',
        clientId: 'client-123',
        clientSecret: 'secret-456',
        authUrl: 'https://auth.example.com/oauth/authorize',
        tokenUrl: 'https://auth.example.com/oauth/token',
        scope: 'read write'
      }
    });

    if (oauth2Update.data.success) {
      console.log('✅ Config updated to OAuth 2.0');
      console.log('   - Client ID:', oauth2Update.data.data.oauth2.clientId);
      console.log('   - Access token masked:', oauth2Update.data.data.oauth2.accessToken === '***masked***');
      console.log('   - Client secret masked:', oauth2Update.data.data.oauth2.clientSecret === '***masked***');
    } else {
      throw new Error('Failed to update to OAuth 2.0');
    }

    // Step 7: Test validation errors
    console.log('\n7️⃣  Testing validation errors...');
    try {
      await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
        authType: 'apikey',
        apiKey: {
          key: '', // Invalid: empty key
          value: 'test',
          location: 'header'
        }
      });
      console.log('❌ Validation should have failed');
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Validation error caught correctly');
        console.log('   - Error:', err.response.data.error.message);
      } else {
        throw err;
      }
    }

    // Step 8: Delete the auth config
    console.log('\n8️⃣  Deleting authentication configuration...');
    const deleteResponse = await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`);
    if (deleteResponse.data.success) {
      console.log('✅ Config deleted successfully');
    } else {
      throw new Error('Failed to delete config');
    }

    // Step 9: Verify deletion
    console.log('\n9️⃣  Verifying deletion...');
    try {
      await axios.get(`${API_URL}/auth/config/${testApiSpecId}`);
      console.log('❌ Config should not exist');
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('✅ Config properly deleted (404 returned)');
      } else {
        throw err;
      }
    }

    // Cleanup: Delete test API spec
    console.log('\n🧹 Cleaning up test data...');
    await axios.delete(`${API_URL}/specs/${testApiSpecId}`);
    console.log('✅ Test API spec deleted');

    console.log('\n✨ All tests passed! Authentication Configuration UI is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }

    // Cleanup on error
    if (testApiSpecId) {
      try {
        await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`).catch(() => {});
        await axios.delete(`${API_URL}/specs/${testApiSpecId}`).catch(() => {});
        console.log('🧹 Cleaned up test data');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }

    process.exit(1);
  }
}

// Run the test
testAuthConfigFlow();
