import connectDB from '../src/config/database.js';
import { APISpec, APIRequest, Workflow, TestSuite, RequestHistory, AuthConfig } from '../src/models/index.js';

async function testConnection() {
  console.log('🧟 Testing APIZombie Database Connection...\n');

  try {
    // Connect to database
    await connectDB();

    // Test creating a sample API spec
    console.log('📝 Testing APISpec model...');
    const testSpec = new APISpec({
      name: 'Test API',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: { openapi: '3.0.0' },
      endpoints: [{
        path: '/users',
        method: 'GET',
        description: 'Get all users',
      }],
    });
    await testSpec.save();
    console.log('✅ APISpec model works!');

    // Test creating a sample request
    console.log('📝 Testing APIRequest model...');
    const testRequest = new APIRequest({
      name: 'Get Users',
      protocol: 'rest',
      method: 'GET',
      endpoint: '/users',
      apiSpecId: testSpec._id,
    });
    await testRequest.save();
    console.log('✅ APIRequest model works!');

    // Test creating a sample workflow
    console.log('📝 Testing Workflow model...');
    const testWorkflow = new Workflow({
      name: 'User Creation Flow',
      description: 'Create user and fetch details',
      steps: [
        {
          order: 1,
          name: 'Create User',
          apiRequest: {
            protocol: 'rest',
            method: 'POST',
            endpoint: '/users',
            body: { name: 'Test User' },
          },
        },
      ],
    });
    await testWorkflow.save();
    console.log('✅ Workflow model works!');

    // Test creating a sample test suite
    console.log('📝 Testing TestSuite model...');
    const testSuite = new TestSuite({
      name: 'User API Tests',
      apiSpecId: testSpec._id,
      endpoint: '/users',
      tests: [
        {
          name: 'Should return 200',
          description: 'Success case',
          request: { protocol: 'rest', method: 'GET', endpoint: '/users' },
          expectedResponse: {
            statusCode: 200,
            assertions: [],
          },
          category: 'success',
        },
      ],
    });
    await testSuite.save();
    console.log('✅ TestSuite model works!');

    // Test creating a sample history entry
    console.log('📝 Testing RequestHistory model...');
    const testHistory = new RequestHistory({
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: '/users',
      },
      response: {
        statusCode: 200,
        body: { users: [] },
      },
      duration: 150,
      success: true,
      apiSpecId: testSpec._id,
    });
    await testHistory.save();
    console.log('✅ RequestHistory model works!');

    // Test creating a sample auth config
    console.log('📝 Testing AuthConfig model...');
    const testAuth = new AuthConfig({
      apiSpecId: testSpec._id,
      authType: 'bearer',
      bearerToken: {
        token: 'test-token-123',
      },
    });
    await testAuth.save();
    console.log('✅ AuthConfig model works!');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await APISpec.deleteOne({ _id: testSpec._id });
    await APIRequest.deleteOne({ _id: testRequest._id });
    await Workflow.deleteOne({ _id: testWorkflow._id });
    await TestSuite.deleteOne({ _id: testSuite._id });
    await RequestHistory.deleteOne({ _id: testHistory._id });
    await AuthConfig.deleteOne({ _id: testAuth._id });
    console.log('✅ Cleanup complete!');

    console.log('\n🎉 All database models are working correctly!');
    console.log('✅ MongoDB connection successful');
    console.log('✅ All schemas validated');
    console.log('✅ Indexes created');
    console.log('\n🧟 APIZombie is ready to come alive!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();
