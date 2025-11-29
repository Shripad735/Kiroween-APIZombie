/**
 * Test script for Workflow Builder Integration
 * Tests the workflow execution and saving functionality
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Test workflow with multiple steps
const testWorkflow = {
  name: 'Test Workflow - User Creation and Retrieval',
  description: 'Creates a user and then retrieves it',
  steps: [
    {
      order: 0,
      name: 'Create User',
      apiRequest: {
        protocol: 'rest',
        method: 'POST',
        endpoint: 'https://jsonplaceholder.typicode.com/users',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      variableMappings: [],
      assertions: [],
    },
    {
      order: 1,
      name: 'Get User',
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
};

async function testWorkflowExecution() {
  console.log('\n=== Testing Workflow Execution ===\n');

  try {
    console.log('Executing workflow:', testWorkflow.name);
    
    const response = await axios.post(`${API_BASE_URL}/api/execute/workflow`, {
      workflow: testWorkflow,
      userId: 'test-user',
    });

    if (response.data.success) {
      console.log('✓ Workflow executed successfully');
      console.log('  Total duration:', response.data.data.totalDuration, 'ms');
      console.log('  Steps executed:', response.data.data.steps.length);
      
      response.data.data.steps.forEach((step, idx) => {
        console.log(`  Step ${idx + 1}: ${step.stepName}`);
        console.log(`    Status: ${step.success ? '✓ Success' : '✗ Failed'}`);
        console.log(`    Duration: ${step.duration}ms`);
        if (step.response?.statusCode) {
          console.log(`    Status Code: ${step.response.statusCode}`);
        }
      });

      return response.data.data;
    } else {
      console.error('✗ Workflow execution failed');
      return null;
    }
  } catch (error) {
    console.error('✗ Error executing workflow:', error.response?.data || error.message);
    return null;
  }
}

async function testWorkflowSaving() {
  console.log('\n=== Testing Workflow Saving ===\n');

  try {
    console.log('Saving workflow:', testWorkflow.name);
    
    const response = await axios.post(`${API_BASE_URL}/api/saved/workflows`, {
      ...testWorkflow,
      userId: 'test-user',
    });

    if (response.data.success) {
      console.log('✓ Workflow saved successfully');
      console.log('  Workflow ID:', response.data.data._id);
      return response.data.data;
    } else {
      console.error('✗ Workflow save failed');
      return null;
    }
  } catch (error) {
    console.error('✗ Error saving workflow:', error.response?.data || error.message);
    return null;
  }
}

async function testWorkflowRetrieval() {
  console.log('\n=== Testing Workflow Retrieval ===\n');

  try {
    console.log('Retrieving saved workflows...');
    
    const response = await axios.get(`${API_BASE_URL}/api/saved/workflows`, {
      params: {
        userId: 'test-user',
      },
    });

    if (response.data.success) {
      console.log('✓ Workflows retrieved successfully');
      console.log('  Total workflows:', response.data.data.length);
      
      response.data.data.forEach((workflow, idx) => {
        console.log(`  ${idx + 1}. ${workflow.name}`);
        console.log(`     Steps: ${workflow.steps.length}`);
        console.log(`     Created: ${new Date(workflow.createdAt).toLocaleString()}`);
      });

      return response.data.data;
    } else {
      console.error('✗ Workflow retrieval failed');
      return null;
    }
  } catch (error) {
    console.error('✗ Error retrieving workflows:', error.response?.data || error.message);
    return null;
  }
}

async function testWorkflowWithVariables() {
  console.log('\n=== Testing Workflow with Variable Mappings ===\n');

  const workflowWithVariables = {
    name: 'Test Workflow - With Variables',
    description: 'Tests variable mapping between steps',
    steps: [
      {
        order: 0,
        name: 'Get User List',
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
        order: 1,
        name: 'Get First User Posts',
        apiRequest: {
          protocol: 'rest',
          method: 'GET',
          endpoint: 'https://jsonplaceholder.typicode.com/posts?userId=1',
          headers: {},
        },
        variableMappings: [
          {
            sourceStep: 0,
            sourcePath: '$[0].id',
            targetVariable: 'userId',
          },
        ],
        assertions: [],
      },
    ],
  };

  try {
    console.log('Executing workflow with variables:', workflowWithVariables.name);
    
    const response = await axios.post(`${API_BASE_URL}/api/execute/workflow`, {
      workflow: workflowWithVariables,
      userId: 'test-user',
    });

    if (response.data.success) {
      console.log('✓ Workflow with variables executed successfully');
      console.log('  Total duration:', response.data.data.totalDuration, 'ms');
      
      response.data.data.steps.forEach((step, idx) => {
        console.log(`  Step ${idx + 1}: ${step.stepName}`);
        console.log(`    Status: ${step.success ? '✓ Success' : '✗ Failed'}`);
      });

      return response.data.data;
    } else {
      console.error('✗ Workflow with variables execution failed');
      return null;
    }
  } catch (error) {
    console.error('✗ Error executing workflow with variables:', error.response?.data || error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Workflow Builder Integration Tests                  ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Test 1: Execute workflow
  const executionResult = await testWorkflowExecution();

  // Test 2: Save workflow
  const savedWorkflow = await testWorkflowSaving();

  // Test 3: Retrieve workflows
  const workflows = await testWorkflowRetrieval();

  // Test 4: Execute workflow with variables
  const variableResult = await testWorkflowWithVariables();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Test Summary                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('Workflow Execution:', executionResult ? '✓ PASS' : '✗ FAIL');
  console.log('Workflow Saving:', savedWorkflow ? '✓ PASS' : '✗ FAIL');
  console.log('Workflow Retrieval:', workflows ? '✓ PASS' : '✗ FAIL');
  console.log('Variable Mapping:', variableResult ? '✓ PASS' : '✗ FAIL');

  const allPassed = executionResult && savedWorkflow && workflows && variableResult;
  console.log('\n' + (allPassed ? '✓ All tests passed!' : '✗ Some tests failed'));
}

// Run tests
runAllTests().catch(console.error);
