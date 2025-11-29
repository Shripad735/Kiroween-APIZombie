import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

/**
 * Verification script for Task 9: Saved Items and History Management
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.4, 7.5
 */

async function verifyRequirement6_1() {
  console.log('\n📋 Requirement 6.1: Save API request with name and tags');
  try {
    const response = await axios.post(`${BASE_URL}/saved/requests`, {
      name: 'Test API Request',
      description: 'A test request for verification',
      protocol: 'rest',
      method: 'GET',
      endpoint: 'https://api.example.com/test',
      tags: ['test', 'verification'],
      userId: 'verify-user',
    });

    if (response.data.success && response.data.data.name && response.data.data.tags) {
      console.log('✅ PASS: Can save API request with name and tags');
      return response.data.data._id;
    } else {
      console.log('❌ FAIL: Cannot save API request properly');
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return null;
  }
}

async function verifyRequirement6_2() {
  console.log('\n📋 Requirement 6.2: Save workflow as reusable template');
  try {
    const response = await axios.post(`${BASE_URL}/saved/workflows`, {
      name: 'Test Workflow',
      description: 'A test workflow',
      isTemplate: true,
      steps: [
        {
          order: 1,
          name: 'Step 1',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://api.example.com/step1',
            headers: {},
          },
          variableMappings: [],
          assertions: [],
        },
      ],
      userId: 'verify-user',
    });

    if (response.data.success && response.data.data.isTemplate === true) {
      console.log('✅ PASS: Can save workflow as reusable template');
      return response.data.data._id;
    } else {
      console.log('❌ FAIL: Cannot save workflow as template');
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return null;
  }
}

async function verifyRequirement6_3() {
  console.log('\n📋 Requirement 6.3: View saved items with search and filter');
  try {
    // Test search
    const searchResponse = await axios.get(`${BASE_URL}/saved/requests?search=test&userId=verify-user`);
    
    // Test filter by protocol
    const protocolResponse = await axios.get(`${BASE_URL}/saved/requests?protocol=rest&userId=verify-user`);
    
    // Test filter by tags
    const tagResponse = await axios.get(`${BASE_URL}/saved/requests?tags=test&userId=verify-user`);

    if (
      searchResponse.data.success &&
      protocolResponse.data.success &&
      tagResponse.data.success &&
      searchResponse.data.data.length > 0
    ) {
      console.log('✅ PASS: Can view saved items with search and filter');
      console.log(`   - Search found: ${searchResponse.data.data.length} items`);
      console.log(`   - Protocol filter found: ${protocolResponse.data.data.length} items`);
      console.log(`   - Tag filter found: ${tagResponse.data.data.length} items`);
      return true;
    } else {
      console.log('❌ FAIL: Search and filter not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyRequirement6_4() {
  console.log('\n📋 Requirement 6.4: Export saved items to JSON');
  try {
    const response = await axios.post(`${BASE_URL}/saved/export`, {
      type: 'all',
      userId: 'verify-user',
    });

    if (
      response.data.success &&
      response.data.data.data.requests &&
      response.data.data.data.workflows &&
      response.data.data.exportDate
    ) {
      console.log('✅ PASS: Can export saved items to JSON');
      console.log(`   - Exported ${response.data.data.data.requests.length} requests`);
      console.log(`   - Exported ${response.data.data.data.workflows.length} workflows`);
      return response.data.data;
    } else {
      console.log('❌ FAIL: Export format is incorrect');
      return null;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return null;
  }
}

async function verifyRequirement6_5(exportData) {
  console.log('\n📋 Requirement 6.5: Import saved items from JSON');
  try {
    const response = await axios.post(`${BASE_URL}/saved/import`, {
      data: exportData,
      userId: 'import-verify-user',
    });

    // Verify imported items
    const verifyResponse = await axios.get(`${BASE_URL}/saved/requests?userId=import-verify-user`);

    if (
      response.data.success &&
      response.data.data.requests.imported > 0 &&
      verifyResponse.data.data.length > 0
    ) {
      console.log('✅ PASS: Can import saved items from JSON');
      console.log(`   - Imported ${response.data.data.requests.imported} requests`);
      console.log(`   - Imported ${response.data.data.workflows.imported} workflows`);
      return true;
    } else {
      console.log('❌ FAIL: Import not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyRequirement7_1() {
  console.log('\n📋 Requirement 7.1: Log API requests with timestamp and result');
  try {
    // Execute a request to create history
    await axios.post(`${BASE_URL}/execute`, {
      request: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://jsonplaceholder.typicode.com/users/1',
        headers: {},
      },
      userId: 'verify-user',
      saveToHistory: true,
    });

    // Wait for history to be saved
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check history
    const historyResponse = await axios.get(`${BASE_URL}/history?userId=verify-user`);

    if (
      historyResponse.data.success &&
      historyResponse.data.data.length > 0 &&
      historyResponse.data.data[0].timestamp &&
      historyResponse.data.data[0].success !== undefined
    ) {
      console.log('✅ PASS: API requests are logged with timestamp and result');
      console.log(`   - Found ${historyResponse.data.data.length} history entries`);
      return true;
    } else {
      console.log('❌ FAIL: History logging not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyRequirement7_2() {
  console.log('\n📋 Requirement 7.2: View history with ability to re-execute');
  try {
    const historyResponse = await axios.get(`${BASE_URL}/history?userId=verify-user`);

    if (historyResponse.data.success && historyResponse.data.data.length > 0) {
      const historyEntry = historyResponse.data.data[0];
      
      // Re-execute the request
      const reExecuteResponse = await axios.post(`${BASE_URL}/execute`, {
        request: historyEntry.request,
        userId: 'verify-user',
        saveToHistory: true,
      });

      if (reExecuteResponse.data.success) {
        console.log('✅ PASS: Can view history and re-execute requests');
        return true;
      } else {
        console.log('❌ FAIL: Cannot re-execute requests from history');
        return false;
      }
    } else {
      console.log('❌ FAIL: Cannot view history');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyRequirement7_4() {
  console.log('\n📋 Requirement 7.4: Filter history by date, API, status, protocol');
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Test date filter
    const dateResponse = await axios.get(
      `${BASE_URL}/history?startDate=${yesterday}&endDate=${tomorrow}&userId=verify-user`
    );

    // Test protocol filter
    const protocolResponse = await axios.get(`${BASE_URL}/history?protocol=rest&userId=verify-user`);

    // Test success filter
    const successResponse = await axios.get(`${BASE_URL}/history?success=true&userId=verify-user`);

    if (
      dateResponse.data.success &&
      protocolResponse.data.success &&
      successResponse.data.success
    ) {
      console.log('✅ PASS: Can filter history by date, protocol, and status');
      console.log(`   - Date filter found: ${dateResponse.data.data.length} entries`);
      console.log(`   - Protocol filter found: ${protocolResponse.data.data.length} entries`);
      console.log(`   - Success filter found: ${successResponse.data.data.length} entries`);
      return true;
    } else {
      console.log('❌ FAIL: History filtering not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyRequirement7_5() {
  console.log('\n📋 Requirement 7.5: Clear history while preserving saved requests');
  try {
    // Get count of saved requests before clearing
    const savedBefore = await axios.get(`${BASE_URL}/saved/requests?userId=verify-user`);
    const savedCount = savedBefore.data.data.length;

    // Clear history
    const clearResponse = await axios.delete(`${BASE_URL}/history?userId=verify-user`);

    // Verify history is cleared
    const historyAfter = await axios.get(`${BASE_URL}/history?userId=verify-user`);

    // Verify saved requests are preserved
    const savedAfter = await axios.get(`${BASE_URL}/saved/requests?userId=verify-user`);

    if (
      clearResponse.data.success &&
      historyAfter.data.data.length === 0 &&
      savedAfter.data.data.length === savedCount
    ) {
      console.log('✅ PASS: Can clear history while preserving saved requests');
      console.log(`   - Deleted ${clearResponse.data.data.deletedCount} history entries`);
      console.log(`   - Preserved ${savedAfter.data.data.length} saved requests`);
      return true;
    } else {
      console.log('❌ FAIL: Clear history not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function verifyPagination() {
  console.log('\n📋 Additional: Verify pagination on all endpoints');
  try {
    // Test pagination on saved requests
    const requestsPage1 = await axios.get(`${BASE_URL}/saved/requests?page=1&limit=1&userId=verify-user`);
    
    // Test pagination on workflows
    const workflowsPage1 = await axios.get(`${BASE_URL}/saved/workflows?page=1&limit=1&userId=verify-user`);

    if (
      requestsPage1.data.pagination &&
      workflowsPage1.data.pagination &&
      requestsPage1.data.pagination.page === 1 &&
      requestsPage1.data.pagination.limit === 1
    ) {
      console.log('✅ PASS: Pagination working on all endpoints');
      return true;
    } else {
      console.log('❌ FAIL: Pagination not working properly');
      return false;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    return false;
  }
}

async function runVerification() {
  console.log('🔍 Task 9 Requirements Verification');
  console.log('=' .repeat(70));

  const results = {
    passed: 0,
    failed: 0,
  };

  // Requirement 6.1
  const req6_1 = await verifyRequirement6_1();
  results[req6_1 ? 'passed' : 'failed']++;

  // Requirement 6.2
  const req6_2 = await verifyRequirement6_2();
  results[req6_2 ? 'passed' : 'failed']++;

  // Requirement 6.3
  const req6_3 = await verifyRequirement6_3();
  results[req6_3 ? 'passed' : 'failed']++;

  // Requirement 6.4
  const exportData = await verifyRequirement6_4();
  results[exportData ? 'passed' : 'failed']++;

  // Requirement 6.5
  if (exportData) {
    const req6_5 = await verifyRequirement6_5(exportData);
    results[req6_5 ? 'passed' : 'failed']++;
  } else {
    console.log('\n📋 Requirement 6.5: Skipped (export failed)');
    results.failed++;
  }

  // Requirement 7.1
  const req7_1 = await verifyRequirement7_1();
  results[req7_1 ? 'passed' : 'failed']++;

  // Requirement 7.2
  const req7_2 = await verifyRequirement7_2();
  results[req7_2 ? 'passed' : 'failed']++;

  // Requirement 7.4
  const req7_4 = await verifyRequirement7_4();
  results[req7_4 ? 'passed' : 'failed']++;

  // Requirement 7.5
  const req7_5 = await verifyRequirement7_5();
  results[req7_5 ? 'passed' : 'failed']++;

  // Additional: Pagination
  const pagination = await verifyPagination();
  results[pagination ? 'passed' : 'failed']++;

  console.log('\n' + '=' .repeat(70));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.failed === 0) {
    console.log('\n✅ All requirements verified successfully! 🎉\n');
  } else {
    console.log('\n❌ Some requirements failed verification\n');
    process.exit(1);
  }
}

runVerification();
