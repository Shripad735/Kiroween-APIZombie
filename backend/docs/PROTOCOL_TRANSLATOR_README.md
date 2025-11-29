# Protocol Translation Engine

## Overview

The Protocol Translation Engine is an AI-powered service that converts API requests between different protocols (REST, GraphQL, and gRPC). It uses Groq's LLM to intelligently translate request structures while maintaining semantic equivalence.

## Features

- **REST ↔ GraphQL Translation**: Bidirectional translation between REST and GraphQL
- **AI-Powered**: Uses Groq LLM for intelligent translation with explanations
- **Caching**: 24-hour cache for translation results to improve performance
- **Validation**: Comprehensive validation to detect untranslatable requests
- **Explanations**: Provides detailed explanations of how translations were performed

## Supported Translations

| Source Protocol | Target Protocol | Status |
|----------------|-----------------|---------|
| REST           | GraphQL         | ✅ Supported |
| GraphQL        | REST            | ✅ Supported |
| REST           | gRPC            | ❌ Not yet supported |
| GraphQL        | gRPC            | ❌ Not yet supported |
| gRPC           | REST            | ❌ Not yet supported |
| gRPC           | GraphQL         | ❌ Not yet supported |

## API Endpoint

### POST /api/translate

Translate an API request from one protocol to another.

**Request Body:**
```json
{
  "sourceRequest": {
    // REST example
    "method": "GET",
    "endpoint": "/users/123",
    "headers": {
      "Content-Type": "application/json"
    }
    // OR GraphQL example
    "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
    "variables": { "id": "123" },
    "operationType": "query"
  },
  "sourceProtocol": "rest",  // or "graphql", "grpc"
  "targetProtocol": "graphql" // or "rest", "grpc"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "original": { /* source request */ },
    "translated": { /* translated request */ },
    "sourceProtocol": "rest",
    "targetProtocol": "graphql",
    "explanation": "Detailed explanation of the translation..."
  },
  "message": "Successfully translated from REST to GRAPHQL"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "TRANSLATION_NOT_SUPPORTED",
    "message": "Translation not possible: Source and target protocols cannot be the same",
    "suggestions": [
      "Check that both protocols are supported (rest, graphql)",
      "Ensure source and target protocols are different",
      "Note: gRPC translation is not yet fully supported"
    ]
  }
}
```

## Translation Examples

### REST to GraphQL

**Input (REST):**
```json
{
  "method": "GET",
  "endpoint": "/users/123",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

**Output (GraphQL):**
```json
{
  "protocol": "graphql",
  "query": "query GetUser($id: ID!) {\n  user(id: $id) {\n    id\n    name\n    email\n  }\n}",
  "variables": {
    "id": "123"
  },
  "operationType": "query",
  "operationName": "GetUser"
}
```

### GraphQL to REST

**Input (GraphQL):**
```json
{
  "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
  "variables": {
    "id": "123"
  },
  "operationType": "query"
}
```

**Output (REST):**
```json
{
  "protocol": "rest",
  "method": "GET",
  "endpoint": "/users/123",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### REST POST to GraphQL Mutation

**Input (REST):**
```json
{
  "method": "POST",
  "endpoint": "/users",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Output (GraphQL):**
```json
{
  "protocol": "graphql",
  "query": "mutation CreateUser($name: String!, $email: String!) { createUser(name: $name, email: $email) { id name email } }",
  "variables": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "operationType": "mutation",
  "operationName": "CreateUser"
}
```

## Service Methods

### `translateProtocol(sourceRequest, sourceProtocol, targetProtocol)`

Main translation function that routes to the appropriate translator.

**Parameters:**
- `sourceRequest` (Object): The API request to translate
- `sourceProtocol` (String): Source protocol ('rest', 'graphql', 'grpc')
- `targetProtocol` (String): Target protocol ('rest', 'graphql', 'grpc')

**Returns:** Promise<Object> with `original`, `translated`, `sourceProtocol`, `targetProtocol`, and `explanation`

### `translateRESTtoGraphQL(restRequest)`

Translates a REST API request to GraphQL query/mutation.

**Parameters:**
- `restRequest` (Object): REST request with `method`, `endpoint`, `headers`, `body`

**Returns:** Promise<Object> GraphQL request with `query`, `variables`, `operationType`

### `translateGraphQLtoREST(graphqlRequest)`

Translates a GraphQL query/mutation to REST API request.

**Parameters:**
- `graphqlRequest` (Object): GraphQL request with `query`, `variables`, `operationType`

**Returns:** Promise<Object> REST request with `method`, `endpoint`, `headers`, `body`

### `explainTranslation(sourceRequest, translatedRequest, sourceProtocol, targetProtocol)`

Generates a detailed explanation of how the translation was performed.

**Parameters:**
- `sourceRequest` (Object): Original request
- `translatedRequest` (Object): Translated request
- `sourceProtocol` (String): Source protocol
- `targetProtocol` (String): Target protocol

**Returns:** Promise<String> Explanation text

## Caching

The service implements a 24-hour cache for translation results to improve performance and reduce LLM API calls.

**Cache Key Format:** `{sourceProtocol}_{targetProtocol}_{JSON.stringify(sourceRequest)}`

**Cache Management:**
- Automatic cleanup every hour
- Manual cache clearing: `clearCache()`
- Cache statistics: `getCacheStats()`

## Error Handling

The service handles various error scenarios:

1. **Validation Errors**: Invalid protocols, same source/target, missing fields
2. **Unsupported Translations**: gRPC translations (not yet implemented)
3. **LLM Errors**: Groq API failures, rate limits, empty responses
4. **Parsing Errors**: Invalid JSON from LLM, missing required fields

All errors are logged and returned with appropriate HTTP status codes and user-friendly messages.

## Testing

Run the test suite:
```bash
node test-scripts/test-translate-api.js
```

The test suite covers:
- REST to GraphQL translation
- GraphQL to REST translation
- REST POST to GraphQL mutation
- Validation error handling
- Unsupported protocol handling (gRPC)

## Future Enhancements

- [ ] gRPC protocol support
- [ ] Batch translation of multiple requests
- [ ] Custom translation rules/templates
- [ ] Translation quality scoring
- [ ] Support for more complex GraphQL features (fragments, directives)
- [ ] WebSocket/Subscription protocol support

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 4.1**: REST to GraphQL translation ✅
- **Requirement 4.2**: GraphQL to REST translation ✅
- **Requirement 4.3**: Side-by-side display of original and translated versions ✅
- **Requirement 4.4**: Detection and explanation of untranslatable requests ✅
- **Requirement 4.5**: gRPC translation support (partial - returns "not supported" message) ⚠️
