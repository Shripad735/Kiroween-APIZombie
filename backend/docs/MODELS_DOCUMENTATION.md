# Database Models Documentation

## Overview

This document describes all Mongoose models used in the APIZombie backend. All models are implemented with proper validation, indexes, and follow the design specifications.

## Models

### 1. APISpec Model

**Purpose**: Stores API specifications (OpenAPI/Swagger, GraphQL, gRPC)

**Schema Fields**:
- `name` (String, required): Name of the API
- `type` (String, required): Type of API - 'openapi', 'graphql', or 'grpc'
- `baseUrl` (String, required): Base URL for the API
- `specification` (Mixed, required): Raw specification data
- `endpoints` (Array): Parsed endpoint information
- `authentication` (Object): Authentication configuration
- `userId` (String): Owner of the specification
- `createdAt`, `updatedAt` (Date): Timestamps

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - For user's spec listing
- `{ name: 1, userId: 1 }` - For searching by name
- `{ type: 1 }` - For filtering by API type

**Requirements**: 2.1, 2.2, 2.3

---

### 2. APIRequest Model

**Purpose**: Stores saved API requests for reuse

**Schema Fields**:
- `name` (String): Request name
- `description` (String): Request description
- `protocol` (String, required): 'rest', 'graphql', or 'grpc'
- `method` (String): HTTP method for REST
- `endpoint` (String, required): API endpoint
- `headers` (Map): Request headers
- `body` (Mixed): Request body
- `query` (String): GraphQL query
- `variables` (Mixed): GraphQL variables
- `service`, `rpcMethod` (String): gRPC specific fields
- `metadata` (Mixed): gRPC metadata
- `apiSpecId` (ObjectId): Reference to APISpec
- `tags` (Array): Tags for organization
- `userId` (String): Owner of the request
- `createdAt`, `updatedAt` (Date): Timestamps

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - For user's request listing
- `{ apiSpecId: 1 }` - For filtering by API spec
- `{ tags: 1 }` - For tag-based search
- `{ protocol: 1 }` - For protocol filtering

**Requirements**: 6.1

---

### 3. Workflow Model

**Purpose**: Stores multi-step API workflows with data passing between steps

**Schema Fields**:
- `name` (String, required): Workflow name
- `description` (String): Workflow description
- `steps` (Array): Array of WorkflowStep objects
  - `order` (Number): Step execution order
  - `name` (String): Step name
  - `apiRequest` (Mixed): Embedded API request
  - `variableMappings` (Array): Data extraction from previous steps
    - `sourceStep` (Number): Which step to extract from
    - `sourcePath` (String): JSONPath to extract data
    - `targetVariable` (String): Variable name for current step
  - `assertions` (Array): Response validations
  - `continueOnFailure` (Boolean): Whether to continue on error
- `tags` (Array): Tags for organization
- `userId` (String): Owner of the workflow
- `isTemplate` (Boolean): Whether this is a reusable template
- `createdAt`, `updatedAt` (Date): Timestamps

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - For user's workflow listing
- `{ name: 1, userId: 1 }` - For searching by name
- `{ tags: 1 }` - For tag-based search
- `{ isTemplate: 1 }` - For filtering templates

**Requirements**: 3.1, 3.2

---

### 4. TestSuite Model

**Purpose**: Stores generated test suites for API endpoints

**Schema Fields**:
- `name` (String, required): Test suite name
- `description` (String): Test suite description
- `apiSpecId` (ObjectId, required): Reference to APISpec
- `endpoint` (String, required): Endpoint being tested
- `tests` (Array): Array of TestCase objects
  - `name` (String): Test case name
  - `description` (String): Test description
  - `request` (Mixed): API request configuration
  - `expectedResponse` (Object): Expected response details
    - `statusCode` (Number): Expected status code
    - `schema` (Mixed): JSON Schema for validation
    - `assertions` (Array): Response assertions
  - `category` (String): 'success', 'error', 'edge', 'security', or 'performance'
  - `priority` (String): 'low', 'medium', 'high', or 'critical'
- `generatedBy` (String): 'ai', 'manual', or 'template'
- `userId` (String): Owner of the test suite
- `lastRunAt` (Date): Last execution timestamp
- `lastRunResults` (Object): Last execution results
- `createdAt`, `updatedAt` (Date): Timestamps

**Indexes**:
- `{ userId: 1, createdAt: -1 }` - For user's test suite listing
- `{ apiSpecId: 1 }` - For filtering by API spec
- `{ endpoint: 1 }` - For endpoint-specific tests

**Requirements**: 5.1

---

### 5. RequestHistory Model

**Purpose**: Stores execution history of all API requests with automatic cleanup

**Schema Fields**:
- `userId` (String, required): User who executed the request
- `request` (Object): Request details
  - `protocol` (String): 'rest', 'graphql', or 'grpc'
  - `method` (String): HTTP method
  - `endpoint` (String): API endpoint
  - `headers` (Map): Request headers
  - `body` (Mixed): Request body
  - `query` (String): GraphQL query
  - `variables` (Mixed): GraphQL variables
- `response` (Object): Response details
  - `statusCode` (Number): HTTP status code
  - `headers` (Map): Response headers
  - `body` (Mixed): Response body
  - `error` (String): Error message if failed
- `duration` (Number, required): Request duration in milliseconds
- `success` (Boolean, required): Whether request succeeded
- `apiSpecId` (ObjectId): Reference to APISpec
- `workflowId` (ObjectId): Reference to Workflow if part of workflow
- `source` (String): 'natural-language', 'manual', 'workflow', or 'test-suite'
- `timestamp` (Date, required): Execution timestamp

**Indexes**:
- `{ userId: 1, timestamp: -1 }` - For user's history listing
- `{ apiSpecId: 1, timestamp: -1 }` - For API-specific history
- `{ 'request.protocol': 1 }` - For protocol filtering
- `{ 'response.statusCode': 1 }` - For status code filtering
- `{ success: 1 }` - For success/failure filtering
- `{ timestamp: -1 }` - For chronological sorting
- `{ timestamp: 1 }, { expireAfterSeconds: 7776000 }` - TTL index (90 days)

**Special Features**:
- Automatic deletion of records older than 90 days via TTL index
- No automatic timestamps (uses custom timestamp field)

**Requirements**: 7.1

---

### 6. AuthConfig Model

**Purpose**: Stores encrypted authentication configurations for APIs

**Schema Fields**:
- `apiSpecId` (ObjectId, required): Reference to APISpec
- `authType` (String, required): 'apikey', 'bearer', 'basic', or 'oauth2'
- `apiKey` (Object): API Key configuration
  - `key` (String): Header/query parameter name
  - `value` (String): Encrypted API key value
  - `location` (String): 'header' or 'query'
- `bearerToken` (Object): Bearer token configuration
  - `token` (String): Encrypted bearer token
- `basic` (Object): Basic auth configuration
  - `username` (String): Username
  - `password` (String): Encrypted password
- `oauth2` (Object): OAuth 2.0 configuration
  - `accessToken` (String): Encrypted access token
  - `refreshToken` (String): Encrypted refresh token
  - `tokenType` (String): Token type (default: 'Bearer')
  - `expiresAt` (Date): Token expiration
  - `clientId` (String): OAuth client ID
  - `clientSecret` (String): Encrypted client secret
  - `authUrl` (String): Authorization URL
  - `tokenUrl` (String): Token URL
  - `scope` (String): OAuth scope
- `userId` (String, required): Owner of the configuration
- `createdAt`, `updatedAt` (Date): Timestamps

**Indexes**:
- `{ apiSpecId: 1, userId: 1 }` - Unique constraint per API per user
- `{ userId: 1 }` - For user's auth configs

**Special Features**:
- **Encryption**: All sensitive fields are automatically encrypted before saving
- **Encryption Algorithm**: AES-256-CBC
- **Methods**:
  - `encryptValue(value)`: Encrypts a string value
  - `decryptValue(encryptedValue)`: Decrypts an encrypted value
- **Pre-save Hook**: Automatically encrypts sensitive fields on save

**Security Notes**:
- Encryption key should be set via `ENCRYPTION_KEY` environment variable
- Default key is for development only - MUST be changed in production
- Encrypted values are stored as `iv:encryptedData` format

**Requirements**: 9.1, 9.3

---

## Index Summary

All models include appropriate indexes for efficient querying:

1. **userId indexes**: All models have indexes on userId for user-specific queries
2. **timestamp indexes**: RequestHistory has comprehensive timestamp indexes
3. **apiSpecId indexes**: Models referencing APISpec have indexes for filtering
4. **Additional indexes**: Protocol, tags, status codes, etc. for filtering

## Usage Example

```javascript
import { APISpec, APIRequest, Workflow, TestSuite, RequestHistory, AuthConfig } from './src/models/index.js';

// Create an API specification
const apiSpec = new APISpec({
  name: 'My API',
  type: 'openapi',
  baseUrl: 'https://api.example.com',
  specification: { openapi: '3.0.0', paths: {} },
});
await apiSpec.save();

// Create an encrypted auth config
const authConfig = new AuthConfig({
  apiSpecId: apiSpec._id,
  authType: 'bearer',
  bearerToken: { token: 'my-secret-token' },
  userId: 'user123',
});
await authConfig.save(); // Token is automatically encrypted

// Create a workflow
const workflow = new Workflow({
  name: 'User Registration Flow',
  steps: [
    {
      order: 1,
      apiRequest: {
        protocol: 'rest',
        method: 'POST',
        endpoint: '/users',
        body: { name: 'John' },
      },
    },
    {
      order: 2,
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: '/users/{{userId}}',
      },
      variableMappings: [
        {
          sourceStep: 1,
          sourcePath: '$.id',
          targetVariable: 'userId',
        },
      ],
    },
  ],
});
await workflow.save();
```

## Validation

All models include comprehensive validation:
- Required fields are enforced
- Enums restrict values to valid options
- References use ObjectId type for proper relationships
- Custom validation can be added as needed

## Testing

Run `node test-models.js` to verify all models are working correctly. The test script validates:
- Model imports
- Schema validation
- Index creation
- Encryption/decryption functionality
