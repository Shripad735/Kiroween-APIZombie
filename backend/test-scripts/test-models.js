import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  APISpec,
  APIRequest,
  Workflow,
  TestSuite,
  RequestHistory,
  AuthConfig,
} from '../src/models/index.js';

dotenv.config({ path: '../.env' });

async function testModels() {
  try {
    console.log('Testing model imports and schema validation...\n');

    // Test APISpec
    console.log('✓ APISpec model loaded');
    console.log(`  - Indexes: ${Object.keys(APISpec.schema.indexes()).length}`);

    // Test APIRequest
    console.log('✓ APIRequest model loaded');
    console.log(`  - Indexes: ${Object.keys(APIRequest.schema.indexes()).length}`);

    // Test Workflow
    console.log('✓ Workflow model loaded');
    console.log(`  - Indexes: ${Object.keys(Workflow.schema.indexes()).length}`);

    // Test TestSuite
    console.log('✓ TestSuite model loaded');
    console.log(`  - Indexes: ${Object.keys(TestSuite.schema.indexes()).length}`);

    // Test RequestHistory
    console.log('✓ RequestHistory model loaded');
    console.log(`  - Indexes: ${Object.keys(RequestHistory.schema.indexes()).length}`);

    // Test AuthConfig
    console.log('✓ AuthConfig model loaded');
    console.log(`  - Indexes: ${Object.keys(AuthConfig.schema.indexes()).length}`);

    console.log('\n✅ All models loaded successfully!');
    console.log('\nModel Summary:');
    console.log('- APISpec: Stores API specifications (OpenAPI, GraphQL, gRPC)');
    console.log('- APIRequest: Stores saved API requests');
    console.log('- Workflow: Stores multi-step API workflows');
    console.log('- TestSuite: Stores generated test suites');
    console.log('- RequestHistory: Stores execution history with TTL');
    console.log('- AuthConfig: Stores encrypted authentication configs');

    // Test schema validation
    console.log('\nTesting schema validation...');
    
    // Test APISpec validation
    const testSpec = new APISpec({
      name: 'Test API',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: { openapi: '3.0.0' },
    });
    await testSpec.validate();
    console.log('✓ APISpec validation passed');

    // Test APIRequest validation
    const testRequest = new APIRequest({
      protocol: 'rest',
      method: 'GET',
      endpoint: '/users',
    });
    await testRequest.validate();
    console.log('✓ APIRequest validation passed');

    // Test Workflow validation
    const testWorkflow = new Workflow({
      name: 'Test Workflow',
      steps: [{
        order: 1,
        apiRequest: {
          protocol: 'rest',
          method: 'GET',
          endpoint: '/users',
        },
      }],
    });
    await testWorkflow.validate();
    console.log('✓ Workflow validation passed');

    // Test TestSuite validation
    const testSuite = new TestSuite({
      name: 'Test Suite',
      apiSpecId: new mongoose.Types.ObjectId(),
      endpoint: '/users',
      tests: [{
        name: 'Get users success',
        request: { protocol: 'rest', method: 'GET', endpoint: '/users' },
        expectedResponse: { statusCode: 200, assertions: [] },
        category: 'success',
      }],
    });
    await testSuite.validate();
    console.log('✓ TestSuite validation passed');

    // Test RequestHistory validation
    const testHistory = new RequestHistory({
      userId: 'test-user',
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: '/users',
      },
      response: {
        statusCode: 200,
      },
      duration: 150,
      success: true,
    });
    await testHistory.validate();
    console.log('✓ RequestHistory validation passed');

    // Test AuthConfig validation
    const testAuth = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'bearer',
      bearerToken: {
        token: 'test-token',
      },
      userId: 'test-user',
    });
    await testAuth.validate();
    console.log('✓ AuthConfig validation passed');

    console.log('\n✅ All schema validations passed!');

    // Test encryption methods
    console.log('\nTesting encryption methods...');
    const encrypted = testAuth.encryptValue('sensitive-data');
    console.log('✓ Encryption works');
    const decrypted = testAuth.decryptValue(encrypted);
    if (decrypted === 'sensitive-data') {
      console.log('✓ Decryption works');
    } else {
      throw new Error('Decryption failed');
    }

    console.log('\n🎉 All tests passed! Models are ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testModels();
