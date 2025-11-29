import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Workflow, RequestHistory } from '../src/models/index.js';
import WorkflowEngine from '../src/services/workflowEngine.service.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/apizombie';

async function testWorkflowHistory() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing test history
    await RequestHistory.deleteMany({ userId: 'test-history-user' });
    console.log('🧹 Cleared existing test history\n');

    // Create a test workflow
    const testWorkflow = new Workflow({
      name: 'History Test Workflow',
      description: 'Test workflow to verify history logging',
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
          assertions: []
        },
        {
          order: 2,
          name: 'Get Comments',
          apiRequest: {
            protocol: 'rest',
            method: 'GET',
            endpoint: 'https://jsonplaceholder.typicode.com/posts/1/comments',
            headers: {}
          },
          variableMappings: [],
          assertions: []
        }
      ],
      userId: 'test-history-user'
    });

    await testWorkflow.save();
    console.log('📝 Created test workflow:', testWorkflow.name);
    console.log('Workflow ID:', testWorkflow._id.toString());
    console.log('Steps:', testWorkflow.steps.length, '\n');

    // Execute the workflow
    const engine = new WorkflowEngine();
    console.log('🚀 Executing workflow...');
    const result = await engine.executeWorkflow(testWorkflow, 'test-history-user');

    console.log('Workflow execution completed');
    console.log('Success:', result.success);
    console.log('Steps executed:', result.steps.length, '\n');

    // Wait a moment for history to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Query request history
    console.log('📊 Checking Request History...');
    const historyEntries = await RequestHistory.find({
      userId: 'test-history-user',
      workflowId: testWorkflow._id
    }).sort({ timestamp: 1 });

    console.log('History entries found:', historyEntries.length);

    if (historyEntries.length === 2) {
      console.log('✅ Correct number of history entries created\n');

      historyEntries.forEach((entry, index) => {
        console.log(`History Entry ${index + 1}:`);
        console.log('  ID:', entry._id.toString());
        console.log('  Protocol:', entry.request.protocol);
        console.log('  Method:', entry.request.method);
        console.log('  Endpoint:', entry.request.endpoint);
        console.log('  Status Code:', entry.response.statusCode);
        console.log('  Duration:', entry.duration, 'ms');
        console.log('  Success:', entry.success);
        console.log('  Source:', entry.source);
        console.log('  Workflow ID:', entry.workflowId?.toString());
        console.log('  Timestamp:', entry.timestamp.toISOString());
        console.log('');
      });

      // Verify all entries have correct properties
      const allValid = historyEntries.every(entry => 
        entry.userId === 'test-history-user' &&
        entry.workflowId?.toString() === testWorkflow._id.toString() &&
        entry.source === 'workflow' &&
        entry.request.protocol === 'rest' &&
        entry.response.statusCode === 200 &&
        entry.success === true &&
        entry.duration > 0
      );

      if (allValid) {
        console.log('✅ All history entries have correct properties');
      } else {
        console.log('❌ Some history entries have incorrect properties');
      }

      // Test filtering by workflowId
      console.log('\n📊 Testing History Filtering by Workflow ID...');
      const workflowHistory = await RequestHistory.find({
        workflowId: testWorkflow._id
      });
      console.log('Entries with workflow ID:', workflowHistory.length);
      
      if (workflowHistory.length === 2) {
        console.log('✅ Workflow ID filtering works correctly');
      } else {
        console.log('❌ Workflow ID filtering failed');
      }

      // Test filtering by source
      console.log('\n📊 Testing History Filtering by Source...');
      const workflowSourceHistory = await RequestHistory.find({
        source: 'workflow'
      });
      console.log('Entries with source "workflow":', workflowSourceHistory.length);
      
      if (workflowSourceHistory.length >= 2) {
        console.log('✅ Source filtering works correctly');
      } else {
        console.log('❌ Source filtering failed');
      }

    } else {
      console.log('❌ Expected 2 history entries, found', historyEntries.length);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Workflow.findByIdAndDelete(testWorkflow._id);
    await RequestHistory.deleteMany({ userId: 'test-history-user' });
    console.log('✅ Cleanup completed');

    console.log('\n✅ All workflow history tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run tests
testWorkflowHistory();
