import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RequestHistory from '../src/models/RequestHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to create test data
async function createTestData() {
  console.log('📝 Creating test data...');
  
  const testData = [];
  const now = new Date();
  
  // Create data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Create 5-10 requests per day
    const requestsPerDay = Math.floor(Math.random() * 6) + 5;
    
    for (let j = 0; j < requestsPerDay; j++) {
      const protocols = ['rest', 'graphql', 'grpc'];
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const success = Math.random() > 0.2; // 80% success rate
      const duration = Math.floor(Math.random() * 1000) + 100; // 100-1100ms
      
      const endpoints = [
        '/api/users',
        '/api/products',
        '/api/orders',
        '/api/auth/login',
        '/api/posts',
      ];
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      testData.push({
        userId: 'test-user',
        request: {
          protocol,
          method: protocol === 'rest' ? 'GET' : undefined,
          endpoint,
          headers: {},
        },
        response: {
          statusCode: success ? 200 : 500,
          body: {},
        },
        duration,
        success,
        timestamp: date,
      });
    }
  }
  
  await RequestHistory.insertMany(testData);
  console.log(`✅ Created ${testData.length} test history entries`);
}

// Test analytics endpoint
async function testAnalytics() {
  console.log('\n🧪 Testing Analytics API...\n');
  
  try {
    // Test 1: Get analytics with daily grouping
    console.log('Test 1: Get analytics with daily grouping');
    const dailyResponse = await axios.get(`${API_BASE_URL}/analytics`, {
      params: {
        userId: 'test-user',
        groupBy: 'daily',
      },
    });
    
    console.log('✅ Daily analytics response:');
    console.log('  - Total Requests:', dailyResponse.data.data.summary.totalRequests);
    console.log('  - Success Rate:', dailyResponse.data.data.summary.successRate + '%');
    console.log('  - Avg Response Time:', dailyResponse.data.data.summary.averageResponseTime + 'ms');
    console.log('  - Time Series Data Points:', dailyResponse.data.data.timeSeriesData.length);
    console.log('  - Most Used Endpoints:', dailyResponse.data.data.mostUsedEndpoints.length);
    
    // Test 2: Get analytics with weekly grouping
    console.log('\nTest 2: Get analytics with weekly grouping');
    const weeklyResponse = await axios.get(`${API_BASE_URL}/analytics`, {
      params: {
        userId: 'test-user',
        groupBy: 'weekly',
      },
    });
    
    console.log('✅ Weekly analytics response:');
    console.log('  - Time Series Data Points:', weeklyResponse.data.data.timeSeriesData.length);
    
    // Test 3: Get analytics with monthly grouping
    console.log('\nTest 3: Get analytics with monthly grouping');
    const monthlyResponse = await axios.get(`${API_BASE_URL}/analytics`, {
      params: {
        userId: 'test-user',
        groupBy: 'monthly',
      },
    });
    
    console.log('✅ Monthly analytics response:');
    console.log('  - Time Series Data Points:', monthlyResponse.data.data.timeSeriesData.length);
    
    // Test 4: Get analytics with date range
    console.log('\nTest 4: Get analytics with date range');
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const rangeResponse = await axios.get(`${API_BASE_URL}/analytics`, {
      params: {
        userId: 'test-user',
        startDate: sevenDaysAgo.toISOString(),
        endDate: now.toISOString(),
        groupBy: 'daily',
      },
    });
    
    console.log('✅ Date range analytics response:');
    console.log('  - Total Requests:', rangeResponse.data.data.summary.totalRequests);
    console.log('  - Time Series Data Points:', rangeResponse.data.data.timeSeriesData.length);
    
    // Test 5: Display most used endpoints
    console.log('\nTest 5: Most Used Endpoints');
    const endpoints = dailyResponse.data.data.mostUsedEndpoints;
    console.log('✅ Top endpoints:');
    endpoints.slice(0, 5).forEach((ep, idx) => {
      console.log(`  ${idx + 1}. ${ep.endpoint} (${ep.protocol})`);
      console.log(`     - Count: ${ep.count}`);
      console.log(`     - Avg Duration: ${ep.avgDuration}ms`);
      console.log(`     - Success Rate: ${ep.successRate.toFixed(2)}%`);
    });
    
    // Test 6: Protocol breakdown
    console.log('\nTest 6: Protocol Breakdown');
    const protocols = dailyResponse.data.data.protocolBreakdown;
    console.log('✅ Protocol distribution:');
    protocols.forEach((p) => {
      console.log(`  - ${p.protocol}: ${p.count} requests (${p.percentage.toFixed(2)}%)`);
      console.log(`    Success Rate: ${p.successRate.toFixed(2)}%`);
    });
    
    // Test 7: Status code distribution
    console.log('\nTest 7: Status Code Distribution');
    const statusCodes = dailyResponse.data.data.statusCodeDistribution;
    console.log('✅ Status codes:');
    statusCodes.forEach((sc) => {
      console.log(`  - ${sc.statusCode}: ${sc.count} requests`);
    });
    
    console.log('\n✅ All analytics tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    throw error;
  }
}

// Cleanup test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  await RequestHistory.deleteMany({ userId: 'test-user' });
  console.log('✅ Test data cleaned up');
}

// Main execution
async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create test data
    await createTestData();
    
    // Run tests
    await testAnalytics();
    
    // Cleanup
    await cleanup();
    
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
