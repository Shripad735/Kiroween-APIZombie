# Response Validation Engine

## Overview

The Response Validation Engine provides comprehensive validation capabilities for API responses using JSON Schema validation. It supports automatic validation when API specifications are available, as well as manual validation with custom schemas and constraints.

## Features

- **JSON Schema Validation**: Validate responses against JSON Schema definitions using AJV
- **Automatic Validation**: Automatically validate responses using API specifications (OpenAPI/Swagger)
- **Detailed Error Reporting**: Get specific field-level errors with helpful messages
- **Multiple Validation Types**:
  - Schema validation
  - Data type validation
  - Required field validation
  - Constraint validation (min/max, patterns, enums)
- **Format Validation**: Support for email, uri, date-time, and other formats
- **Integration with Execute Endpoint**: Automatic validation when executing API requests

## Service Methods

### `validateResponse(response, expectedSchema)`

Validates a response against a JSON Schema.

**Parameters:**
- `response` (Object): The API response to validate
- `expectedSchema` (Object): JSON Schema to validate against

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  errors: Array<{
    field: string,
    message: string,
    keyword: string,
    params: object,
    schemaPath: string
  }>
}
```

**Example:**
```javascript
import { validateResponse } from './services/responseValidator.service.js';

const response = {
  id: 123,
  name: 'John Doe',
  email: 'john@example.com'
};

const schema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  },
  required: ['id', 'name', 'email']
};

const result = validateResponse(response, schema);
// result.success === true
```

### `highlightMismatches(response, expectedSchema)`

Identifies specific field mismatches with detailed information.

**Parameters:**
- `response` (Object): The API response
- `expectedSchema` (Object): JSON Schema

**Returns:**
```javascript
Array<{
  field: string,
  actualValue: any,
  expectedType: string,
  issue: string,
  keyword: string,
  schemaPath: string,
  details: string
}>
```

**Example:**
```javascript
const mismatches = highlightMismatches(response, schema);
mismatches.forEach(m => {
  console.log(`Field ${m.field}: ${m.details}`);
});
```

### `validateWithApiSpec(response, apiSpec, endpoint, method, statusCode)`

Automatically validates response using an API specification.

**Parameters:**
- `response` (Object): The API response
- `apiSpec` (Object): API specification object from database
- `endpoint` (String): Endpoint path (e.g., '/users')
- `method` (String): HTTP method (e.g., 'GET')
- `statusCode` (Number): Response status code (default: 200)

**Returns:** Same as `validateResponse`

**Example:**
```javascript
const apiSpec = await APISpec.findById(apiSpecId);
const result = validateWithApiSpec(
  response.body,
  apiSpec,
  '/users',
  'GET',
  200
);
```

### `validateDataTypes(response, typeDefinitions)`

Validates data types of specific fields.

**Parameters:**
- `response` (Object): The API response
- `typeDefinitions` (Object): Field to type mapping

**Example:**
```javascript
const result = validateDataTypes(response, {
  id: 'number',
  name: 'string',
  tags: 'array',
  isActive: 'boolean'
});
```

### `validateRequiredFields(response, requiredFields)`

Validates that required fields are present.

**Parameters:**
- `response` (Object): The API response
- `requiredFields` (Array<String>): Array of required field names

**Example:**
```javascript
const result = validateRequiredFields(response, ['id', 'name', 'email']);
```

### `validateConstraints(response, constraints)`

Validates value constraints.

**Parameters:**
- `response` (Object): The API response
- `constraints` (Object): Field to constraint mapping

**Example:**
```javascript
const result = validateConstraints(response, {
  age: { minimum: 18, maximum: 100 },
  name: { pattern: '^[A-Za-z ]+$' },
  status: { enum: ['active', 'inactive', 'pending'] }
});
```

## API Endpoints

### POST /api/validate/response

Validate a response against a JSON schema.

**Request Body:**
```json
{
  "response": { ... },
  "schema": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Response matches expected schema",
    "errors": []
  }
}
```

### POST /api/validate/mismatches

Highlight specific field mismatches.

**Request Body:**
```json
{
  "response": { ... },
  "schema": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mismatches": [...],
    "count": 0,
    "hasErrors": false
  }
}
```

### POST /api/validate/auto

Automatically validate using API specification.

**Request Body:**
```json
{
  "response": { ... },
  "apiSpecId": "507f1f77bcf86cd799439011",
  "endpoint": "/users",
  "method": "GET",
  "statusCode": 200
}
```

### POST /api/validate/types

Validate data types.

**Request Body:**
```json
{
  "response": { ... },
  "typeDefinitions": {
    "id": "number",
    "name": "string"
  }
}
```

### POST /api/validate/required

Validate required fields.

**Request Body:**
```json
{
  "response": { ... },
  "requiredFields": ["id", "name", "email"]
}
```

### POST /api/validate/constraints

Validate value constraints.

**Request Body:**
```json
{
  "response": { ... },
  "constraints": {
    "age": { "minimum": 18, "maximum": 100 },
    "status": { "enum": ["active", "inactive"] }
  }
}
```

## Automatic Validation with Execute Endpoint

When executing API requests through `/api/execute`, you can enable automatic validation:

```javascript
const response = await axios.post('/api/execute', {
  request: {
    protocol: 'rest',
    method: 'GET',
    endpoint: '/users',
    headers: {}
  },
  apiSpecId: '507f1f77bcf86cd799439011',
  validateResponse: true  // Enable automatic validation
});

// Response includes validation result
console.log(response.data.data.validation);
```

To disable automatic validation (enabled by default when apiSpecId is provided):

```javascript
{
  ...
  validateResponse: false
}
```

## Supported JSON Schema Features

- **Types**: string, number, integer, boolean, array, object, null
- **Formats**: email, uri, date-time, date, time, ipv4, ipv6, hostname, uuid
- **Validation Keywords**:
  - `required`: Required properties
  - `minimum`, `maximum`: Numeric bounds
  - `minLength`, `maxLength`: String length bounds
  - `pattern`: Regular expression patterns
  - `enum`: Enumerated values
  - `type`: Data type validation
  - `properties`: Object property schemas
  - `items`: Array item schemas
  - `additionalProperties`: Allow/disallow extra properties

## Error Messages

The validator provides detailed, user-friendly error messages:

- **Type errors**: "Expected type 'number' but got 'string'"
- **Required fields**: "Missing required field: 'email'"
- **Format errors**: "Value must be a valid email"
- **Constraint errors**: "Value must be >= 18"
- **Pattern errors**: "Value must match pattern: ^[A-Za-z]+$"

## Testing

Run validation tests:

```bash
# Basic validation tests
node test-scripts/test-validation.js

# Integration tests with execute endpoint
node test-scripts/test-validation-integration.js
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 10.1**: Schema validation against expected schemas ✅
- **Requirement 10.2**: Highlighting specific field mismatches ✅
- **Requirement 10.3**: Automatic validation when API spec is available ✅
- **Requirement 10.4**: Support for data types, required fields, and constraints ✅

## Dependencies

- **ajv**: JSON Schema validator (v8.12.0)
- **ajv-formats**: Format validators for ajv

## Future Enhancements

- GraphQL schema validation support
- gRPC proto validation support
- Custom validation rules
- Validation rule templates
- Performance optimization for large responses
