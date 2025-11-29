/**
 * Test script for Saved Items and History UI functionality
 * Tests the backend endpoints that power the SavedItems and History components
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Helper function to log results
const log = (message, data = null) => {
  console.log(`\n✓ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logError = (message, error) => {
  console.error(`\n✗ ${message}`);
  console.error(error.response?.data || error.message);
};

// Test data
const testRequest = {
  name: 'Test API Request',
  description: 'A test request for UI testing',
  protocol: 'rest',
  method: 'GET',
  endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
  headers: {
    'Content-Type': 'application/json',
  },
  tags: ['test', 'ui'],
};

const testWorkflow = {
  name: 'Test Workflow',
  description: 'A test workflow for UI testing',
  steps: [
    {
      order: 1,
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
      },
    },
    {
      order: 2,
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/users/1',
      },
    },
  ],
  tags: ['test', 'ui'],
};

async function runTests() {
  console.log('🧪 Testing Saved Items and History UI Backend Endpoints\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Save a request
    console.log('\n📝 Test 1: Save API Request');
    const savedRequestResponse = await axios.post(
      `${API_BASE_URL}/api/saved/requests`,
      testRequest
    );
    log('Request saved successfully', savedRequestResponse.data);
    const savedRequestId = savedRequestResponse.data.data._id;

    // Test 2: Get saved requests
    console.log('\n📋 Test 2: Get Saved Requests');
    const getRequestsResponse = await axios.get(
      `${API_BASE_URL}/api/saved/requests`
    );
    log('Retrieved saved requests', {
      count: getRequestsResponse.data.data.length,
      pagination: getRequestsResponse.data.pagination,
    });

    // Test 3: Search saved requests
    console.log('\n🔍 Test 3: Search Saved Requests');
    const searchResponse = await axios.get(
      `${API_BASE_URL}/api/saved/requests?search=Test`
    );
    log('Search results', {
      count: searchResponse.data.data.length,
      matches: searchResponse.data.data.map((r) => r.name),
    });

    // Test 4: Filter by protocol
    console.log('\n🔍 Test 4: Filter by Protocol');
    const filterResponse = await axios.get(
      `${API_BASE_URL}/api/saved/requests?protocol=rest`
    );
    log('Filter results', {
      count: filterResponse.data.data.length,
      protocols: [...new Set(filterResponse.data.data.map((r) => r.protocol))],
    });

    // Test 5: Save a workflow
    console.log('\n📝 Test 5: Save Workflow');
    const savedWorkflowResponse = await axios.post(
      `${API_BASE_URL}/api/saved/workflows`,
      testWorkflow
    );
    log('Workflow saved successfully', savedWorkflowResponse.data);

    // Test 6: Get saved workflows
    console.log('\n📋 Test 6: Get Saved Workflows');
    const getWorkflowsResponse = await axios.get(
      `${API_BASE_URL}/api/saved/workflows`
    );
    log('Retrieved saved workflows', {
      count: getWorkflowsResponse.data.data.length,
      pagination: getWorkflowsResponse.data.pagination,
    });

    // Test 7: Export saved items
    console.log('\n📦 Test 7: Export Saved Items');
    const exportResponse = await axios.post(
      `${API_BASE_URL}/api/saved/export`,
      { type: 'all' }
    );
    log('Export successful', {
      exportDate: exportResponse.data.data.exportDate,
      requestCount: exportResponse.data.data.data.requests?.length || 0,
      workflowCount: exportResponse.data.data.data.workflows?.length || 0,
    });

    // Test 8: Import saved items
    console.log('\n📥 Test 8: Import Saved Items');
    // Use the export format
    const importData = {
      data: exportResponse.data.data,
    };
    const importResponse = await axios.post(
      `${API_BASE_URL}/api/saved/import`,
      importData
    );
    log('Import successful', importResponse.data.data);

    // Test 9: Execute a request to create history
    console.log('\n🚀 Test 9: Execute Request (Create History)');
    const executeResponse = await axios.post(`${API_BASE_URL}/api/execute`, {
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
      },
      saveToHistory: true,
    });
    log('Request executed', {
      success: executeResponse.data.success,
      statusCode: executeResponse.data.data.statusCode,
    });

    // Test 10: Get history
    console.log('\n📜 Test 10: Get Request History');
    const historyResponse = await axios.get(`${API_BASE_URL}/api/history`);
    log('Retrieved history', {
      count: historyResponse.data.data.length,
      pagination: historyResponse.data.pagination,
    });

    // Test 11: Filter history by protocol
    console.log('\n🔍 Test 11: Filter History by Protocol');
    const historyFilterResponse = await axios.get(
      `${API_BASE_URL}/api/history?protocol=rest`
    );
    log('Filtered history', {
      count: historyFilterResponse.data.data.length,
    });

    // Test 12: Filter history by success
    console.log('\n🔍 Test 12: Filter History by Success');
    const historySuccessResponse = await axios.get(
      `${API_BASE_URL}/api/history?success=true`
    );
    log('Filtered history (success only)', {
      count: historySuccessResponse.data.data.length,
      allSuccess: historySuccessResponse.data.data.every((h) => h.success),
    });

    // Test 13: Get history by ID
    if (historyResponse.data.data.length > 0) {
      console.log('\n🔍 Test 13: Get History Entry by ID');
      const historyId = historyResponse.data.data[0]._id;
      const historyByIdResponse = await axios.get(
        `${API_BASE_URL}/api/history/${historyId}`
      );
      log('Retrieved history entry', {
        id: historyByIdResponse.data.data._id,
        endpoint: historyByIdResponse.data.data.request.endpoint,
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('\n💡 You can now test the UI components:');
    console.log('   - SavedItems: http://localhost:3000/saved');
    console.log('   - History: http://localhost:3000/history');
  } catch (error) {
    logError('Test failed', error);
    process.exit(1);
  }
}

// Run tests
runTests();
