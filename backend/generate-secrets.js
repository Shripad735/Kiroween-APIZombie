#!/usr/bin/env node

/**
 * Generate Secure Secrets for Production Deployment
 * 
 * This script generates cryptographically secure random strings
 * for JWT_SECRET and ENCRYPTION_KEY environment variables.
 * 
 * Usage: node generate-secrets.js
 */

import crypto from 'crypto';

console.log('\n🔐 APIZombie Production Secrets Generator\n');
console.log('=' .repeat(60));

// Generate JWT_SECRET (64 characters / 32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 JWT_SECRET (for JWT token signing):');
console.log(jwtSecret);
console.log(`Length: ${jwtSecret.length} characters`);

// Generate ENCRYPTION_KEY (32 characters / 16 bytes for AES-256)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('\n🔑 ENCRYPTION_KEY (for credential encryption):');
console.log(encryptionKey);
console.log(`Length: ${encryptionKey.length} characters`);

console.log('\n' + '=' .repeat(60));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Save these secrets in a secure password manager');
console.log('   2. Never commit these to Git or share publicly');
console.log('   3. Use these in your Vercel environment variables');
console.log('   4. Generate new secrets for each environment (dev/staging/prod)');
console.log('   5. Rotate secrets periodically (every 90 days recommended)');

console.log('\n📋 Copy these to your Vercel environment variables:');
console.log('\n   JWT_SECRET=' + jwtSecret);
console.log('   ENCRYPTION_KEY=' + encryptionKey);

console.log('\n✅ Secrets generated successfully!\n');
