import groq, { GROQ_CONFIG } from '../config/groq.js';
import logger from '../utils/logger.js';

/**
 * In-memory cache for NL parsing results
 * Key: hash of input + apiSpecId
 * Value: { result, timestamp }
 */
const nlCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Clean expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of nlCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      nlCache.delete(key);
    }
  }
};

// Clean cache every hour
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Generate cache key from input and API spec ID
 */
const getCacheKey = (input, apiSpecId) => {
  return `${input.toLowerCase().trim()}_${apiSpecId || 'no-spec'}`;
};

/**
 * Build prompt for LLM to convert natural language to API request
 */
export const buildPrompt = (input, apiSpec) => {
  let prompt = `You are an API request generator. Convert the following natural language description into a structured API request.

Natural Language Input: "${input}"
`;

  if (apiSpec) {
    prompt += `\nAPI Specification Context:
- API Name: ${apiSpec.name}
- Base URL: ${apiSpec.baseUrl}
- Protocol: ${apiSpec.type}
`;

    // Add endpoint information
    if (apiSpec.endpoints && apiSpec.endpoints.length > 0) {
      prompt += `\nAvailable Endpoints:\n`;
      
      // Limit to first 20 endpoints to avoid token limits
      const endpointsToShow = apiSpec.endpoints.slice(0, 20);
      
      for (const endpoint of endpointsToShow) {
        if (apiSpec.type === 'rest' || apiSpec.type === 'openapi') {
          prompt += `- ${endpoint.method} ${endpoint.path}`;
          if (endpoint.description) {
            prompt += ` - ${endpoint.description}`;
          }
          prompt += '\n';
        } else if (apiSpec.type === 'graphql') {
          prompt += `- ${endpoint.operationType}: ${endpoint.path}`;
          if (endpoint.description) {
            prompt += ` - ${endpoint.description}`;
          }
          prompt += '\n';
        } else if (apiSpec.type === 'grpc') {
          prompt += `- ${endpoint.path}`;
          if (endpoint.description) {
            prompt += ` - ${endpoint.description}`;
          }
          prompt += '\n';
        }
      }
      
      if (apiSpec.endpoints.length > 20) {
        prompt += `... and ${apiSpec.endpoints.length - 20} more endpoints\n`;
      }
    }
  }

  prompt += `\nGenerate a JSON object with the following structure:
{
  "protocol": "rest" | "graphql" | "grpc",
  "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH" (for REST only),
  "endpoint": "/path/to/endpoint" (for REST) or "queryName" (for GraphQL) or "ServiceName/MethodName" (for gRPC),
  "headers": {
    "Content-Type": "application/json",
    ... other headers
  },
  "body": { ... request body if applicable },
  "query": "GraphQL query string" (for GraphQL only),
  "variables": { ... GraphQL variables } (for GraphQL only)
}

Important:
- Infer the most appropriate endpoint from the available endpoints
- Include reasonable default headers
- For POST/PUT/PATCH requests, include a sample request body based on the endpoint
- Return ONLY the JSON object, no additional text or explanation
- If the input is ambiguous, make a reasonable assumption`;

  return prompt;
};

/**
 * Parse natural language input and convert to API request
 * @param {String} input - Natural language description
 * @param {Object} apiSpec - Optional API specification for context
 * @returns {Promise<Object>} Generated API request
 */
export const parseNaturalLanguage = async (input, apiSpec = null) => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(input, apiSpec?.id);
    const cached = nlCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logger.info('Returning cached NL parsing result');
      return cached.result;
    }

    // Build prompt with API spec context
    const prompt = buildPrompt(input, apiSpec);

    logger.info('Sending request to Groq API for NL parsing');

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API request generator. You convert natural language descriptions into structured API requests. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: GROQ_CONFIG.temperature,
      max_completion_tokens: GROQ_CONFIG.max_completion_tokens,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON from response (handle cases where LLM adds extra text)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const apiRequest = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!apiRequest.protocol) {
      apiRequest.protocol = 'rest'; // Default to REST
    }

    if (!apiRequest.endpoint && !apiRequest.query) {
      throw new Error('Generated request missing endpoint or query');
    }

    // Ensure headers exist
    if (!apiRequest.headers) {
      apiRequest.headers = {};
    }

    // Add default Content-Type if not present and body exists
    if (apiRequest.body && !apiRequest.headers['Content-Type']) {
      apiRequest.headers['Content-Type'] = 'application/json';
    }

    // Add base URL if API spec is provided
    if (apiSpec && apiSpec.baseUrl && apiRequest.protocol === 'rest') {
      apiRequest.baseUrl = apiSpec.baseUrl;
    }

    logger.info('Successfully parsed natural language to API request');

    // Cache the result
    nlCache.set(cacheKey, {
      result: apiRequest,
      timestamp: Date.now(),
    });

    return apiRequest;
  } catch (error) {
    logger.error('Natural language parsing error:', error);

    // Provide fallback error message
    if (error.message.includes('API key')) {
      throw new Error('Groq API key is invalid or missing. Please check your configuration.');
    }

    if (error.message.includes('rate limit')) {
      throw new Error('Rate limit exceeded for Groq API. Please try again later.');
    }

    throw new Error(`Failed to parse natural language: ${error.message}`);
  }
};

/**
 * Improve request generation with historical context
 * @param {String} input - Natural language description
 * @param {Array} history - Array of previous requests for context
 * @param {Object} apiSpec - Optional API specification
 * @returns {Promise<Object>} Generated API request
 */
export const improveWithContext = async (input, history = [], apiSpec = null) => {
  try {
    // Build context from history
    let contextPrompt = buildPrompt(input, apiSpec);

    if (history && history.length > 0) {
      contextPrompt += `\n\nRecent Request History (for context):`;
      
      // Include last 3 requests for context
      const recentHistory = history.slice(-3);
      
      for (const req of recentHistory) {
        contextPrompt += `\n- ${req.method || req.protocol} ${req.endpoint}`;
      }
      
      contextPrompt += `\n\nUse this history to better understand the user's intent and API usage patterns.`;
    }

    logger.info('Sending request to Groq API with historical context');

    // Call Groq API with context
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API request generator. You convert natural language descriptions into structured API requests. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: GROQ_CONFIG.temperature,
      max_completion_tokens: GROQ_CONFIG.max_completion_tokens,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract and parse JSON
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const apiRequest = JSON.parse(jsonMatch[0]);

    // Validate and set defaults
    if (!apiRequest.protocol) {
      apiRequest.protocol = 'rest';
    }

    if (!apiRequest.headers) {
      apiRequest.headers = {};
    }

    if (apiRequest.body && !apiRequest.headers['Content-Type']) {
      apiRequest.headers['Content-Type'] = 'application/json';
    }

    if (apiSpec && apiSpec.baseUrl && apiRequest.protocol === 'rest') {
      apiRequest.baseUrl = apiSpec.baseUrl;
    }

    logger.info('Successfully generated API request with context');

    return apiRequest;
  } catch (error) {
    logger.error('Context-aware parsing error:', error);
    
    // Fallback to basic parsing without context
    logger.info('Falling back to basic parsing without context');
    return parseNaturalLanguage(input, apiSpec);
  }
};

/**
 * Clear the NL parsing cache
 */
export const clearCache = () => {
  nlCache.clear();
  logger.info('NL parsing cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: nlCache.size,
    ttl: CACHE_TTL,
  };
};
