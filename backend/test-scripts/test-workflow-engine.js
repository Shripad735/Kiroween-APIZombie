import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Workflow } from '../src/models/index.js';
import WorkflowEngine from '../src/services/workflowEngine.service.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apizombie';

async function testWorkflowEngine() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Variable Resolution
    console.log('📝 Test 1: Variable Resolution');
    const engine = new WorkflowEngine();
    
    const testStep = {
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: 'https://api.example.com/users/{{userId}}',
        headers: {
          'Authorization': 'Bearer {{token}}'
        },
        body: {
          name: '{{userName}}'
        }
      },
      variableMappings: [
        {
          sourceStep: 1,
          sourcePath: '$.data.id',
          targetVariable: 'userId'
        },
        {
          sourceStep: 1,
          sourcePath: '$.auth.token',
          targetVariable: 'token'
        },
        {
          sourceStep: 1,
          sourcePath: '$.data.name',
          targetVariable: 'userName'
        }
      ]
    };

    const testContext = {
      step1: {
        data: {
          id: '12345',
          name: 'John Doe'
        },
        auth: {
          token: 'abc123xyz'
        }
      }
    };

    const resolved = engine.resolveVariables(testStep, testContext);
    console.log('Original endpoint:', testStep.apiRequest.endpoint);
    console.log('Resolved endpoint:', resolved.endpoint);
    console.log('Resolved headers:', resolved.headers);
    console.log('Resolved body:', resolved.body);
    
    if (resolved.endpoint === 'https://api.example.com/users/12345' &&
        resolved.headers.Authorization === 'Bearer abc123xyz' &&
        resolved.body.name === 'John Doe') {
      console.log('✅ Variable resolution works correctly\n');
    } else {
      console.log('❌ Variable resolution failed\n');
    }

    // Test 2: JSONPath Extraction
    console.log('📝 Test 2: JSONPath Data Extraction');
    const responseData = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ],
      meta: {
        total: 2,
        page: 1
      }
    };

    const extracted1 = engine.extractResponseData(responseData, '$.users[0].name');
    const extracted2 = engine.extractResponseData(responseData, '$.meta.total');
    const extracted3 = engine.extractResponseData(responseData, '$.users[*].id');

    console.log('Extract $.users[0].name:', extracted1);
    console.log('Extract $.meta.total:', extracted2);
    console.log('Extract $.users[*].id:', extracted3);

    if (extracted1 === 'Alice' && extracted2 === 2) {
      console.log('✅ JSONPath extraction works correctly\n');
    } else {
      console.log('❌ JSONPath extraction failed\n');
    }

    // Test 3: Assertions
    console.log('📝 Test 3: Assertion Evaluation');
    const testAssertions = [
      { type: 'statusCode', expected: 200 },
      { type: 'responseTime', expected: 1000 },
      { type: 'bodyContains', expected: 'success' },
      { type: 'headerExists', expected: 'content-type' },
      { type: 'jsonPath', path: '$.status', expected: 'ok' }
    ];

    const testResponse = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { status: 'ok', message: 'success' }
    };

    const assertionResults = engine.runAssertions(testAssertions, testResponse, 500);
    console.log('Assertion results:');
    assertionResults.forEach(result => {
      console.log(`  ${result.passed ? '✅' : '❌'} ${result.type}: ${result.message}`);
    });

    const allPassed = assertionResults.every(r => r.passed);
    if (allPassed) {
      console.log('✅ All assertions passed\n');
    } else {
      console.log('❌ Some assertions failed\n');
    }

    // Test 4: Create and Execute a Simple Workflow
    console.log('📝 Test 4: Workflow Execution (Mock)');
    
    // Create a test workflow
    const testWorkflow = new Workflow({
      name: 'Test Workflow',
      description: 'A simple test workflow',
      steps: [
        {
          order: 1,
          name: 'Get JSONPlaceholder Post',
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
      ],
      userId: 'test-user'
    });

    console.log('Created test workflow:', testWorkflow.name);
    console.log('Steps:', testWorkflow.steps.length);

    // Execute the workflow
    const workflowEngine = new WorkflowEngine();
    console.log('Executing workflow...');
    const result = await workflowEngine.executeWorkflow(testWorkflow, 'test-user');

    console.log('\nWorkflow Result:');
    console.log('  Success:', result.success);
    console.log('  Total Duration:', result.totalDuration, 'ms');
    console.log('  Steps Executed:', result.steps.length);
    
    if (result.steps.length > 0) {
      const step = result.steps[0];
      console.log('\n  Step 1 Result:');
      console.log('    Success:', step.success);
      console.log('    Status Code:', step.response.statusCode);
      console.log('    Duration:', step.duration, 'ms');
      console.log('    Assertions:', step.assertions.length);
      
      if (step.assertions.length > 0) {
        step.assertions.forEach(assertion => {
          console.log(`      ${assertion.passed ? '✅' : '❌'} ${assertion.message}`);
        });
      }
    }

    if (result.success) {
      console.log('\n✅ Workflow execution completed successfully\n');
    } else {
      console.log('\n❌ Workflow execution failed:', result.error, '\n');
    }

    // Test 5: Multi-step Workflow with Variable Passing
    console.log('📝 Test 5: Multi-step Workflow with Data Flow');
    
    const multiStepWorkflow = new Workflow({
      name: 'Multi-step Test Workflow',
      description: 'Test workflow with data passing between steps',
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

    const multiStepEngine = new WorkflowEngine();
    console.log('Executing multi-step workflow...');
    const multiStepResult = await multiStepEngine.executeWorkflow(multiStepWorkflow, 'test-user');

    console.log('\nMulti-step Workflow Result:');
    console.log('  Success:', multiStepResult.success);
    console.log('  Total Duration:', multiStepResult.totalDuration, 'ms');
    console.log('  Steps Executed:', multiStepResult.steps.length);

    multiStepResult.steps.forEach((step, index) => {
      console.log(`\n  Step ${index + 1}: ${step.stepName}`);
      console.log('    Success:', step.success);
      console.log('    Status Code:', step.response.statusCode);
      console.log('    Endpoint:', step.request.endpoint);
    });

    if (multiStepResult.success && multiStepResult.steps.length === 2) {
      console.log('\n✅ Multi-step workflow with data flow completed successfully\n');
    } else {
      console.log('\n❌ Multi-step workflow failed\n');
    }

    // Test 6: Workflow Failure Isolation
    console.log('📝 Test 6: Workflow Failure Isolation');
    
    const failureWorkflow = new Workflow({
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
            endpoint: 'https://jsonplaceholder.typicode.com/invalid-endpoint-404',
            headers: {}
          },
          variableMappings: [],
          assertions: [
            { type: 'statusCode', expected: 200 } // This will fail
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
      ],
      userId: 'test-user'
    });

    const failureEngine = new WorkflowEngine();
    console.log('Executing failure test workflow...');
    const failureResult = await failureEngine.executeWorkflow(failureWorkflow, 'test-user');

    console.log('\nFailure Test Workflow Result:');
    console.log('  Success:', failureResult.success);
    console.log('  Steps Executed:', failureResult.steps.length);
    console.log('  Error:', failureResult.error);

    if (!failureResult.success && failureResult.steps.length === 2) {
      console.log('✅ Workflow correctly halted after step 2 failure\n');
    } else {
      console.log('❌ Workflow failure isolation did not work as expected\n');
    }

    console.log('✅ All workflow engine tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run tests
testWorkflowEngine();
