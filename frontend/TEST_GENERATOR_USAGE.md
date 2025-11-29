# Test Generator Component - Usage Guide

## Overview
The Test Generator component allows users to automatically generate comprehensive test suites for API endpoints using AI. It integrates with the backend `/api/tests/generate` and `/api/tests/run` endpoints.

## Features Implemented

### 1. API Specification Selection
- Uses the `APISpecManager` component to load and select API specifications
- Automatically extracts available endpoints from the selected specification
- Displays endpoints in a dropdown for easy selection

### 2. Test Generation
- **Generate Tests Button**: Sends a request to the backend to generate tests using AI
- Generates tests across 4 categories:
  - **Success Cases**: Valid requests with expected successful responses
  - **Error Cases**: Invalid inputs, missing fields, wrong data types
  - **Edge Cases**: Boundary values, empty/null values, large payloads
  - **Security Tests**: Authentication, authorization, input validation

### 3. Test Display
- Tests are grouped by category with color-coded badges:
  - Success: Green
  - Error: Red
  - Edge: Yellow
  - Security: Purple
- Each test displays:
  - Test name and description
  - Request details (method, endpoint)
  - Expected status code
  - Pass/fail status (after running tests)

### 4. Test Execution
- **Run Tests Button**: Executes the generated test suite
- Displays results with pass/fail indicators
- Shows summary statistics (total, passed, failed, duration)
- Highlights failed tests with detailed error messages

### 5. Test Export
- **Export Button**: Downloads test suite as JSON
- Format selection dropdown (Jest/Postman)
- Exported file includes:
  - Test suite metadata
  - All test cases
  - Request/response expectations

## Component Props
None - the component manages its own state internally.

## State Management
- `selectedSpec`: Currently selected API specification
- `endpoints`: List of endpoints extracted from the spec
- `selectedEndpoint`: Endpoint selected for test generation
- `testSuite`: Generated test suite data
- `testResults`: Results from test execution
- `generating`: Loading state for test generation
- `running`: Loading state for test execution
- `exportFormat`: Selected export format (jest/postman)

## API Integration

### Generate Tests
```javascript
POST /api/tests/generate
{
  "apiSpecId": "string",
  "endpoint": "string",
  "name": "string",
  "description": "string"
}
```

### Run Tests
```javascript
POST /api/tests/run
{
  "testSuiteId": "string"
}
```

## Usage Flow
1. User selects an API specification using APISpecManager
2. Component extracts and displays available endpoints
3. User selects an endpoint from the dropdown
4. User clicks "Generate Tests" button
5. Backend generates comprehensive test suite using AI
6. Tests are displayed grouped by category
7. User can:
   - Run tests to see pass/fail results
   - Export tests in Jest or Postman format
   - Review detailed test information

## Error Handling
- Validates that API spec is selected before generation
- Validates that endpoint is selected before generation
- Displays user-friendly error messages via toast notifications
- Shows suggestions from backend when available
- Handles loading states during async operations

## Styling
- Uses Tailwind CSS utility classes
- Follows the app's design system with:
  - `.card` for containers
  - `.btn-primary` and `.btn-secondary` for buttons
  - `.input` for form inputs
  - Color-coded badges for categories and status
  - Responsive layout with proper spacing

## Dependencies
- React (useState, useEffect)
- lucide-react (icons)
- @monaco-editor/react (code display)
- axios (HTTP requests)
- react-hot-toast (notifications)
- APISpecManager component

## Future Enhancements
- Real-time test execution with live updates
- Test editing capabilities
- Custom test creation
- Test history and comparison
- Integration with CI/CD pipelines
