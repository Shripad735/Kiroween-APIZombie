import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Sample OpenAPI spec for testing
const sampleOpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sample API',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://api.example.com',
    },
  ],
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
      post: {
        summary: 'Create a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
          },
        },
      },
    },
  },
};

// Sample GraphQL schema for testing
const sampleGraphQLSchema = `
type Query {
  users: [User!]!
  user(id: ID!): User
}

type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String, email: String): User!
}

type User {
  id: ID!
  name: String!
  email: String!
}
`;

// Sample gRPC proto for testing
const sampleGRPCProto = `
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
}

message GetUserRequest {
  string id = 1;
}

message ListUsersRequest {
  int32 page = 1;
  int32 limit = 2;
}

message ListUsersResponse {
  repeated User users = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}
`;

async function testSpecsAPI() {
  console.log('🧪 Testing API Specification Management Endpoints\n');

  try {
    // Test 1: Health check
    console.log('1️⃣  Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);
    console.log();

    // Test 2: Upload OpenAPI spec
    console.log('2️⃣  Testing OpenAPI spec upload...');
    const openApiResponse = await axios.post(`${BASE_URL}/api/specs/upload`, {
      name: 'Sample REST API',
      type: 'openapi',
      baseUrl: 'https://api.example.com',
      specification: sampleOpenAPISpec,
    });
    console.log('✅ OpenAPI spec uploaded:', openApiResponse.data.data);
    const openApiSpecId = openApiResponse.data.data.id;
    console.log();

    // Test 3: Upload GraphQL schema
    console.log('3️⃣  Testing GraphQL schema upload...');
    const graphqlResponse = await axios.post(`${BASE_URL}/api/specs/upload`, {
      name: 'Sample GraphQL API',
      type: 'graphql',
      baseUrl: 'https://api.example.com/graphql',
      fileContent: sampleGraphQLSchema,
    });
    console.log('✅ GraphQL schema uploaded:', graphqlResponse.data.data);
    const graphqlSpecId = graphqlResponse.data.data.id;
    console.log();

    // Test 4: Upload gRPC proto
    console.log('4️⃣  Testing gRPC proto upload...');
    const grpcResponse = await axios.post(`${BASE_URL}/api/specs/upload`, {
      name: 'Sample gRPC Service',
      type: 'grpc',
      baseUrl: 'grpc://api.example.com:50051',
      fileContent: sampleGRPCProto,
    });
    console.log('✅ gRPC proto uploaded:', grpcResponse.data.data);
    const grpcSpecId = grpcResponse.data.data.id;
    console.log();

    // Test 5: List all specs
    console.log('5️⃣  Testing list all specs...');
    const listResponse = await axios.get(`${BASE_URL}/api/specs`);
    console.log('✅ Specs listed:', listResponse.data.data.length, 'specs found');
    listResponse.data.data.forEach(spec => {
      console.log(`   - ${spec.name} (${spec.type}): ${spec.endpointCount} endpoints`);
    });
    console.log();

    // Test 6: Get spec by ID
    console.log('6️⃣  Testing get spec by ID...');
    const getResponse = await axios.get(`${BASE_URL}/api/specs/${openApiSpecId}`);
    console.log('✅ Spec retrieved:', getResponse.data.data.name);
    console.log(`   Endpoints: ${getResponse.data.data.endpoints.length}`);
    console.log();

    // Test 7: Filter specs by type
    console.log('7️⃣  Testing filter by type (graphql)...');
    const filterResponse = await axios.get(`${BASE_URL}/api/specs?type=graphql`);
    console.log('✅ Filtered specs:', filterResponse.data.data.length, 'GraphQL specs found');
    console.log();

    // Test 8: Delete spec
    console.log('8️⃣  Testing delete spec...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/specs/${grpcSpecId}`);
    console.log('✅ Spec deleted:', deleteResponse.data.message);
    console.log();

    // Test 9: Verify deletion
    console.log('9️⃣  Verifying deletion...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/specs`);
    console.log('✅ Remaining specs:', verifyResponse.data.data.length);
    console.log();

    console.log('🎉 All tests passed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

// Run tests
console.log('Starting tests in 2 seconds...\n');
setTimeout(testSpecsAPI, 2000);
