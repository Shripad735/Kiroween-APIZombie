# Design Document

## Overview

APIZombie is a full-stack web application built with React frontend and Node.js/Express backend. The system uses Groq's LLM API for natural language processing and AI-powered features. The architecture follows a modular design with clear separation between the web interface, API server, protocol handlers, and AI processing engine.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Web Dashboard                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ NL Input │  │ Workflow │  │   Test   │  │ Protocol │   │
│  │  Panel   │  │ Builder  │  │ Generator│  │Translator│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Backend Server                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes & Controllers                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │    NL    │  │ Protocol │  │   Test   │  │  Workflow│   │
│  │  Engine  │  │ Handlers │  │ Generator│  │  Engine  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Groq API   │    │   MongoDB    │    │ Target APIs  │
│  (LLM Model) │    │  (Storage)   │    │ (REST/GQL/   │
│              │    │              │    │  gRPC)       │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with functional components and hooks
- React Router for navigation
- Axios for HTTP requests
- Monaco Editor for code display/editing
- Tailwind CSS for styling
- React Query for state management

**Backend:**
- Node.js 18+
- Express.js for REST API
- MongoDB with Mongoose for data persistence
- Groq SDK for LLM integration
- Axios for making API calls to target systems
- JSON Schema validator for response validation

**External Services:**
- Groq API (LLM provider)
- MongoDB Atlas (database hosting)

## Components and Interfaces

### Frontend Components

#### 1. NaturalLanguagePanel
- **Purpose**: Accept natural language input and display generated API requests
- **Props**: `apiSpecs: APISpec[]`, `onExecute: (request) => void`
- **State**: `input: string`, `generatedRequest: APIRequest`, `loading: boolean`
- **Key Methods**: 
  - `handleSubmit()`: Send NL input to backend
  - `displayRequest()`: Show generated request details
  - `executeRequest()`: Trigger API call execution

#### 2. WorkflowBuilder
- **Purpose**: Create and manage multi-step API workflows
- **Props**: `savedWorkflows: Workflow[]`, `apiSpecs: APISpec[]`
- **State**: `steps: WorkflowStep[]`, `currentStep: number`, `executing: boolean`
- **Key Methods**:
  - `addStep()`: Add new API call to workflow
  - `executeWorkflow()`: Run all steps in sequence
  - `saveWorkflow()`: Persist workflow to backend

#### 3. TestGenerator
- **Purpose**: Generate and run test suites for APIs
- **Props**: `apiSpec: APISpec`, `endpoint: string`
- **State**: `tests: Test[]`, `results: TestResult[]`, `generating: boolean`
- **Key Methods**:
  - `generateTests()`: Request AI-generated tests
  - `runTests()`: Execute test suite
  - `exportTests()`: Download tests in various formats

#### 4. ProtocolTranslator
- **Purpose**: Convert API requests between protocols
- **Props**: `sourceProtocol: string`, `targetProtocol: string`
- **State**: `sourceRequest: string`, `translatedRequest: string`
- **Key Methods**:
  - `translate()`: Convert between protocols
  - `displayComparison()`: Show side-by-side view

#### 5. APISpecManager
- **Purpose**: Upload and manage API specifications
- **Props**: `onSpecLoaded: (spec) => void`
- **State**: `specs: APISpec[]`, `selectedSpec: string`
- **Key Methods**:
  - `uploadSpec()`: Handle file upload
  - `parseSpec()`: Extract API information
  - `introspectGraphQL()`: Fetch GraphQL schema

### Backend Components

#### 1. NLEngine
- **Purpose**: Convert natural language to API requests using Groq LLM
- **Dependencies**: Groq SDK, API Spec Parser
- **Key Methods**:
  - `async parseNaturalLanguage(input: string, apiSpec: APISpec): Promise<APIRequest>`
  - `async improveWithContext(input: string, history: Request[]): Promise<APIRequest>`
  - `buildPrompt(input: string, apiSpec: APISpec): string`

#### 2. ProtocolHandlers
- **Purpose**: Execute API calls for different protocols
- **Subcomponents**:
  - `RESTHandler`: Handle REST API calls
  - `GraphQLHandler`: Execute GraphQL queries/mutations
  - `gRPCHandler`: Make gRPC calls
- **Key Methods**:
  - `async execute(request: APIRequest): Promise<APIResponse>`
  - `validateRequest(request: APIRequest): ValidationResult`
  - `formatResponse(response: any): APIResponse`

#### 3. TestGeneratorEngine
- **Purpose**: Generate comprehensive test suites using AI
- **Dependencies**: Groq SDK, Test Template Library
- **Key Methods**:
  - `async generateTestSuite(apiSpec: APISpec, endpoint: string): Promise<TestSuite>`
  - `async generateTestCase(scenario: string): Promise<TestCase>`
  - `formatTestCode(tests: TestCase[], format: string): string`

#### 4. WorkflowEngine
- **Purpose**: Execute multi-step workflows with data passing
- **Dependencies**: Protocol Handlers, Variable Resolver
- **Key Methods**:
  - `async executeWorkflow(workflow: Workflow): Promise<WorkflowResult>`
  - `resolveVariables(step: WorkflowStep, context: object): WorkflowStep`
  - `extractResponseData(response: APIResponse, path: string): any`

#### 5. ProtocolTranslatorEngine
- **Purpose**: Convert requests between different API protocols
- **Dependencies**: Groq SDK, Protocol Schemas
- **Key Methods**:
  - `async translateRESTtoGraphQL(restRequest: RESTRequest): Promise<GraphQLQuery>`
  - `async translateGraphQLtoREST(gqlQuery: GraphQLQuery): Promise<RESTRequest>`
  - `async explainTranslation(source: any, target: any): Promise<string>`

## Data Models

### APISpec
```typescript
interface APISpec {
  id: string;
  name: string;
  type: 'openapi' | 'graphql' | 'grpc';
  baseUrl: string;
  specification: object; // Raw spec data
  endpoints: Endpoint[];
  authentication?: AuthConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

### APIRequest
```typescript
interface APIRequest {
  id: string;
  protocol: 'rest' | 'graphql' | 'grpc';
  method?: string; // For REST
  endpoint: string;
  headers: Record<string, string>;
  body?: any;
  query?: string; // For GraphQL
  variables?: object; // For GraphQL
  metadata?: object; // For gRPC
}
```

### Workflow
```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowStep {
  id: string;
  order: number;
  apiRequest: APIRequest;
  variableMappings: VariableMapping[]; // Extract data from previous steps
  assertions?: Assertion[]; // Validate response
}
```

### TestSuite
```typescript
interface TestSuite {
  id: string;
  name: string;
  apiSpecId: string;
  endpoint: string;
  tests: TestCase[];
  createdAt: Date;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  request: APIRequest;
  expectedResponse: {
    statusCode: number;
    schema?: object;
    assertions: Assertion[];
  };
  category: 'success' | 'error' | 'edge' | 'security';
}
```

### RequestHistory
```typescript
interface RequestHistory {
  id: string;
  userId: string;
  request: APIRequest;
  response: APIResponse;
  duration: number; // milliseconds
  success: boolean;
  timestamp: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Natural Language Parsing Completeness
*For any* natural language description provided by a user, the system should generate an API request object containing all required fields (protocol, endpoint, method/query, headers).
**Validates: Requirements 1.1**

### Property 2: API Specification Parsing Round-Trip
*For any* valid API specification file (OpenAPI, GraphQL schema, gRPC proto), parsing and storing the specification should preserve all endpoint definitions such that they can be retrieved and used for request generation.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Workflow Data Flow Consistency
*For any* workflow with multiple steps, data extracted from step N's response should be available and correctly substituted in step N+1's request variables.
**Validates: Requirements 3.2**

### Property 4: Protocol Handler Selection
*For any* workflow containing mixed protocols (REST, GraphQL, gRPC), each step should be executed by the appropriate protocol handler matching that step's protocol type.
**Validates: Requirements 3.3**

### Property 5: Workflow Failure Isolation
*For any* workflow where step N fails, execution should halt at step N, and no subsequent steps (N+1, N+2, ...) should be executed.
**Validates: Requirements 3.5**

### Property 6: Protocol Translation Bidirectionality
*For any* REST request translated to GraphQL and then back to REST, the final REST request should be semantically equivalent to the original (allowing for protocol-specific differences).
**Validates: Requirements 4.1, 4.2**

### Property 7: Test Suite Coverage Completeness
*For any* API endpoint, the generated test suite should contain at least one test from each category: success case, error case, and edge case.
**Validates: Requirements 5.1**

### Property 8: Test Suite Security Coverage
*For any* generated test suite, tests should be present for all four security/validation categories: authentication, authorization, input validation, and response validation.
**Validates: Requirements 5.2**

### Property 9: Export-Import Round-Trip Integrity
*For any* saved request or workflow, exporting to JSON and then importing should restore an equivalent item with the same functional properties (endpoint, method, body, etc.).
**Validates: Requirements 6.4, 6.5**

### Property 10: Request History Logging Completeness
*For any* executed API request, a history entry should be created containing all required fields: timestamp, endpoint, request details, response, and execution result.
**Validates: Requirements 7.1**

### Property 11: History Filter Correctness
*For any* filter criteria (date range, API, status code, protocol), the filtered history results should contain only entries matching all specified criteria.
**Validates: Requirements 7.4**

### Property 12: State Preservation Across Navigation
*For any* feature navigation (from NL Panel to Workflow Builder, etc.), the application state (current request, loaded specs, auth config) should be preserved and available in the new view.
**Validates: Requirements 8.2**

### Property 13: Authentication Header Injection
*For any* API with configured authentication, all requests to that API should include the appropriate authentication headers or credentials.
**Validates: Requirements 9.2**

### Property 14: Credential Storage Encryption
*For any* authentication credentials saved to the database, the stored value should be encrypted and not equal to the plaintext input.
**Validates: Requirements 9.3**

### Property 15: Response Schema Validation Accuracy
*For any* response and expected schema pair, validation should correctly identify all fields that violate the schema (wrong type, missing required field, constraint violation).
**Validates: Requirements 10.1, 10.2**

## Error Handling

### Error Categories

1. **User Input Errors**
   - Invalid API specifications
   - Malformed natural language input
   - Invalid workflow configurations
   - Strategy: Validate input, return clear error messages with examples

2. **External API Errors**
   - Target API unreachable
   - Authentication failures
   - Rate limiting
   - Timeout errors
   - Strategy: Retry with exponential backoff, display detailed error context

3. **LLM Processing Errors**
   - Groq API failures
   - Invalid LLM responses
   - Token limit exceeded
   - Strategy: Fallback to template-based generation, cache successful responses

4. **System Errors**
   - Database connection failures
   - Memory/resource exhaustion
   - Unexpected exceptions
   - Strategy: Graceful degradation, log errors, display user-friendly messages

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string; // e.g., "INVALID_API_SPEC", "AUTH_FAILED"
    message: string; // User-friendly message
    details?: any; // Technical details for debugging
    suggestions?: string[]; // Actionable suggestions
  };
}
```

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock external dependencies (Groq API, MongoDB, target APIs)
- Focus on business logic in engines (NLEngine, WorkflowEngine, etc.)
- Test data models and validation functions
- Use Jest for Node.js backend and React Testing Library for frontend

### Property-Based Testing
- Use **fast-check** library for JavaScript/TypeScript property-based testing
- Each property test should run a minimum of 100 iterations
- Tag each property test with the format: `**Feature: api-zombie, Property {number}: {property_text}**`
- Generate random inputs (API specs, requests, workflows) to verify properties hold
- Focus on properties defined in the Correctness Properties section

### Integration Testing
- Test API routes end-to-end with real database
- Test protocol handlers with mock API servers
- Test workflow execution with multiple steps
- Verify authentication flows
- Use Supertest for API testing

### End-to-End Testing
- Test complete user workflows through the UI
- Use Playwright or Cypress for browser automation
- Test critical paths: NL to API execution, workflow creation and execution, test generation
- Test on multiple browsers and screen sizes

## Security Considerations

1. **Authentication Credential Storage**
   - Encrypt credentials using AES-256 before storing in database
   - Use environment variables for encryption keys
   - Never log or expose credentials in responses

2. **API Key Protection**
   - Store Groq API key in environment variables
   - Never expose in frontend code or responses
   - Implement rate limiting to prevent abuse

3. **Input Validation**
   - Sanitize all user inputs to prevent injection attacks
   - Validate API specifications before parsing
   - Limit file upload sizes

4. **CORS Configuration**
   - Configure CORS to allow only trusted origins
   - Use credentials: true for authenticated requests

5. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Limit Groq API calls to prevent cost overruns
   - Queue requests if rate limits are hit

## Performance Considerations

1. **Caching Strategy**
   - Cache parsed API specifications in memory
   - Cache LLM responses for identical inputs (24-hour TTL)
   - Use Redis for distributed caching if scaling

2. **Async Processing**
   - Use async/await for all I/O operations
   - Process workflow steps sequentially but non-blocking
   - Stream large responses to frontend

3. **Database Optimization**
   - Index frequently queried fields (userId, timestamp, apiSpecId)
   - Limit history queries with pagination
   - Archive old history data after 90 days

4. **Frontend Optimization**
   - Lazy load components
   - Debounce natural language input
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists

## Deployment Architecture

### Development Environment
- Local MongoDB instance
- Node.js server on localhost:5000
- React dev server on localhost:3000
- Environment variables in .env file

### Production Environment
- Frontend: Vercel or Netlify (static hosting)
- Backend: Railway, Render, or AWS EC2
- Database: MongoDB Atlas (cloud)
- Environment variables in hosting platform

### CI/CD Pipeline
1. Push to GitHub triggers build
2. Run unit tests and linting
3. Build frontend and backend
4. Deploy backend to hosting platform
5. Deploy frontend to static hosting
6. Run smoke tests on production

## API Endpoints

### Natural Language Processing
- `POST /api/nl/parse` - Convert natural language to API request
- `POST /api/nl/improve` - Improve request with context

### API Specifications
- `POST /api/specs/upload` - Upload API specification
- `GET /api/specs` - List all specifications
- `GET /api/specs/:id` - Get specification details
- `DELETE /api/specs/:id` - Delete specification
- `POST /api/specs/introspect` - Introspect GraphQL endpoint

### API Execution
- `POST /api/execute` - Execute API request
- `POST /api/execute/workflow` - Execute workflow

### Protocol Translation
- `POST /api/translate` - Translate between protocols

### Test Generation
- `POST /api/tests/generate` - Generate test suite
- `POST /api/tests/run` - Run test suite
- `GET /api/tests/:id` - Get test suite details

### Saved Items
- `POST /api/saved/requests` - Save API request
- `GET /api/saved/requests` - List saved requests
- `POST /api/saved/workflows` - Save workflow
- `GET /api/saved/workflows` - List saved workflows
- `POST /api/saved/export` - Export saved items
- `POST /api/saved/import` - Import saved items

### History & Analytics
- `GET /api/history` - Get request history (with filters)
- `GET /api/analytics` - Get analytics data
- `DELETE /api/history` - Clear history

### Authentication Configuration
- `POST /api/auth/config` - Save auth configuration
- `GET /api/auth/config/:apiId` - Get auth configuration
- `PUT /api/auth/config/:apiId` - Update auth configuration
