#!/usr/bin/env node

/**
 * Interactive Setup Guide for APIZombie Backend
 */

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🧟 APIZombie Backend Setup Guide                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

console.log('📋 Setup Checklist:\n');

// Check 1: Node.js version
console.log('1️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Need 18+)\n`);
}

// Check 2: Dependencies
console.log('2️⃣  Checking dependencies...');
try {
  require('express');
  require('mongoose');
  require('groq-sdk');
  console.log('   ✅ All dependencies installed\n');
} catch (error) {
  console.log('   ❌ Missing dependencies. Run: npm install\n');
}

// Check 3: Environment variables
console.log('3️⃣  Checking environment variables...');
require('dotenv').config();

const checks = [
  { name: 'MONGODB_URI', value: process.env.MONGODB_URI },
  { name: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY },
  { name: 'PORT', value: process.env.PORT },
];

let allEnvVarsSet = true;
for (const check of checks) {
  if (check.value) {
    if (check.name === 'GROQ_API_KEY') {
      console.log(`   ✅ ${check.name}: ${check.value.substring(0, 10)}...`);
    } else if (check.name === 'MONGODB_URI') {
      console.log(`   ✅ ${check.name}: mongodb+srv://...`);
    } else {
      console.log(`   ✅ ${check.name}: ${check.value}`);
    }
  } else {
    console.log(`   ❌ ${check.name}: NOT SET`);
    allEnvVarsSet = false;
  }
}
console.log('');

// Check 4: Groq API Key validity
console.log('4️⃣  Testing Groq API connection...');
console.log('   ⏳ Run: node test-groq-connection.js');
console.log('');

// Next steps
console.log('📝 Next Steps:\n');

if (!allEnvVarsSet) {
  console.log('   1. Update your .env file with missing variables');
  console.log('   2. Get a Groq API key from: https://console.groq.com/keys');
  console.log('');
}

console.log('   1. Test Groq API: node test-groq-connection.js');
console.log('   2. Start the server: npm start');
console.log('   3. Test NL API: node test-nl-api.js');
console.log('   4. Visit: http://localhost:5000/health');
console.log('');

console.log('📚 Documentation:\n');
console.log('   • Groq Setup: GROQ_API_SETUP.md');
console.log('   • NL Engine: NL_ENGINE_README.md');
console.log('   • Task Summary: TASK_4_SUMMARY.md');
console.log('');

console.log('🚀 Quick Start:\n');
console.log('   npm start              # Start the server');
console.log('   npm run dev            # Start with nodemon (auto-reload)');
console.log('   npm test               # Run tests');
console.log('');

console.log('❓ Need Help?\n');
console.log('   • Check the README.md file');
console.log('   • Review the spec: .kiro/specs/api-zombie/');
console.log('   • Groq Docs: https://console.groq.com/docs');
console.log('');

console.log('═══════════════════════════════════════════════════════════════\n');
