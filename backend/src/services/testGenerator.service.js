import groq, { GROQ_CONFIG } from '../config/groq.js';
import logger from '../utils/logger.js';

/**
 * Build prompt for generating test suite
 */
const buildTestGenerationPrompt = (apiSpec, endpoint) => {
  let prompt = `You are an expert API test generator. Generate a comprehensive test suite for the following API endpoint.

API Specification:
- API Name: ${apiSpec.name}
- Base URL: ${apiSpec.baseUrl}
- Protocol: ${apiSpec.type}
`;

  // Find the specific endpoint details
  const endpointDetails = apiSpec.endpoints.find(
    (ep) => ep.path === endpoint || ep.path.includes(endpoint)
  );

  if (endpointDetails) {
    prompt += `\nEndpoint Details:
- Path: ${endpointDetails.path}
- Method: ${endpointDetails.method || endpointDetails.operationType || 'N/A'}
- Description: ${endpointDetails.description || 'No description available'}
`;

    if (endpointDetails.parameters && endpointDetails.parameters.length > 0) {
      prompt += `- Parameters: ${JSON.stringify(endpointDetails.parameters, null, 2)}
`;
    }

    if (endpointDetails.requestBody) {
      prompt += `- Request Body Schema: ${JSON.stringify(endpointDetails.requestBody, null, 2)}
`;
    }

    if (endpointDetails.responses) {
      prompt += `- Response Schemas: ${JSON.stringify(endpointDetails.responses, null, 2)}
`;
    }
  } else {
    prompt += `\nEndpoint: ${endpoint}
`;
  }

  prompt += `\nGenerate a comprehensive test suite that includes:

1. SUCCESS CASES (at least 2 tests):
   - Valid requests with expected successful responses
   - Different valid input variations

2. ERROR CASES (at least 2 tests):
   - Invalid input data
   - Missing required fields
   - Invalid data types

3. EDGE CASES (at least 2 tests):
   - Boundary values
   - Empty or null values
   - Large payloads

4. SECURITY TESTS (at least 2 tests):
   - Authentication tests (missing/invalid auth)
   - Authorization tests
   - Input validation and injection attempts

Return a JSON array of test cases with this exact structure:
[
  {
    "name": "Test case name",
    "description": "What this test validates",
    "request": {
      "protocol": "rest" | "graphql" | "grpc",
      "method": "GET" | "POST" | etc (for REST),
      "endpoint": "/path" or "queryName",
      "headers": { "Content-Type": "application/json" },
      "body": { ... } (if applicable),
      "query": "..." (for GraphQL),
      "variables": { ... } (for GraphQL)
    },
    "expectedResponse": {
      "statusCode": 200,
      "assertions": [
        {
          "type": "equals" | "contains" | "exists" | "type",
          "path": "$.data.field",
          "expected": "value"
        }
      ]
    },
    "category": "success" | "error" | "edge" | "security"
  }
]

IMPORTANT:
- Return ONLY the JSON array, no additional text
- Include at least 8 tests total (2 from each category)
- Make tests realistic and practical
- Include proper assertions for validation`;

  return prompt;
};

/**
 * Generate test suite for an API endpoint using Groq LLM
 * @param {Object} apiSpec - API specification object
 * @param {String} endpoint - Endpoint to generate tests for
 * @returns {Promise<Array>} Array of test cases
 */
export const generateTestSuite = async (apiSpec, endpoint) => {
  try {
    logger.info(`Generating test suite for endpoint: ${endpoint}`);

    const prompt = buildTestGenerationPrompt(apiSpec, endpoint);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API test generator. You create comprehensive, realistic test suites. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: 0.7, // Slightly higher for more creative test cases
      max_completion_tokens: 8192, // More tokens for comprehensive test suites
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON array from response
    let jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON array found in LLM response');
    }

    const testCases = JSON.parse(jsonMatch[0]);

    // Validate test cases structure
    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error('Generated test suite is empty or invalid');
    }

    // Ensure each test case has required fields
    const validatedTests = testCases.map((test, index) => {
      if (!test.name) {
        test.name = `Test Case ${index + 1}`;
      }
      if (!test.category) {
        test.category = 'success';
      }
      if (!test.request) {
        throw new Error(`Test case "${test.name}" missing request object`);
      }
      if (!test.expectedResponse) {
        test.expectedResponse = { statusCode: 200, assertions: [] };
      }
      if (!test.expectedResponse.statusCode) {
        test.expectedResponse.statusCode = 200;
      }
      if (!test.expectedResponse.assertions) {
        test.expectedResponse.assertions = [];
      }
      return test;
    });

    logger.info(`Successfully generated ${validatedTests.length} test cases`);

    return validatedTests;
  } catch (error) {
    logger.error('Test generation error:', error);

    if (error.message.includes('API key')) {
      throw new Error('Groq API key is invalid or missing. Please check your configuration.');
    }

    if (error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded for Groq API. Please try again later.');
    }

    throw new Error(`Failed to generate test suite: ${error.message}`);
  }
};

/**
 * Format test cases as Jest test code
 * @param {Array} testCases - Array of test case objects
 * @param {Object} apiSpec - API specification
 * @param {String} endpoint - Endpoint being tested
 * @returns {String} Jest test code
 */
export const formatTestCode = (testCases, apiSpec, endpoint) => {
  try {
    let code = `// Generated test suite for ${apiSpec.name} - ${endpoint}
// Generated at: ${new Date().toISOString()}

const axios = require('axios');

describe('${apiSpec.name} - ${endpoint}', () => {
  const baseUrl = '${apiSpec.baseUrl}';
  
  // Setup and teardown
  beforeAll(() => {
    // Add any setup logic here
  });

  afterAll(() => {
    // Add any cleanup logic here
  });

`;

    // Group tests by category
    const categories = {
      success: testCases.filter((t) => t.category === 'success'),
      error: testCases.filter((t) => t.category === 'error'),
      edge: testCases.filter((t) => t.category === 'edge'),
      security: testCases.filter((t) => t.category === 'security'),
    };

    // Generate test code for each category
    for (const [category, tests] of Object.entries(categories)) {
      if (tests.length === 0) continue;

      code += `  describe('${category.toUpperCase()} CASES', () => {
`;

      for (const test of tests) {
        code += `    test('${test.name}', async () => {
`;

        // Generate request code based on protocol
        if (test.request.protocol === 'rest' || !test.request.protocol) {
          const method = (test.request.method || 'GET').toLowerCase();
          const url = test.request.endpoint.startsWith('http')
            ? test.request.endpoint
            : `\${baseUrl}${test.request.endpoint}`;

          code += `      const response = await axios.${method}('${url}'`;

          if (test.request.body && (method === 'post' || method === 'put' || method === 'patch')) {
            code += `, ${JSON.stringify(test.request.body, null, 8)}`;
          }

          if (test.request.headers) {
            code += `, {
        headers: ${JSON.stringify(test.request.headers, null, 10)}
      }`;
          }

          code += `);\n\n`;
        } else if (test.request.protocol === 'graphql') {
          code += `      const response = await axios.post(\`\${baseUrl}\`, {
        query: \`${test.request.query}\`,
        variables: ${JSON.stringify(test.request.variables || {}, null, 8)}
      });\n\n`;
        }

        // Generate assertions
        code += `      // Assertions\n`;
        code += `      expect(response.status).toBe(${test.expectedResponse.statusCode});\n`;

        if (test.expectedResponse.assertions && test.expectedResponse.assertions.length > 0) {
          for (const assertion of test.expectedResponse.assertions) {
            const path = assertion.path.replace('$.', 'response.data.');

            switch (assertion.type) {
              case 'equals':
                code += `      expect(${path}).toBe(${JSON.stringify(assertion.expected)});\n`;
                break;
              case 'contains':
                code += `      expect(${path}).toContain(${JSON.stringify(assertion.expected)});\n`;
                break;
              case 'exists':
                code += `      expect(${path}).toBeDefined();\n`;
                break;
              case 'type':
                code += `      expect(typeof ${path}).toBe('${assertion.expected}');\n`;
                break;
              default:
                code += `      // Custom assertion: ${assertion.type}\n`;
            }
          }
        }

        code += `    });\n\n`;
      }

      code += `  });\n\n`;
    }

    code += `});
`;

    return code;
  } catch (error) {
    logger.error('Test code formatting error:', error);
    throw new Error(`Failed to format test code: ${error.message}`);
  }
};

/**
 * Execute test suite programmatically
 * Note: This is a simplified version. In production, you'd use Jest's programmatic API
 * @param {String} testCode - Jest test code to execute
 * @returns {Promise<Object>} Test execution results
 */
export const executeTests = async (testCode) => {
  try {
    logger.info('Executing test suite programmatically');

    // In a real implementation, you would:
    // 1. Write test code to a temporary file
    // 2. Use Jest's programmatic API to run the tests
    // 3. Parse and return the results

    // For now, we'll return a mock result structure
    // This would be replaced with actual Jest execution in production

    logger.warn('Test execution is not fully implemented - returning mock results');

    return {
      success: true,
      message: 'Test execution feature is under development. Tests have been generated but not executed.',
      results: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
      },
      note: 'To run these tests, export them and execute with Jest in your project.',
    };
  } catch (error) {
    logger.error('Test execution error:', error);
    throw new Error(`Failed to execute tests: ${error.message}`);
  }
};
