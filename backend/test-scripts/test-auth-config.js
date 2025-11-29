import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test data
let testApiSpecId = null;
let testAuthConfigId = null;

/**
 * Test authentication configuration endpoints
 */
async function testAuthConfig() {
  console.log('🧪 Testing Authentication Configuration API...\n');

  try {
    // Step 1: Create a test API spec first
    console.log('1️⃣  Creating test API spec...');
    const specResponse = await axios.post(`${API_URL}/specs/upload`, {
      name: 'Test API for Auth',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      },
    });

    if (specResponse.data.success) {
      testApiSpecId = specResponse.data.data.id;
      console.log('✅ API spec created:', testApiSpecId);
    } else {
      throw new Error('Failed to create API spec');
    }

    // Step 2: Test API Key authentication
    console.log('\n2️⃣  Testing API Key authentication...');
    const apiKeyResponse = await axios.post(`${API_URL}/auth/config`, {
      apiSpecId: testApiSpecId,
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'test-api-key-12345',
        location: 'header',
      },
    });

    if (apiKeyResponse.data.success) {
      testAuthConfigId = apiKeyResponse.data.data.id;
      console.log('✅ API Key auth config created');
      console.log('   Masked value:', apiKeyResponse.data.data.apiKey.value);
    } else {
      throw new Error('Failed to create API Key auth config');
    }

    // Step 3: Get auth config
    console.log('\n3️⃣  Getting auth config...');
    const getResponse = await axios.get(`${API_URL}/auth/config/${testApiSpecId}`);
    
    if (getResponse.data.success) {
      console.log('✅ Auth config retrieved');
      console.log('   Auth type:', getResponse.data.data.authType);
      console.log('   Masked value:', getResponse.data.data.apiKey.value);
    } else {
      throw new Error('Failed to get auth config');
    }

    // Step 4: Update to Bearer token
    console.log('\n4️⃣  Updating to Bearer token auth...');
    const updateResponse = await axios.put(`${API_URL}/auth/config/${testApiSpecId}`, {
      authType: 'bearer',
      bearerToken: {
        token: 'bearer-token-xyz-789',
      },
    });

    if (updateResponse.data.success) {
      console.log('✅ Auth config updated to Bearer token');
      console.log('   Masked token:', updateResponse.data.data.bearerToken.token);
    } else {
      throw new Error('Failed to update auth config');
    }

    // Step 5: Test Basic auth
    console.log('\n5️⃣  Testing Basic authentication...');
    
    // First delete the existing config
    await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`);
    
    const basicResponse = await axios.post(`${API_URL}/auth/config`, {
      apiSpecId: testApiSpecId,
      authType: 'basic',
      basic: {
        username: 'testuser',
        password: 'testpassword123',
      },
    });

    if (basicResponse.data.success) {
      console.log('✅ Basic auth config created');
      console.log('   Username:', basicResponse.data.data.basic.username);
      console.log('   Masked password:', basicResponse.data.data.basic.password);
    } else {
      throw new Error('Failed to create Basic auth config');
    }

    // Step 6: Test OAuth 2.0
    console.log('\n6️⃣  Testing OAuth 2.0 authentication...');
    
    // Delete existing config
    await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`);
    
    const oauth2Response = await axios.post(`${API_URL}/auth/config`, {
      apiSpecId: testApiSpecId,
      authType: 'oauth2',
      oauth2: {
        accessToken: 'access-token-abc-123',
        refreshToken: 'refresh-token-def-456',
        tokenType: 'Bearer',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        clientId: 'client-id-123',
        clientSecret: 'client-secret-456',
        authUrl: 'https://auth.example.com/oauth/authorize',
        tokenUrl: 'https://auth.example.com/oauth/token',
        scope: 'read write',
      },
    });

    if (oauth2Response.data.success) {
      console.log('✅ OAuth 2.0 auth config created');
      console.log('   Client ID:', oauth2Response.data.data.oauth2.clientId);
      console.log('   Masked access token:', oauth2Response.data.data.oauth2.accessToken);
      console.log('   Masked client secret:', oauth2Response.data.data.oauth2.clientSecret);
    } else {
      throw new Error('Failed to create OAuth 2.0 auth config');
    }

    // Step 7: Test validation errors
    console.log('\n7️⃣  Testing validation errors...');
    
    try {
      await axios.post(`${API_URL}/auth/config`, {
        apiSpecId: testApiSpecId,
        authType: 'apikey',
        apiKey: {
          key: 'X-API-Key',
          // Missing value
        },
      });
      console.log('❌ Should have failed validation');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation error caught correctly');
        console.log('   Error:', error.response.data.error.message);
      } else {
        throw error;
      }
    }

    // Step 8: Test duplicate config error
    console.log('\n8️⃣  Testing duplicate config error...');
    
    try {
      await axios.post(`${API_URL}/auth/config`, {
        apiSpecId: testApiSpecId,
        authType: 'bearer',
        bearerToken: {
          token: 'another-token',
        },
      });
      console.log('❌ Should have failed with duplicate error');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Duplicate config error caught correctly');
        console.log('   Error:', error.response.data.error.message);
      } else {
        throw error;
      }
    }

    // Step 9: Test non-existent API spec
    console.log('\n9️⃣  Testing non-existent API spec...');
    
    try {
      await axios.post(`${API_URL}/auth/config`, {
        apiSpecId: '507f1f77bcf86cd799439011', // Valid ObjectId but doesn't exist
        authType: 'bearer',
        bearerToken: {
          token: 'test-token',
        },
      });
      console.log('❌ Should have failed with not found error');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Non-existent API spec error caught correctly');
        console.log('   Error:', error.response.data.error.message);
      } else {
        throw error;
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await axios.delete(`${API_URL}/auth/config/${testApiSpecId}`);
    await axios.delete(`${API_URL}/specs/${testApiSpecId}`);
    console.log('✅ Cleanup complete');

    console.log('\n✅ All authentication configuration tests passed! 🎉');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
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
testAuthConfig();
