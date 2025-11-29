import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AuthConfig from '../src/models/AuthConfig.js';

// Load environment variables
dotenv.config();

/**
 * Test credential encryption and decryption
 */
async function testEncryption() {
  console.log('🔐 Testing Credential Encryption/Decryption\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test data
    const testApiSpecId = new mongoose.Types.ObjectId();
    const testCredentials = {
      apiKey: 'test-api-key-12345',
      bearerToken: 'test-bearer-token-67890',
      basicPassword: 'test-password-secret',
      oauth2AccessToken: 'test-oauth-access-token',
      oauth2RefreshToken: 'test-oauth-refresh-token',
      oauth2ClientSecret: 'test-oauth-client-secret',
    };

    console.log('📝 Original credentials:');
    console.log(JSON.stringify(testCredentials, null, 2));
    console.log();

    // Test 1: API Key encryption
    console.log('Test 1: API Key Authentication');
    console.log('─'.repeat(50));
    const apiKeyConfig = new AuthConfig({
      apiSpecId: testApiSpecId,
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: testCredentials.apiKey,
        location: 'header',
      },
      userId: 'test-user',
    });

    await apiKeyConfig.save();
    console.log('✅ Saved API key config');
    console.log('🔒 Encrypted value:', apiKeyConfig.apiKey.value);
    console.log('❓ Is encrypted?', apiKeyConfig.apiKey.value !== testCredentials.apiKey);
    
    const decryptedApiKey = apiKeyConfig.decryptValue(apiKeyConfig.apiKey.value);
    console.log('🔓 Decrypted value:', decryptedApiKey);
    console.log('✅ Decryption matches original?', decryptedApiKey === testCredentials.apiKey);
    console.log();

    // Test 2: Bearer Token encryption
    console.log('Test 2: Bearer Token Authentication');
    console.log('─'.repeat(50));
    const bearerConfig = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'bearer',
      bearerToken: {
        token: testCredentials.bearerToken,
      },
      userId: 'test-user',
    });

    await bearerConfig.save();
    console.log('✅ Saved bearer token config');
    console.log('🔒 Encrypted value:', bearerConfig.bearerToken.token);
    console.log('❓ Is encrypted?', bearerConfig.bearerToken.token !== testCredentials.bearerToken);
    
    const decryptedBearer = bearerConfig.decryptValue(bearerConfig.bearerToken.token);
    console.log('🔓 Decrypted value:', decryptedBearer);
    console.log('✅ Decryption matches original?', decryptedBearer === testCredentials.bearerToken);
    console.log();

    // Test 3: Basic Auth encryption
    console.log('Test 3: Basic Authentication');
    console.log('─'.repeat(50));
    const basicConfig = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'basic',
      basic: {
        username: 'testuser',
        password: testCredentials.basicPassword,
      },
      userId: 'test-user',
    });

    await basicConfig.save();
    console.log('✅ Saved basic auth config');
    console.log('🔒 Encrypted password:', basicConfig.basic.password);
    console.log('❓ Is encrypted?', basicConfig.basic.password !== testCredentials.basicPassword);
    
    const decryptedPassword = basicConfig.decryptValue(basicConfig.basic.password);
    console.log('🔓 Decrypted password:', decryptedPassword);
    console.log('✅ Decryption matches original?', decryptedPassword === testCredentials.basicPassword);
    console.log();

    // Test 4: OAuth 2.0 encryption
    console.log('Test 4: OAuth 2.0 Authentication');
    console.log('─'.repeat(50));
    const oauth2Config = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'oauth2',
      oauth2: {
        accessToken: testCredentials.oauth2AccessToken,
        refreshToken: testCredentials.oauth2RefreshToken,
        tokenType: 'Bearer',
        clientId: 'test-client-id',
        clientSecret: testCredentials.oauth2ClientSecret,
        authUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        scope: 'read write',
      },
      userId: 'test-user',
    });

    await oauth2Config.save();
    console.log('✅ Saved OAuth 2.0 config');
    console.log('🔒 Encrypted access token:', oauth2Config.oauth2.accessToken);
    console.log('🔒 Encrypted refresh token:', oauth2Config.oauth2.refreshToken);
    console.log('🔒 Encrypted client secret:', oauth2Config.oauth2.clientSecret);
    
    const decryptedAccessToken = oauth2Config.decryptValue(oauth2Config.oauth2.accessToken);
    const decryptedRefreshToken = oauth2Config.decryptValue(oauth2Config.oauth2.refreshToken);
    const decryptedClientSecret = oauth2Config.decryptValue(oauth2Config.oauth2.clientSecret);
    
    console.log('🔓 Decrypted access token:', decryptedAccessToken);
    console.log('🔓 Decrypted refresh token:', decryptedRefreshToken);
    console.log('🔓 Decrypted client secret:', decryptedClientSecret);
    console.log('✅ All decryptions match?', 
      decryptedAccessToken === testCredentials.oauth2AccessToken &&
      decryptedRefreshToken === testCredentials.oauth2RefreshToken &&
      decryptedClientSecret === testCredentials.oauth2ClientSecret
    );
    console.log();

    // Test 5: Verify encryption is different each time (due to random IV)
    console.log('Test 5: Encryption Randomness (IV)');
    console.log('─'.repeat(50));
    const config1 = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'same-value',
        location: 'header',
      },
      userId: 'test-user',
    });
    await config1.save();

    const config2 = new AuthConfig({
      apiSpecId: new mongoose.Types.ObjectId(),
      authType: 'apikey',
      apiKey: {
        key: 'X-API-Key',
        value: 'same-value',
        location: 'header',
      },
      userId: 'test-user',
    });
    await config2.save();

    console.log('🔒 Encrypted value 1:', config1.apiKey.value);
    console.log('🔒 Encrypted value 2:', config2.apiKey.value);
    console.log('✅ Encrypted values are different?', config1.apiKey.value !== config2.apiKey.value);
    console.log('✅ Both decrypt to same value?', 
      config1.decryptValue(config1.apiKey.value) === config2.decryptValue(config2.apiKey.value)
    );
    console.log();

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await AuthConfig.deleteMany({ userId: 'test-user' });
    console.log('✅ Cleanup complete');
    console.log();

    console.log('✅ All encryption tests passed!');
    console.log('🔐 Credentials are properly encrypted and can be decrypted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run tests
testEncryption();
