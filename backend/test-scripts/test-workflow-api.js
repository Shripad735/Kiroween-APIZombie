import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Workflow } from '../src/models/index.js';

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apizombie';

async function testWorkflowAPI() {
  let savedWorkflowId = null;

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Execute inline workflow (without saving)
    console.log('📝 Test 1: Execute Inline Workflow');
    
    const inlineWorkflow = {
      name: 'Inline Test Workflow',
      description: 'Test workflow without saving to database',
      steps: [
        {
          order: 1,
          name: 'Get Post',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
            headers: {}
          },
          variableMappings: [],
          assertions: [
            { type: 'statusCode', expected: 200 }
          ]
        }
      ]
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        workflow: inlineWorkflow,
        userId: 'test-user'
      });

      console.log('Response status:', response.status);
      console.log('Success:', response.data.success);
      console.log('Workflow name:', response.data.data.workflowName);
      console.log('Steps executed:', response.data.data.steps.length);
      console.log('Total duration:', response.data.data.totalDuration, 'ms');

      if (response.data.success && response.data.data.steps.length === 1) {
        console.log('✅ Inline workflow execution successful\n');
      } else {
        console.log('❌ Inline workflow execution failed\n');
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 2: Save workflow and execute by ID
    console.log('📝 Test 2: Execute Saved Workflow by ID');
    
    const savedWorkflow = new Workflow({
      name: 'Saved Test Workflow',
      description: 'Test workflow saved to database',
      steps: [
        {
          order: 1,
          name: 'Get User',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/users/1',
            headers: {}
          },
          variableMappings: [],
          assertions: [
            { type: 'statusCode', expected: 200 }
          ]
        },
        {
          order: 2,
          name: 'Get User Posts',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/posts?userId={{userId}}',
            headers: {}
          },
          variableMappings: [
            {
              sourceStep: 1,
              sourcePath: '$.id',
              targetVariable: 'userId'
            }
          ],
          assertions: [
            { type: 'statusCode', expected: 200 }
          ]
        }
      ],
      userId: 'test-user'
    });

    await savedWorkflow.save();
    savedWorkflowId = savedWorkflow._id.toString();
    console.log('Saved workflow ID:', savedWorkflowId);

    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        workflowId: savedWorkflowId,
        userId: 'test-user'
      });

      console.log('Response status:', response.status);
      console.log('Success:', response.data.success);
      console.log('Workflow name:', response.data.data.workflowName);
      console.log('Steps executed:', response.data.data.steps.length);
      console.log('Total duration:', response.data.data.totalDuration, 'ms');

      if (response.data.success && response.data.data.steps.length === 2) {
        console.log('\nStep details:');
        response.data.data.steps.forEach((step, index) => {
          console.log(`  Step ${index + 1}: ${step.stepName}`);
          console.log(`    Endpoint: ${step.request.endpoint}`);
          console.log(`    Status: ${step.response.statusCode}`);
          console.log(`    Success: ${step.success}`);
        });
        console.log('\n✅ Saved workflow execution successful\n');
      } else {
        console.log('❌ Saved workflow execution failed\n');
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 3: Execute workflow with failure isolation
    console.log('📝 Test 3: Workflow Failure Isolation');
    
    const failureWorkflow = {
      name: 'Failure Test Workflow',
      description: 'Test workflow that should halt on failure',
      steps: [
        {
          order: 1,
          name: 'Valid Request',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/posts/1',
            headers: {}
          },
          variableMappings: [],
          assertions: []
        },
        {
          order: 2,
          name: 'Invalid Request',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/invalid-404',
            headers: {}
          },
          variableMappings: [],
          assertions: [
            { type: 'statusCode', expected: 200 }
          ],
          continueOnFailure: false
        },
        {
          order: 3,
          name: 'Should Not Execute',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/posts/2',
            headers: {}
          },
          variableMappings: [],
          assertions: []
        }
      ]
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        workflow: failureWorkflow,
        userId: 'test-user'
      });

      console.log('Response status:', response.status);
      console.log('Success:', response.data.success);
      console.log('Steps executed:', response.data.data.steps.length);
      console.log('Error:', response.data.data.error);

      if (!response.data.success && response.data.data.steps.length === 2) {
        console.log('✅ Workflow correctly halted after failure\n');
      } else {
        console.log('❌ Workflow failure isolation did not work as expected\n');
      }
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      console.log('');
    }

    // Test 4: Error handling - missing workflow
    console.log('📝 Test 4: Error Handling - Missing Workflow');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        userId: 'test-user'
      });
      console.log('❌ Should have returned error for missing workflow\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('Response status:', error.response.status);
        console.log('Error code:', error.response.data.error.code);
        console.log('Error message:', error.response.data.error.message);
        console.log('✅ Correctly returned 400 error for missing workflow\n');
      } else {
        console.error('❌ Unexpected error:', error.message);
        console.log('');
      }
    }

    // Test 5: Error handling - workflow not found
    console.log('📝 Test 5: Error Handling - Workflow Not Found');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        workflowId: '507f1f77bcf86cd799439011', // Non-existent ID
        userId: 'test-user'
      });
      console.log('❌ Should have returned error for non-existent workflow\n');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('Response status:', error.response.status);
        console.log('Error code:', error.response.data.error.code);
        console.log('Error message:', error.response.data.error.message);
        console.log('✅ Correctly returned 404 error for non-existent workflow\n');
      } else {
        console.error('❌ Unexpected error:', error.message);
        console.log('');
      }
    }

    // Test 6: Error handling - empty workflow
    console.log('📝 Test 6: Error Handling - Empty Workflow');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/execute/workflow`, {
        workflow: {
          name: 'Empty Workflow',
          steps: []
        },
        userId: 'test-user'
      });
      console.log('❌ Should have returned error for empty workflow\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('Response status:', error.response.status);
        console.log('Error code:', error.response.data.error.code);
        console.log('Error message:', error.response.data.error.message);
        console.log('✅ Correctly returned 400 error for empty workflow\n');
      } else {
        console.error('❌ Unexpected error:', error.message);
        console.log('');
      }
    }

    console.log('✅ All workflow API tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Cleanup
    if (savedWorkflowId) {
      try {
        await Workflow.findByIdAndDelete(savedWorkflowId);
        console.log('\n🧹 Cleaned up test workflow');
      } catch (error) {
        console.error('Error cleaning up:', error.message);
      }
    }

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Check if server is running
console.log('🚀 Testing Workflow API Endpoint');
console.log('📍 API Base URL:', API_BASE_URL);
console.log('⚠️  Make sure the server is running on port 5000\n');

// Run tests
testWorkflowAPI();
