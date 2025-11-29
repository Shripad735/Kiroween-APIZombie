import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify Security Implementation
 * Checks that all security features are properly implemented
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

function checkFileContains(filePath, searchString) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return false;
  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes(searchString);
}

function verifySecurityImplementation() {
  log('\n🔐 Security Implementation Verification', 'blue');
  log('='.repeat(60));
  
  const checks = [];

  // 1. Input Sanitization Middleware
  log('\n1. Input Sanitization Middleware', 'blue');
  log('─'.repeat(60));
  
  const sanitizationExists = checkFileExists('src/middleware/sanitization.middleware.js');
  checks.push({
    name: 'Sanitization middleware file exists',
    passed: sanitizationExists,
  });
  log(`${sanitizationExists ? '✅' : '❌'} Sanitization middleware file`, sanitizationExists ? 'green' : 'red');
  
  const sanitizationInServer = checkFileContains('src/server.js', 'sanitizeInput');
  checks.push({
    name: 'Sanitization applied in server.js',
    passed: sanitizationInServer,
  });
  log(`${sanitizationInServer ? '✅' : '❌'} Applied in server.js`, sanitizationInServer ? 'green' : 'red');

  // 2. Rate Limiting
  log('\n2. Rate Limiting', 'blue');
  log('─'.repeat(60));
  
  const rateLimiterExists = checkFileExists('src/middleware/rateLimiter.middleware.js');
  checks.push({
    name: 'Rate limiter middleware file exists',
    passed: rateLimiterExists,
  });
  log(`${rateLimiterExists ? '✅' : '❌'} Rate limiter middleware file`, rateLimiterExists ? 'green' : 'red');
  
  const generalLimiterInServer = checkFileContains('src/server.js', 'generalLimiter');
  checks.push({
    name: 'General rate limiter applied',
    passed: generalLimiterInServer,
  });
  log(`${generalLimiterInServer ? '✅' : '❌'} General limiter in server.js`, generalLimiterInServer ? 'green' : 'red');
  
  const aiLimiterInRoutes = checkFileContains('src/routes/nl.routes.js', 'aiLimiter');
  checks.push({
    name: 'AI rate limiter applied to NL routes',
    passed: aiLimiterInRoutes,
  });
  log(`${aiLimiterInRoutes ? '✅' : '❌'} AI limiter in NL routes`, aiLimiterInRoutes ? 'green' : 'red');
  
  const uploadLimiterInRoutes = checkFileContains('src/routes/specs.routes.js', 'uploadLimiter');
  checks.push({
    name: 'Upload rate limiter applied to specs routes',
    passed: uploadLimiterInRoutes,
  });
  log(`${uploadLimiterInRoutes ? '✅' : '❌'} Upload limiter in specs routes`, uploadLimiterInRoutes ? 'green' : 'red');

  // 3. CORS Configuration
  log('\n3. CORS Configuration', 'blue');
  log('─'.repeat(60));
  
  const corsInServer = checkFileContains('src/server.js', 'cors');
  checks.push({
    name: 'CORS configured in server.js',
    passed: corsInServer,
  });
  log(`${corsInServer ? '✅' : '❌'} CORS configured`, corsInServer ? 'green' : 'red');
  
  const corsOriginCheck = checkFileContains('src/server.js', 'allowedOrigins');
  checks.push({
    name: 'CORS origin validation implemented',
    passed: corsOriginCheck,
  });
  log(`${corsOriginCheck ? '✅' : '❌'} Origin validation`, corsOriginCheck ? 'green' : 'red');

  // 4. Request Size Limits
  log('\n4. Request Size Limits', 'blue');
  log('─'.repeat(60));
  
  const sizeLimitJson = checkFileContains('src/server.js', "limit: '10mb'");
  checks.push({
    name: 'JSON body size limit configured',
    passed: sizeLimitJson,
  });
  log(`${sizeLimitJson ? '✅' : '❌'} JSON body size limit (10mb)`, sizeLimitJson ? 'green' : 'red');

  // 5. API Key Validation Middleware
  log('\n5. API Key Validation Middleware', 'blue');
  log('─'.repeat(60));
  
  const apiKeyMiddlewareExists = checkFileExists('src/middleware/apiKey.middleware.js');
  checks.push({
    name: 'API key middleware file exists',
    passed: apiKeyMiddlewareExists,
  });
  log(`${apiKeyMiddlewareExists ? '✅' : '❌'} API key middleware file`, apiKeyMiddlewareExists ? 'green' : 'red');
  
  const groqKeyValidation = checkFileContains('src/routes/nl.routes.js', 'validateGroqApiKey');
  checks.push({
    name: 'Groq API key validation in routes',
    passed: groqKeyValidation,
  });
  log(`${groqKeyValidation ? '✅' : '❌'} Groq key validation in NL routes`, groqKeyValidation ? 'green' : 'red');

  // 6. Helmet.js Security Headers
  log('\n6. Helmet.js Security Headers', 'blue');
  log('─'.repeat(60));
  
  const helmetInServer = checkFileContains('src/server.js', 'helmet');
  checks.push({
    name: 'Helmet configured in server.js',
    passed: helmetInServer,
  });
  log(`${helmetInServer ? '✅' : '❌'} Helmet configured`, helmetInServer ? 'green' : 'red');
  
  const cspConfigured = checkFileContains('src/server.js', 'contentSecurityPolicy');
  checks.push({
    name: 'Content Security Policy configured',
    passed: cspConfigured,
  });
  log(`${cspConfigured ? '✅' : '❌'} CSP configured`, cspConfigured ? 'green' : 'red');
  
  const hstsConfigured = checkFileContains('src/server.js', 'hsts');
  checks.push({
    name: 'HSTS configured',
    passed: hstsConfigured,
  });
  log(`${hstsConfigured ? '✅' : '❌'} HSTS configured`, hstsConfigured ? 'green' : 'red');

  // 7. Credential Encryption
  log('\n7. Credential Encryption', 'blue');
  log('─'.repeat(60));
  
  const encryptionInModel = checkFileContains('src/models/AuthConfig.js', 'encryptValue');
  checks.push({
    name: 'Encryption methods in AuthConfig model',
    passed: encryptionInModel,
  });
  log(`${encryptionInModel ? '✅' : '❌'} Encryption methods implemented`, encryptionInModel ? 'green' : 'red');
  
  const aes256 = checkFileContains('src/models/AuthConfig.js', 'aes-256-cbc');
  checks.push({
    name: 'AES-256-CBC encryption algorithm',
    passed: aes256,
  });
  log(`${aes256 ? '✅' : '❌'} AES-256-CBC algorithm`, aes256 ? 'green' : 'red');
  
  const preSaveHook = checkFileContains('src/models/AuthConfig.js', "pre('save'");
  checks.push({
    name: 'Pre-save hook for automatic encryption',
    passed: preSaveHook,
  });
  log(`${preSaveHook ? '✅' : '❌'} Pre-save encryption hook`, preSaveHook ? 'green' : 'red');

  // 8. Test Scripts
  log('\n8. Test Scripts', 'blue');
  log('─'.repeat(60));
  
  const encryptionTestExists = checkFileExists('test-scripts/test-encryption.js');
  checks.push({
    name: 'Encryption test script exists',
    passed: encryptionTestExists,
  });
  log(`${encryptionTestExists ? '✅' : '❌'} Encryption test script`, encryptionTestExists ? 'green' : 'red');
  
  const securityTestExists = checkFileExists('test-scripts/test-security-features.js');
  checks.push({
    name: 'Security features test script exists',
    passed: securityTestExists,
  });
  log(`${securityTestExists ? '✅' : '❌'} Security features test script`, securityTestExists ? 'green' : 'red');

  // 9. Documentation
  log('\n9. Documentation', 'blue');
  log('─'.repeat(60));
  
  const securityDocsExist = checkFileExists('docs/SECURITY.md');
  checks.push({
    name: 'Security documentation exists',
    passed: securityDocsExist,
  });
  log(`${securityDocsExist ? '✅' : '❌'} SECURITY.md documentation`, securityDocsExist ? 'green' : 'red');

  // 10. Middleware Index
  log('\n10. Middleware Organization', 'blue');
  log('─'.repeat(60));
  
  const middlewareIndexExists = checkFileExists('src/middleware/index.js');
  checks.push({
    name: 'Middleware index file exists',
    passed: middlewareIndexExists,
  });
  log(`${middlewareIndexExists ? '✅' : '❌'} Middleware index file`, middlewareIndexExists ? 'green' : 'red');

  // Summary
  log('\n📊 Summary', 'blue');
  log('='.repeat(60));
  
  const passed = checks.filter(c => c.passed).length;
  const total = checks.length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`\n${passed}/${total} checks passed (${percentage}%)`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All security features are properly implemented!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Run encryption test: node test-scripts/test-encryption.js');
    log('2. Start server: npm run dev');
    log('3. Run security tests: node test-scripts/test-security-features.js');
  } else {
    log('\n⚠️  Some security features are missing or not properly configured.', 'yellow');
    log('Review the failed checks above.');
  }
  
  log('\n📚 Documentation:', 'blue');
  log('See backend/docs/SECURITY.md for detailed security implementation guide');
  
  return passed === total;
}

// Run verification
const success = verifySecurityImplementation();
process.exit(success ? 0 : 1);
