import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testRequest = {
  name: 'Get Users Test',
  description: 'Test request to get all users',
  protocol: 'rest',
  method: 'GET',
  endpoint: 'https://jsonplaceholder.typicode.com/users',
  headers: {
    'Content-Type': 'application/json',
  },
  tags: ['test', 'users'],
  userId: 'test-user',
};

const testWorkflow = {
  name: 'User Workflow Test',
  description: 'Test workflow for user operations',
  steps: [
    {
      order: 1,
      name: 'Get Users',
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/users',
        headers: {},
      },
      variableMappings: [],
      assertions: [],
    },
    {
      order: 2,
      name: 'Get First User',
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/users/1',
        headers: {},
      },
      variableMappings: [],
      assertions: [],
    },
  ],
  tags: ['test', 'workflow'],
  userId: 'test-user',
};

async function testSavedRequests() {
  console.log('\n🧪 Testing Saved Requests...\n');

  try {
    // 1. Save a request
    console.log('1️⃣ Saving a request...');
    const saveResponse = await axios.post(`${BASE_URL}/saved/requests`, testRequest);
    console.log('✅ Request saved:', saveResponse.data.data._id);
    const savedRequestId = saveResponse.data.data._id;

    // 2. Get saved requests
    console.log('\n2️⃣ Getting saved requests...');
    const getResponse = await axios.get(`${BASE_URL}/saved/requests?userId=test-user`);
    console.log(`✅ Found ${getResponse.data.data.length} saved requests`);
    console.log('Pagination:', getResponse.data.pagination);

    // 3. Search saved requests
    console.log('\n3️⃣ Searching saved requests...');
    const searchResponse = await axios.get(`${BASE_URL}/saved/requests?search=users&userId=test-user`);
    console.log(`✅ Found ${searchResponse.data.data.length} requests matching "users"`);

    // 4. Filter by protocol
    console.log('\n4️⃣ Filtering by protocol...');
    const filterResponse = await axios.get(`${BASE_URL}/saved/requests?protocol=rest&userId=test-user`);
    console.log(`✅ Found ${filterResponse.data.data.length} REST requests`);

    // 5. Filter by tags
    console.log('\n5️⃣ Filtering by tags...');
    const tagResponse = await axios.get(`${BASE_URL}/saved/requests?tags=test&userId=test-user`);
    console.log(`✅ Found ${tagResponse.data.data.length} requests with tag "test"`);

    return savedRequestId;
  } catch (error) {
    console.error('❌ Error testing saved requests:', error.response?.data || error.message);
    throw error;
  }
}

async function testSavedWorkflows() {
  console.log('\n🧪 Testing Saved Workflows...\n');

  try {
    // 1. Save a workflow
    console.log('1️⃣ Saving a workflow...');
    const saveResponse = await axios.post(`${BASE_URL}/saved/workflows`, testWorkflow);
    console.log('✅ Workflow saved:', saveResponse.data.data._id);
    const savedWorkflowId = saveResponse.data.data._id;

    // 2. Get saved workflows
    console.log('\n2️⃣ Getting saved workflows...');
    const getResponse = await axios.get(`${BASE_URL}/saved/workflows?userId=test-user`);
    console.log(`✅ Found ${getResponse.data.data.length} saved workflows`);
    console.log('Pagination:', getResponse.data.pagination);

    // 3. Search saved workflows
    console.log('\n3️⃣ Searching saved workflows...');
    const searchResponse = await axios.get(`${BASE_URL}/saved/workflows?search=user&userId=test-user`);
    console.log(`✅ Found ${searchResponse.data.data.length} workflows matching "user"`);

    // 4. Filter by tags
    console.log('\n4️⃣ Filtering by tags...');
    const tagResponse = await axios.get(`${BASE_URL}/saved/workflows?tags=workflow&userId=test-user`);
    console.log(`✅ Found ${tagResponse.data.data.length} workflows with tag "workflow"`);

    return savedWorkflowId;
  } catch (error) {
    console.error('❌ Error testing saved workflows:', error.response?.data || error.message);
    throw error;
  }
}

async function testExportImport() {
  console.log('\n🧪 Testing Export/Import...\n');

  try {
    // 1. Export all items
    console.log('1️⃣ Exporting all items...');
    const exportResponse = await axios.post(`${BASE_URL}/saved/export`, {
      type: 'all',
      userId: 'test-user',
    });
    console.log('✅ Export successful');
    console.log('Exported requests:', exportResponse.data.data.data.requests?.length || 0);
    console.log('Exported workflows:', exportResponse.data.data.data.workflows?.length || 0);

    const exportData = exportResponse.data.data;

    // 2. Import items (as a different user)
    console.log('\n2️⃣ Importing items...');
    const importResponse = await axios.post(`${BASE_URL}/saved/import`, {
      data: exportData,
      userId: 'imported-user',
    });
    console.log('✅ Import successful');
    console.log('Import results:', importResponse.data.data);

    // 3. Verify imported items
    console.log('\n3️⃣ Verifying imported items...');
    const verifyResponse = await axios.get(`${BASE_URL}/saved/requests?userId=imported-user`);
    console.log(`✅ Found ${verifyResponse.data.data.length} imported requests`);

    return exportData;
  } catch (error) {
    console.error('❌ Error testing export/import:', error.response?.data || error.message);
    throw error;
  }
}

async function testHistory() {
  console.log('\n🧪 Testing Request History...\n');

  try {
    // 1. Execute a request to create history
    console.log('1️⃣ Executing a request to create history...');
    const executeResponse = await axios.post(`${BASE_URL}/execute`, {
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/users/1',
        headers: {},
      },
      userId: 'test-user',
      saveToHistory: true,
    });
    console.log('✅ Request executed:', executeResponse.data.success);

    // Wait a bit for history to be saved
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Get history
    console.log('\n2️⃣ Getting request history...');
    const historyResponse = await axios.get(`${BASE_URL}/history?userId=test-user`);
    console.log(`✅ Found ${historyResponse.data.data.length} history entries`);
    console.log('Pagination:', historyResponse.data.pagination);

    if (historyResponse.data.data.length > 0) {
      const firstEntry = historyResponse.data.data[0];
      console.log('Latest entry:', {
        protocol: firstEntry.request.protocol,
        endpoint: firstEntry.request.endpoint,
        success: firstEntry.success,
        duration: firstEntry.duration + 'ms',
      });

      // 3. Get single history entry
      console.log('\n3️⃣ Getting single history entry...');
      const singleResponse = await axios.get(`${BASE_URL}/history/${firstEntry._id}`);
      console.log('✅ Retrieved history entry:', singleResponse.data.data._id);
    }

    // 4. Filter by protocol
    console.log('\n4️⃣ Filtering history by protocol...');
    const protocolResponse = await axios.get(`${BASE_URL}/history?protocol=rest&userId=test-user`);
    console.log(`✅ Found ${protocolResponse.data.data.length} REST requests in history`);

    // 5. Filter by success
    console.log('\n5️⃣ Filtering history by success...');
    const successResponse = await axios.get(`${BASE_URL}/history?success=true&userId=test-user`);
    console.log(`✅ Found ${successResponse.data.data.length} successful requests`);

    // 6. Filter by date range
    console.log('\n6️⃣ Filtering history by date range...');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const dateResponse = await axios.get(
      `${BASE_URL}/history?startDate=${yesterday}&endDate=${tomorrow}&userId=test-user`
    );
    console.log(`✅ Found ${dateResponse.data.data.length} requests in date range`);

    // 7. Test pagination
    console.log('\n7️⃣ Testing pagination...');
    const page1Response = await axios.get(`${BASE_URL}/history?page=1&limit=2&userId=test-user`);
    console.log(`✅ Page 1: ${page1Response.data.data.length} entries`);
    console.log('Pagination:', page1Response.data.pagination);

    return historyResponse.data.data.length;
  } catch (error) {
    console.error('❌ Error testing history:', error.response?.data || error.message);
    throw error;
  }
}

async function testClearHistory() {
  console.log('\n🧪 Testing Clear History...\n');

  try {
    // 1. Clear history for test user
    console.log('1️⃣ Clearing history...');
    const clearResponse = await axios.delete(`${BASE_URL}/history?userId=test-user`);
    console.log('✅ History cleared:', clearResponse.data.data.deletedCount, 'entries deleted');

    // 2. Verify history is empty
    console.log('\n2️⃣ Verifying history is empty...');
    const verifyResponse = await axios.get(`${BASE_URL}/history?userId=test-user`);
    console.log(`✅ History entries remaining: ${verifyResponse.data.data.length}`);

    return clearResponse.data.data.deletedCount;
  } catch (error) {
    console.error('❌ Error testing clear history:', error.response?.data || error.message);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Saved Items and History Tests...\n');
  console.log('=' .repeat(60));

  try {
    // Test saved requests
    await testSavedRequests();
    console.log('\n' + '=' .repeat(60));

    // Test saved workflows
    await testSavedWorkflows();
    console.log('\n' + '=' .repeat(60));

    // Test export/import
    await testExportImport();
    console.log('\n' + '=' .repeat(60));

    // Test history
    await testHistory();
    console.log('\n' + '=' .repeat(60));

    // Test clear history
    await testClearHistory();
    console.log('\n' + '=' .repeat(60));

    console.log('\n✅ All tests completed successfully! 🎉\n');
  } catch (error) {
    console.error('\n❌ Tests failed\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
