# Workflow Engine Documentation

## Overview

The Workflow Engine is a core component of APIZombie that enables users to create and execute multi-step API workflows with data passing between steps. It supports sequential execution of API calls across different protocols (REST, GraphQL, gRPC) with variable resolution, assertions, and comprehensive error handling.

## Features

- **Multi-Protocol Support**: Execute workflows containing REST, GraphQL, and gRPC API calls
- **Variable Resolution**: Extract data from previous steps and use it in subsequent requests
- **JSONPath Support**: Use JSONPath expressions to extract specific data from responses
- **Assertions**: Validate responses with multiple assertion types
- **Error Handling**: Halt execution on failures or continue based on configuration
- **History Logging**: Automatically log all workflow steps to request history
- **State Tracking**: Track execution state including current step and results

## Architecture

### WorkflowEngine Service

Located at: `backend/src/services/workflowEngine.service.js`

The WorkflowEngine class provides the following key methods:

#### `executeWorkflow(workflow, userId)`
Executes a complete workflow with all its steps.

**Parameters:**
- `workflow` (Object): Workflow object with steps
- `userId` (string): User ID for authentication and history

**Returns:** Promise<Object> - Workflow execution result

#### `resolveVariables(step, context)`
Resolves variables in a workflow step using data from previous steps.

**Parameters:**
- `step` (Object): Workflow step with variableMappings
- `context` (Object): Execution context with previous step results

**Returns:** Object - Resolved API request

#### `extractResponseData(responseData, path)`
Extracts data from a response using JSONPath.

**Parameters:**
- `responseData` (Object): Response data object
- `path` (string): JSONPath expression

**Returns:** any - Extracted value

#### `runAssertions(assertions, response, duration)`
Runs assertions on a step response.

**Parameters:**
- `assertions` (Array): Array of assertion objects
- `response` (Object): API response
- `duration` (number): Request duration in ms

**Returns:** Array - Assertion results

## Data Models

### Workflow Model

```javascript
{
  name: String,              // Workflow name
  description: String,       // Workflow description
  steps: [WorkflowStep],     // Array of workflow steps
  tags: [String],            // Tags for organization
  userId: String,            // Owner user ID
  isTemplate: Boolean        // Whether this is a template
}
```

### WorkflowStep Model

```javascript
{
  order: Number,                    // Step execution order
  name: String,                     // Step name
  apiRequest: Object,               // API request configuration
  variableMappings: [VariableMapping], // Variable mappings from previous steps
  assertions: [Assertion],          // Response assertions
  continueOnFailure: Boolean        // Whether to continue if step fails
}
```

### VariableMapping Model

```javascript
{
  sourceStep: Number,        // Source step order number
  sourcePath: String,        // JSONPath to extract data
  targetVariable: String     // Variable name to use in current step
}
```

### Assertion Model

```javascript
{
  type: String,              // Assertion type (statusCode, responseTime, etc.)
  expected: Mixed,           // Expected value
  path: String               // JSONPath for jsonPath assertion type
}
```

## API Endpoint

### POST /api/execute/workflow

Execute a multi-step workflow.

**Request Body:**
```json
{
  "workflowId": "string (optional)",
  "workflow": {
    "name": "string",
    "description": "string",
    "steps": [
      {
        "order": 1,
        "name": "string",
        "apiRequest": {
          "protocol": "rest|graphql|grpc",
          "method": "GET|POST|PUT|DELETE",
          "endpoint": "string",
          "headers": {},
          "body": {}
        },
        "variableMappings": [
          {
            "sourceStep": 1,
            "sourcePath": "$.data.id",
            "targetVariable": "userId"
          }
        ],
        "assertions": [
          {
            "type": "statusCode",
            "expected": 200
          }
        ],
        "continueOnFailure": false
      }
    ]
  },
  "userId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "string",
    "workflowName": "string",
    "success": true,
    "steps": [
      {
        "stepOrder": 1,
        "stepName": "string",
        "request": {},
        "response": {
          "statusCode": 200,
          "headers": {},
          "body": {},
          "error": null
        },
        "duration": 123,
        "success": true,
        "assertions": []
      }
    ],
    "totalDuration": 456,
    "error": null
  }
}
```

## Usage Examples

### Example 1: Simple Two-Step Workflow

```javascript
const workflow = {
  name: "Get User and Posts",
  description: "Fetch a user and their posts",
  steps: [
    {
      order: 1,
      name: "Get User",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/users/1",
        headers: {}
      },
      variableMappings: [],
      assertions: [
        { type: "statusCode", expected: 200 }
      ]
    },
    {
      order: 2,
      name: "Get User Posts",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/posts?userId={{userId}}",
        headers: {}
      },
      variableMappings: [
        {
          sourceStep: 1,
          sourcePath: "$.id",
          targetVariable: "userId"
        }
      ],
      assertions: [
        { type: "statusCode", expected: 200 }
      ]
    }
  ]
};
```

### Example 2: Workflow with Complex Variable Mapping

```javascript
const workflow = {
  name: "Create and Update Resource",
  description: "Create a resource and update it with additional data",
  steps: [
    {
      order: 1,
      name: "Create Resource",
      apiRequest: {
        protocol: "rest",
        method: "POST",
        endpoint: "https://api.example.com/resources",
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          name: "New Resource",
          type: "example"
        }
      },
      variableMappings: [],
      assertions: [
        { type: "statusCode", expected: 201 }
      ]
    },
    {
      order: 2,
      name: "Update Resource",
      apiRequest: {
        protocol: "rest",
        method: "PUT",
        endpoint: "https://api.example.com/resources/{{resourceId}}",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer {{token}}"
        },
        body: {
          name: "Updated Resource",
          status: "active"
        }
      },
      variableMappings: [
        {
          sourceStep: 1,
          sourcePath: "$.data.id",
          targetVariable: "resourceId"
        },
        {
          sourceStep: 1,
          sourcePath: "$.auth.token",
          targetVariable: "token"
        }
      ],
      assertions: [
        { type: "statusCode", expected: 200 },
        { type: "jsonPath", path: "$.status", expected: "active" }
      ]
    }
  ]
};
```

### Example 3: Workflow with Error Handling

```javascript
const workflow = {
  name: "Resilient Workflow",
  description: "Workflow that continues on non-critical failures",
  steps: [
    {
      order: 1,
      name: "Critical Step",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/critical",
        headers: {}
      },
      variableMappings: [],
      assertions: [
        { type: "statusCode", expected: 200 }
      ],
      continueOnFailure: false  // Halt if this fails
    },
    {
      order: 2,
      name: "Optional Step",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/optional",
        headers: {}
      },
      variableMappings: [],
      assertions: [],
      continueOnFailure: true  // Continue even if this fails
    },
    {
      order: 3,
      name: "Final Step",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/final",
        headers: {}
      },
      variableMappings: [],
      assertions: []
    }
  ]
};
```

## Assertion Types

### 1. statusCode
Validates the HTTP status code.

```javascript
{ type: "statusCode", expected: 200 }
```

### 2. responseTime
Validates that response time is within a threshold.

```javascript
{ type: "responseTime", expected: 1000 }  // Max 1000ms
```

### 3. bodyContains
Validates that response body contains a specific string.

```javascript
{ type: "bodyContains", expected: "success" }
```

### 4. headerExists
Validates that a specific header exists in the response.

```javascript
{ type: "headerExists", expected: "content-type" }
```

### 5. jsonPath
Validates that a JSONPath expression returns an expected value.

```javascript
{ 
  type: "jsonPath", 
  path: "$.data.status", 
  expected: "active" 
}
```

## JSONPath Expressions

The workflow engine uses the `jsonpath-plus` library for data extraction. Common patterns:

- `$.data.id` - Extract the `id` field from `data` object
- `$.users[0].name` - Extract the `name` of the first user
- `$.users[*].id` - Extract all user IDs as an array
- `$.meta.total` - Extract nested field
- `$..id` - Recursively find all `id` fields

## Variable Substitution

Variables are substituted using the `{{variableName}}` syntax. The engine:

1. Extracts data from previous steps using JSONPath
2. Stores extracted values in the execution context
3. Replaces `{{variableName}}` patterns in the request
4. Supports variables in: endpoint, headers, body, query, variables

## Request History

All workflow steps are automatically logged to the RequestHistory collection with:

- `source: 'workflow'` - Identifies the request as part of a workflow
- `workflowId` - Links the request to the workflow
- Full request and response details
- Execution duration and success status

## Error Handling

### Execution Errors

If a step fails:
1. The error is logged
2. The step result includes the error details
3. If `continueOnFailure` is false, execution halts
4. If `continueOnFailure` is true, execution continues

### Assertion Failures

If assertions fail:
1. The step is marked as unsuccessful
2. Assertion results show which assertions failed
3. If `continueOnFailure` is false, execution halts
4. If `continueOnFailure` is true, execution continues

### Network Errors

Network errors are caught and handled gracefully:
- Timeout errors
- Connection refused
- DNS resolution failures
- Invalid responses

## Testing

### Unit Tests

Run workflow engine unit tests:
```bash
node test-scripts/test-workflow-engine.js
```

### API Tests

Run workflow API endpoint tests:
```bash
node test-scripts/test-workflow-api.js
```

### History Tests

Run workflow history logging tests:
```bash
node test-scripts/test-workflow-history.js
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 3.1**: ✅ Workflows allow adding multiple API calls in sequence
- **Requirement 3.2**: ✅ Response data from previous steps can be used in subsequent requests
- **Requirement 3.3**: ✅ Mixed protocol workflows are supported (REST + GraphQL + gRPC)
- **Requirement 3.4**: ✅ Workflow execution displays results of each step with timing
- **Requirement 3.5**: ✅ Workflow halts on step failure (unless continueOnFailure is true)

## Future Enhancements

Potential improvements for future versions:

1. **Parallel Execution**: Execute independent steps in parallel
2. **Conditional Steps**: Execute steps based on conditions
3. **Loops**: Repeat steps based on conditions or arrays
4. **Retry Logic**: Automatically retry failed steps
5. **Workflow Templates**: Pre-built workflow templates for common scenarios
6. **Visual Workflow Builder**: Drag-and-drop workflow creation in the UI
7. **Workflow Scheduling**: Schedule workflows to run at specific times
8. **Webhook Triggers**: Trigger workflows from external events

## Troubleshooting

### Common Issues

**Issue**: Variables not being substituted
- **Solution**: Ensure JSONPath expression is correct and data exists in previous step

**Issue**: Workflow halts unexpectedly
- **Solution**: Check `continueOnFailure` setting and assertion configurations

**Issue**: History not being saved
- **Solution**: Verify MongoDB connection and RequestHistory model is properly configured

**Issue**: Timeout errors
- **Solution**: Increase timeout settings or check target API availability

## Support

For issues or questions:
1. Check the test scripts for usage examples
2. Review the workflow engine source code
3. Check MongoDB logs for database issues
4. Review server logs for execution errors
