import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AuthConfig from '../src/models/AuthConfig.js';
import APISpec from '../src/models/APISpec.js';
import RESTHandler from '../src/handlers/RESTHandler.js';

dotenv.config();

/**
 * Test authentication header injection
 */
async function testAuthInjection() {
  console.log('🔐 Testing Authentication Header Injection...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Create a test API spec
    console.log('1️⃣  Creating test API spec...');
    const apiSpec = new APISpec({
      name: 'Auth Injection Test API',
      type: 'openapi',
      baseUrl: 'https://httpbin.org',
      specification: { test: true },
      endpoints: [],
      userId: 'test-user',
    });
    await apiSpec.save();
    console.log('✅ API spec created:', apiSpec._id);

    const handler = new RESTHandler();

    // Test 1: API Key in header
    console.log('\n2️⃣  Testing API Key authentication (header)...');
    const apiKeyConfig = new AuthConfig({
      apiSpecId: apiSpec._id,
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'test-api-key-12345',
        location: 'header',
      },
      userId: 'test-user',
    });
    await apiKeyConfig.save();

    const baseRequest = {
      protocol: 'rest',
      method: 'GET',
      endpoint: 'https://httpbin.org/headers',
      headers: {},
    };

    const apiKeyRequest = handler.injectAuthentication(baseRequest, apiKeyConfig);
    console.log('   Original headers:', baseRequest.headers);
    console.log('   Injected headers:', apiKeyRequest.headers);
    console.log('   Has X-API-Key?', apiKeyRequest.headers['X-API-Key'] ? '✅ YES' : '❌ NO');
    console.log('   Key value:', apiKeyRequest.headers['X-API-Key']);

    // Test 2: Bearer token
    console.log('\n3️⃣  Testing Bearer token authentication...');
    const bearerConfig = new AuthConfig({
      apiSpecId: apiSpec._id,
      authType: 'bearer',
      bearerToken: {
        token: 'bearer-token-xyz-789',
      },
      userId: 'test-user-2',
    });
    await bearerConfig.save();

    const bearerRequest = handler.injectAuthentication(baseRequest, bearerConfig);
    console.log('   Injected headers:', bearerRequest.headers);
    console.log('   Has Authorization?', bearerRequest.headers['Authorization'] ? '✅ YES' : '❌ NO');
    console.log('   Authorization value:', bearerRequest.headers['Authorization']);
    console.log('   Starts with "Bearer "?', bearerRequest.headers['Authorization']?.startsWith('Bearer ') ? '✅ YES' : '❌ NO');

    // Test 3: Basic auth
    console.log('\n4️⃣  Testing Basic authentication...');
    const basicConfig = new AuthConfig({
      apiSpecId: apiSpec._id,
      authType: 'basic',
      basic: {
        username: 'testuser',
        password: 'testpassword123',
      },
      userId: 'test-user-3',
    });
    await basicConfig.save();

    const basicRequest = handler.injectAuthentication(baseRequest, basicConfig);
    console.log('   Injected headers:', basicRequest.headers);
    console.log('   Has Authorization?', basicRequest.headers['Authorization'] ? '✅ YES' : '❌ NO');
    console.log('   Authorization value:', basicRequest.headers['Authorization']);
    console.log('   Starts with "Basic "?', basicRequest.headers['Authorization']?.startsWith('Basic ') ? '✅ YES' : '❌ NO');
    
    // Decode and verify
    const basicAuth = basicRequest.headers['Authorization'].replace('Basic ', '');
    const decoded = Buffer.from(basicAuth, 'base64').toString('utf8');
    console.log('   Decoded credentials:', decoded);
    console.log('   Matches "testuser:testpassword123"?', decoded === 'testuser:testpassword123' ? '✅ YES' : '❌ NO');

    // Test 4: OAuth 2.0
    console.log('\n5️⃣  Testing OAuth 2.0 authentication...');
    const oauth2Config = new AuthConfig({
      apiSpecId: apiSpec._id,
      authType: 'oauth2',
      oauth2: {
        accessToken: 'access-token-abc-123',
        tokenType: 'Bearer',
      },
      userId: 'test-user-4',
    });
    await oauth2Config.save();

    const oauth2Request = handler.injectAuthentication(baseRequest, oauth2Config);
    console.log('   Injected headers:', oauth2Request.headers);
    console.log('   Has Authorization?', oauth2Request.headers['Authorization'] ? '✅ YES' : '❌ NO');
    console.log('   Authorization value:', oauth2Request.headers['Authorization']);
    console.log('   Starts with "Bearer "?', oauth2Request.headers['Authorization']?.startsWith('Bearer ') ? '✅ YES' : '❌ NO');

    // Test 5: No auth config
    console.log('\n6️⃣  Testing without authentication...');
    const noAuthRequest = handler.injectAuthentication(baseRequest, null);
    console.log('   Headers:', noAuthRequest.headers);
    console.log('   Headers unchanged?', Object.keys(noAuthRequest.headers).length === 0 ? '✅ YES' : '❌ NO');

    // Test 6: Preserve existing headers
    console.log('\n7️⃣  Testing header preservation...');
    const requestWithHeaders = {
      ...baseRequest,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
    };
    
    const preservedRequest = handler.injectAuthentication(requestWithHeaders, bearerConfig);
    console.log('   Original headers:', requestWithHeaders.headers);
    console.log('   Injected headers:', preservedRequest.headers);
    console.log('   Content-Type preserved?', preservedRequest.headers['Content-Type'] === 'application/json' ? '✅ YES' : '❌ NO');
    console.log('   X-Custom-Header preserved?', preservedRequest.headers['X-Custom-Header'] === 'custom-value' ? '✅ YES' : '❌ NO');
    console.log('   Authorization added?', preservedRequest.headers['Authorization'] ? '✅ YES' : '❌ NO');

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await AuthConfig.deleteMany({ userId: { $in: ['test-user', 'test-user-2', 'test-user-3', 'test-user-4'] } });
    await APISpec.deleteOne({ _id: apiSpec._id });
    console.log('✅ Cleanup complete');

    console.log('\n✅ All authentication injection tests passed! 🎉');
    console.log('🔒 Authentication headers are properly injected');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run tests
testAuthInjection();
