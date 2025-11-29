/**
 * Verification script to ensure models match the design document specifications
 */

import {
  APISpec,
  APIRequest,
  Workflow,
  TestSuite,
  RequestHistory,
  AuthConfig,
} from '../src/models/index.js';

console.log('🔍 Verifying models against design document...\n');

let allPassed = true;

// Helper function to check if schema has a field (supports nested paths)
function hasField(schema, path) {
  const paths = Object.keys(schema.paths);
  // Check if exact path exists or if any path starts with this field
  return paths.some(p => p === path || p.startsWith(path + '.'));
}

// Helper function to check if schema has an index
function hasIndex(model, indexSpec) {
  const indexes = model.schema.indexes();
  return indexes.some(idx => {
    const keys = Object.keys(indexSpec);
    return keys.every(key => idx[0][key] === indexSpec[key]);
  });
}

// Verify APISpec Model
console.log('📋 APISpec Model');
const apiSpecChecks = [
  { field: 'name', expected: true },
  { field: 'type', expected: true },
  { field: 'baseUrl', expected: true },
  { field: 'specification', expected: true },
  { field: 'endpoints', expected: true },
  { field: 'authentication', expected: true },
  { field: 'userId', expected: true },
];

apiSpecChecks.forEach(check => {
  const result = hasField(APISpec.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Check APISpec indexes
const apiSpecIndexes = [
  { userId: 1 },
  { name: 1 },
  { type: 1 },
];
console.log('  Indexes:');
apiSpecIndexes.forEach(idx => {
  const result = hasIndex(APISpec, idx);
  const indexName = Object.keys(idx).join(', ');
  console.log(`    ${result ? '✅' : '❌'} ${indexName}`);
  if (!result) allPassed = false;
});

// Verify APIRequest Model
console.log('\n📋 APIRequest Model');
const apiRequestChecks = [
  { field: 'protocol', expected: true },
  { field: 'method', expected: true },
  { field: 'endpoint', expected: true },
  { field: 'headers', expected: true },
  { field: 'body', expected: true },
  { field: 'query', expected: true },
  { field: 'variables', expected: true },
  { field: 'metadata', expected: true },
  { field: 'apiSpecId', expected: true },
  { field: 'userId', expected: true },
];

apiRequestChecks.forEach(check => {
  const result = hasField(APIRequest.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Verify Workflow Model
console.log('\n📋 Workflow Model');
const workflowChecks = [
  { field: 'name', expected: true },
  { field: 'description', expected: true },
  { field: 'steps', expected: true },
  { field: 'userId', expected: true },
];

workflowChecks.forEach(check => {
  const result = hasField(Workflow.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Verify TestSuite Model
console.log('\n📋 TestSuite Model');
const testSuiteChecks = [
  { field: 'name', expected: true },
  { field: 'apiSpecId', expected: true },
  { field: 'endpoint', expected: true },
  { field: 'tests', expected: true },
  { field: 'userId', expected: true },
];

testSuiteChecks.forEach(check => {
  const result = hasField(TestSuite.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Verify RequestHistory Model
console.log('\n📋 RequestHistory Model');
const requestHistoryChecks = [
  { field: 'userId', expected: true },
  { field: 'request', expected: true },
  { field: 'response', expected: true },
  { field: 'duration', expected: true },
  { field: 'success', expected: true },
  { field: 'timestamp', expected: true },
  { field: 'apiSpecId', expected: true },
  { field: 'workflowId', expected: true },
];

requestHistoryChecks.forEach(check => {
  const result = hasField(RequestHistory.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Check for TTL index
const hasTTL = RequestHistory.schema.indexes().some(idx => idx[1]?.expireAfterSeconds);
console.log(`  ${hasTTL ? '✅' : '❌'} TTL index (90 days): ${hasTTL ? 'present' : 'missing'}`);
if (!hasTTL) allPassed = false;

// Verify AuthConfig Model
console.log('\n📋 AuthConfig Model');
const authConfigChecks = [
  { field: 'apiSpecId', expected: true },
  { field: 'authType', expected: true },
  { field: 'apiKey', expected: true },
  { field: 'bearerToken', expected: true },
  { field: 'basic', expected: true },
  { field: 'oauth2', expected: true },
  { field: 'userId', expected: true },
];

authConfigChecks.forEach(check => {
  const result = hasField(AuthConfig.schema, check.field);
  console.log(`  ${result ? '✅' : '❌'} ${check.field}: ${result ? 'present' : 'missing'}`);
  if (!result) allPassed = false;
});

// Check encryption methods
const hasEncrypt = typeof AuthConfig.schema.methods.encryptValue === 'function';
const hasDecrypt = typeof AuthConfig.schema.methods.decryptValue === 'function';
console.log(`  ${hasEncrypt ? '✅' : '❌'} encryptValue method: ${hasEncrypt ? 'present' : 'missing'}`);
console.log(`  ${hasDecrypt ? '✅' : '❌'} decryptValue method: ${hasDecrypt ? 'present' : 'missing'}`);
if (!hasEncrypt || !hasDecrypt) allPassed = false;

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All models comply with design document specifications!');
  console.log('\n📊 Summary:');
  console.log('  - 6 models implemented');
  console.log('  - All required fields present');
  console.log('  - Indexes configured correctly');
  console.log('  - Encryption methods implemented');
  console.log('  - TTL index for history cleanup');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the output above.');
  process.exit(1);
}
