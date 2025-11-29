# Workflow Builder Component Guide

## Overview

The Workflow Builder component allows users to create, execute, and save multi-step API workflows that can chain together requests across different protocols (REST, GraphQL, gRPC).

## Features Implemented

### ✅ Core Features

1. **Workflow Creation**
   - Create new workflows with name and description
   - Add multiple API call steps in sequence
   - Support for REST, GraphQL, and gRPC protocols

2. **Step Management**
   - Add new steps with "Add Step" button
   - Remove steps with delete button
   - Reorder steps with drag-and-drop (up/down arrows)
   - Expand/collapse step details
   - Edit step configurations

3. **Protocol Support**
   - **REST**: Full support for GET, POST, PUT, PATCH, DELETE methods
   - **GraphQL**: Query/mutation support with variables
   - **gRPC**: Service method calls with request data

4. **Variable Mapping**
   - Extract data from previous step responses using JSONPath
   - Map extracted values to variables
   - Use variables in subsequent steps with `{{variableName}}` syntax
   - Visual UI for managing variable mappings

5. **Workflow Execution**
   - Execute complete workflows with "Execute Workflow" button
   - Real-time execution progress
   - Display results for each step with timing information
   - Show success/failure status for each step
   - Display response data with syntax highlighting
   - Error handling with detailed error messages

6. **Workflow Persistence**
   - Save workflows to database with "Save Workflow" button
   - Load saved workflows from sidebar
   - View saved workflows list with metadata
   - Clear current workflow to start fresh

7. **Execution Results Display**
   - Overall workflow success/failure status
   - Total execution duration
   - Per-step results with:
     - Success/failure indicators
     - HTTP status codes
     - Response timing
     - Response body (expandable)
     - Assertion results (if configured)

## Component Structure

### Main Component: `WorkflowBuilder`

**State Management:**
- `workflowName`: Name of the workflow
- `workflowDescription`: Description of the workflow
- `steps`: Array of workflow steps
- `savedWorkflows`: List of saved workflows
- `executing`: Execution state flag
- `executionResult`: Results from workflow execution
- `expandedStep`: Currently expanded step ID
- `editingStep`: Currently editing step ID

**Key Functions:**
- `addStep()`: Add a new step to the workflow
- `removeStep(stepId)`: Remove a step from the workflow
- `updateStep(stepId, updates)`: Update step configuration
- `moveStep(stepId, direction)`: Reorder steps
- `addVariableMapping(stepId)`: Add variable mapping to a step
- `executeWorkflow()`: Execute the complete workflow
- `saveWorkflow()`: Save workflow to database
- `loadWorkflow(workflow)`: Load a saved workflow

### Sub-Component: `StepCard`

Displays and manages individual workflow steps with:
- Step header with order number and protocol badges
- Expand/collapse functionality
- Protocol-specific configuration fields
- Variable mapping UI
- Move up/down controls
- Delete button

## Usage Examples

### Example 1: Simple REST Workflow

```javascript
{
  name: "User CRUD Workflow",
  description: "Create and retrieve a user",
  steps: [
    {
      order: 0,
      name: "Create User",
      apiRequest: {
        protocol: "rest",
        method: "POST",
        endpoint: "https://api.example.com/users",
        headers: { "Content-Type": "application/json" },
        body: { name: "John Doe", email: "john@example.com" }
      }
    },
    {
      order: 1,
      name: "Get User",
      apiRequest: {
        protocol: "rest",
        method: "GET",
        endpoint: "https://api.example.com/users/{{userId}}",
        headers: {}
      },
      variableMappings: [
        {
          sourceStep: 0,
          sourcePath: "$.id",
          targetVariable: "userId"
        }
      ]
    }
  ]
}
```

### Example 2: Mixed Protocol Workflow

```javascript
{
  name: "GraphQL to REST Workflow",
  description: "Query GraphQL then use REST",
  steps: [
    {
      order: 0,
      name: "GraphQL Query",
      apiRequest: {
        protocol: "graphql",
        endpoint: "https://api.example.com/graphql",
        query: "query { user(id: 1) { id name email } }"
      }
    },
    {
      order: 1,
      name: "REST Update",
      apiRequest: {
        protocol: "rest",
        method: "PUT",
        endpoint: "https://api.example.com/users/{{userId}}",
        body: { status: "active" }
      },
      variableMappings: [
        {
          sourceStep: 0,
          sourcePath: "$.data.user.id",
          targetVariable: "userId"
        }
      ]
    }
  ]
}
```

## API Integration

### Backend Endpoints Used

1. **Execute Workflow**
   - `POST /api/execute/workflow`
   - Body: `{ workflow, userId }`
   - Returns: Execution results with step-by-step details

2. **Save Workflow**
   - `POST /api/saved/workflows`
   - Body: Workflow object with userId
   - Returns: Saved workflow with ID

3. **Get Saved Workflows**
   - `GET /api/saved/workflows?userId=xxx`
   - Returns: List of saved workflows

4. **Get API Specs**
   - `GET /api/specs`
   - Returns: Available API specifications

## Variable Mapping

### JSONPath Syntax

Variable mappings use JSONPath to extract data from previous step responses:

- `$.data` - Root data object
- `$.data.id` - Specific field
- `$[0].id` - First array element's id field
- `$.users[*].email` - All user emails

### Using Variables

Variables are referenced in subsequent steps using double curly braces:

- In URLs: `https://api.example.com/users/{{userId}}`
- In request bodies: `{ "userId": "{{userId}}" }`
- In headers: `{ "X-User-ID": "{{userId}}" }`

## UI Components

### Step Card Features

- **Protocol Badge**: Color-coded protocol indicator (REST=blue, GraphQL=pink, gRPC=purple)
- **Method Badge**: HTTP method indicator for REST requests
- **Reorder Controls**: Up/down arrows to change step order
- **Expand/Collapse**: Toggle detailed configuration view
- **Edit Mode**: Click settings icon to edit step details
- **Delete**: Remove step from workflow

### Execution Results

- **Success Indicator**: Green checkmark for successful steps
- **Failure Indicator**: Red X for failed steps
- **Status Code**: HTTP status code badge
- **Duration**: Execution time in milliseconds
- **Response Viewer**: Monaco editor with JSON syntax highlighting
- **Error Messages**: Detailed error information for failed steps

## Testing

The component has been tested with:

1. ✅ Workflow execution with multiple steps
2. ✅ Workflow saving to database
3. ✅ Workflow retrieval and loading
4. ✅ Variable mapping between steps
5. ✅ Mixed protocol workflows
6. ✅ Error handling and display

See `backend/test-scripts/test-workflow-builder-integration.js` for integration tests.

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 3.1**: ✅ Create workflows with multiple API calls in sequence
- **Requirement 3.2**: ✅ Use response data from previous steps in subsequent requests
- **Requirement 3.3**: ✅ Execute calls with different protocols (REST, GraphQL, gRPC)
- **Requirement 3.4**: ✅ Display results of each step with timing information
- **Requirement 3.5**: ✅ Halt execution and display errors when steps fail
- **Requirement 6.2**: ✅ Save workflows as reusable templates

## Future Enhancements

Potential improvements for future iterations:

1. Drag-and-drop reordering (currently using up/down buttons)
2. Assertion configuration UI
3. Conditional step execution
4. Parallel step execution
5. Workflow templates library
6. Export/import workflows
7. Workflow versioning
8. Collaborative editing
