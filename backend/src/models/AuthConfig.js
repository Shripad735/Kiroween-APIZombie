import mongoose from 'mongoose';
import crypto from 'crypto';

const authConfigSchema = new mongoose.Schema({
  apiSpecId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APISpec',
    required: true,
  },
  authType: {
    type: String,
    required: true,
    enum: ['apikey', 'bearer', 'basic', 'oauth2'],
  },
  // API Key authentication
  apiKey: {
    key: { type: String },
    value: { type: String }, // Encrypted
    location: {
      type: String,
      enum: ['header', 'query'],
      default: 'header',
    },
  },
  // Bearer token authentication
  bearerToken: {
    token: { type: String }, // Encrypted
  },
  // Basic authentication
  basic: {
    username: { type: String },
    password: { type: String }, // Encrypted
  },
  // OAuth 2.0 authentication
  oauth2: {
    accessToken: { type: String }, // Encrypted
    refreshToken: { type: String }, // Encrypted
    tokenType: { type: String, default: 'Bearer' },
    expiresAt: { type: Date },
    clientId: { type: String },
    clientSecret: { type: String }, // Encrypted
    authUrl: { type: String },
    tokenUrl: { type: String },
    scope: { type: String },
  },
  userId: {
    type: String,
    required: true,
    default: 'default-user',
  },
}, {
  timestamps: true,
});

// Indexes
authConfigSchema.index({ apiSpecId: 1, userId: 1 }, { unique: true });
authConfigSchema.index({ userId: 1 });

// Encryption helper methods
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production!!'; // Must be 32 characters
const IV_LENGTH = 16;

// Ensure encryption key is 32 bytes
const getEncryptionKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  return key;
};

authConfigSchema.methods.encryptValue = function(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

authConfigSchema.methods.decryptValue = function(encryptedValue) {
  if (!encryptedValue) return null;
  const parts = encryptedValue.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Pre-save hook to encrypt sensitive fields
authConfigSchema.pre('save', function(next) {
  if (this.isModified('apiKey.value') && this.apiKey?.value) {
    this.apiKey.value = this.encryptValue(this.apiKey.value);
  }
  if (this.isModified('bearerToken.token') && this.bearerToken?.token) {
    this.bearerToken.token = this.encryptValue(this.bearerToken.token);
  }
  if (this.isModified('basic.password') && this.basic?.password) {
    this.basic.password = this.encryptValue(this.basic.password);
  }
  if (this.isModified('oauth2.accessToken') && this.oauth2?.accessToken) {
    this.oauth2.accessToken = this.encryptValue(this.oauth2.accessToken);
  }
  if (this.isModified('oauth2.refreshToken') && this.oauth2?.refreshToken) {
    this.oauth2.refreshToken = this.encryptValue(this.oauth2.refreshToken);
  }
  if (this.isModified('oauth2.clientSecret') && this.oauth2?.clientSecret) {
    this.oauth2.clientSecret = this.encryptValue(this.oauth2.clientSecret);
  }
  next();
});

const AuthConfig = mongoose.model('AuthConfig', authConfigSchema);

export default AuthConfig;
