import groq, { GROQ_CONFIG } from '../config/groq.js';
import logger from '../utils/logger.js';

/**
 * In-memory cache for translation results
 * Key: hash of source request + source protocol + target protocol
 * Value: { result, timestamp }
 */
const translationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Clean expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      translationCache.delete(key);
    }
  }
};

// Clean cache every hour
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Generate cache key from source request and protocols
 */
const getCacheKey = (sourceRequest, sourceProtocol, targetProtocol) => {
  const requestStr = JSON.stringify(sourceRequest);
  return `${sourceProtocol}_${targetProtocol}_${requestStr}`;
};

/**
 * Validate if a request can be translated between protocols
 */
const validateTranslatability = (sourceRequest, sourceProtocol, targetProtocol) => {
  const errors = [];

  // Check if protocols are supported
  const supportedProtocols = ['rest', 'graphql', 'grpc'];
  if (!supportedProtocols.includes(sourceProtocol.toLowerCase())) {
    errors.push(`Source protocol "${sourceProtocol}" is not supported`);
  }
  if (!supportedProtocols.includes(targetProtocol.toLowerCase())) {
    errors.push(`Target protocol "${targetProtocol}" is not supported`);
  }

  // Check if source and target are the same
  if (sourceProtocol.toLowerCase() === targetProtocol.toLowerCase()) {
    errors.push('Source and target protocols cannot be the same');
  }

  // Validate source request structure
  if (!sourceRequest || typeof sourceRequest !== 'object') {
    errors.push('Source request must be a valid object');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Build prompt for REST to GraphQL translation
 */
const buildRESTtoGraphQLPrompt = (restRequest) => {
  return `You are an expert API protocol translator. Convert the following REST API request into an equivalent GraphQL query or mutation.

REST Request:
- Method: ${restRequest.method || 'GET'}
- Endpoint: ${restRequest.endpoint || restRequest.path || '/'}
- Headers: ${JSON.stringify(restRequest.headers || {}, null, 2)}
- Body: ${JSON.stringify(restRequest.body || {}, null, 2)}

Generate a JSON object with the following structure:
{
  "protocol": "graphql",
  "query": "GraphQL query or mutation string",
  "variables": { ... GraphQL variables if needed },
  "operationType": "query" | "mutation",
  "operationName": "name of the operation"
}

Guidelines:
- Convert GET requests to GraphQL queries
- Convert POST/PUT/PATCH/DELETE requests to GraphQL mutations
- Extract path parameters and query parameters as GraphQL arguments
- Convert request body fields to mutation arguments
- Use appropriate GraphQL naming conventions (camelCase)
- Return ONLY the JSON object, no additional text`;
};

/**
 * Build prompt for GraphQL to REST translation
 */
const buildGraphQLtoRESTPrompt = (graphqlRequest) => {
  return `You are an expert API protocol translator. Convert the following GraphQL query/mutation into an equivalent REST API request.

GraphQL Request:
- Query: ${graphqlRequest.query || ''}
- Variables: ${JSON.stringify(graphqlRequest.variables || {}, null, 2)}
- Operation Type: ${graphqlRequest.operationType || 'query'}

Generate a JSON object with the following structure:
{
  "protocol": "rest",
  "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  "endpoint": "/path/to/endpoint",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": { ... request body if applicable }
}

Guidelines:
- Convert GraphQL queries to GET requests
- Convert GraphQL mutations to POST/PUT/DELETE requests based on operation
- Extract GraphQL arguments as path parameters or query parameters
- Convert mutation arguments to request body
- Use RESTful naming conventions (kebab-case or snake_case for paths)
- Return ONLY the JSON object, no additional text`;
};

/**
 * Build prompt for REST to gRPC translation
 */
const buildRESTtoGRPCPrompt = (restRequest) => {
  return `You are an expert API protocol translator. Convert the following REST API request into an equivalent gRPC request.

REST Request:
- Method: ${restRequest.method || 'GET'}
- Endpoint: ${restRequest.endpoint || restRequest.path || '/'}
- Headers: ${JSON.stringify(restRequest.headers || {}, null, 2)}
- Body: ${JSON.stringify(restRequest.body || {}, null, 2)}

Generate a JSON object with the following structure:
{
  "protocol": "grpc",
  "service": "ServiceName",
  "method": "MethodName",
  "message": { ... gRPC message fields },
  "metadata": { ... gRPC metadata if needed }
}

Guidelines:
- Convert REST endpoint to gRPC service and method names (PascalCase)
- Convert request body to gRPC message fields
- Convert headers to gRPC metadata
- Use appropriate gRPC naming conventions
- Return ONLY the JSON object, no additional text`;
};

/**
 * Build prompt for gRPC to REST translation
 */
const buildGRPCtoRESTPrompt = (grpcRequest) => {
  return `You are an expert API protocol translator. Convert the following gRPC request into an equivalent REST API request.

gRPC Request:
- Service: ${grpcRequest.service || ''}
- Method: ${grpcRequest.method || ''}
- Message: ${JSON.stringify(grpcRequest.message || {}, null, 2)}
- Metadata: ${JSON.stringify(grpcRequest.metadata || {}, null, 2)}

Generate a JSON object with the following structure:
{
  "protocol": "rest",
  "method": "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  "endpoint": "/path/to/endpoint",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": { ... request body if applicable }
}

Guidelines:
- Convert gRPC service and method to REST endpoint path
- Convert gRPC message fields to request body or query parameters
- Convert gRPC metadata to HTTP headers
- Use RESTful naming conventions
- Return ONLY the JSON object, no additional text`;
};

/**
 * Build prompt for GraphQL to gRPC translation
 */
const buildGraphQLtoGRPCPrompt = (graphqlRequest) => {
  return `You are an expert API protocol translator. Convert the following GraphQL query/mutation into an equivalent gRPC request.

GraphQL Request:
- Query: ${graphqlRequest.query || ''}
- Variables: ${JSON.stringify(graphqlRequest.variables || {}, null, 2)}
- Operation Type: ${graphqlRequest.operationType || 'query'}

Generate a JSON object with the following structure:
{
  "protocol": "grpc",
  "service": "ServiceName",
  "method": "MethodName",
  "message": { ... gRPC message fields },
  "metadata": { ... gRPC metadata if needed }
}

Guidelines:
- Convert GraphQL operation to gRPC service and method names
- Convert GraphQL arguments to gRPC message fields
- Use appropriate gRPC naming conventions (PascalCase)
- Return ONLY the JSON object, no additional text`;
};

/**
 * Build prompt for gRPC to GraphQL translation
 */
const buildGRPCtoGraphQLPrompt = (grpcRequest) => {
  return `You are an expert API protocol translator. Convert the following gRPC request into an equivalent GraphQL query or mutation.

gRPC Request:
- Service: ${grpcRequest.service || ''}
- Method: ${grpcRequest.method || ''}
- Message: ${JSON.stringify(grpcRequest.message || {}, null, 2)}

Generate a JSON object with the following structure:
{
  "protocol": "graphql",
  "query": "GraphQL query or mutation string",
  "variables": { ... GraphQL variables if needed },
  "operationType": "query" | "mutation",
  "operationName": "name of the operation"
}

Guidelines:
- Convert gRPC method to GraphQL operation
- Convert gRPC message fields to GraphQL arguments
- Use appropriate GraphQL naming conventions (camelCase)
- Return ONLY the JSON object, no additional text`;
};

/**
 * Translate REST API request to GraphQL
 * @param {Object} restRequest - REST API request object
 * @returns {Promise<Object>} GraphQL query/mutation
 */
export const translateRESTtoGraphQL = async (restRequest) => {
  try {
    // Validate request
    if (!restRequest || typeof restRequest !== 'object') {
      throw new Error('Invalid REST request: must be an object');
    }

    // Check cache
    const cacheKey = getCacheKey(restRequest, 'rest', 'graphql');
    const cached = translationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logger.info('Returning cached REST to GraphQL translation');
      return cached.result;
    }

    // Build prompt
    const prompt = buildRESTtoGraphQLPrompt(restRequest);

    logger.info('Translating REST to GraphQL using Groq API');

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API protocol translator specializing in REST and GraphQL. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: 0.3, // Lower temperature for more consistent translations
      max_completion_tokens: GROQ_CONFIG.max_completion_tokens,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const graphqlRequest = JSON.parse(jsonMatch[0]);

    // Validate result
    if (!graphqlRequest.query) {
      throw new Error('Translation failed: missing GraphQL query');
    }

    graphqlRequest.protocol = 'graphql';

    logger.info('Successfully translated REST to GraphQL');

    // Cache the result
    translationCache.set(cacheKey, {
      result: graphqlRequest,
      timestamp: Date.now(),
    });

    return graphqlRequest;
  } catch (error) {
    logger.error('REST to GraphQL translation error:', error);
    throw new Error(`Failed to translate REST to GraphQL: ${error.message}`);
  }
};

/**
 * Translate GraphQL query/mutation to REST API request
 * @param {Object} graphqlRequest - GraphQL request object
 * @returns {Promise<Object>} REST API request
 */
export const translateGraphQLtoREST = async (graphqlRequest) => {
  try {
    // Validate request
    if (!graphqlRequest || typeof graphqlRequest !== 'object') {
      throw new Error('Invalid GraphQL request: must be an object');
    }

    if (!graphqlRequest.query) {
      throw new Error('Invalid GraphQL request: missing query field');
    }

    // Check cache
    const cacheKey = getCacheKey(graphqlRequest, 'graphql', 'rest');
    const cached = translationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logger.info('Returning cached GraphQL to REST translation');
      return cached.result;
    }

    // Build prompt
    const prompt = buildGraphQLtoRESTPrompt(graphqlRequest);

    logger.info('Translating GraphQL to REST using Groq API');

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API protocol translator specializing in GraphQL and REST. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: 0.3, // Lower temperature for more consistent translations
      max_completion_tokens: GROQ_CONFIG.max_completion_tokens,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const restRequest = JSON.parse(jsonMatch[0]);

    // Validate result
    if (!restRequest.method || !restRequest.endpoint) {
      throw new Error('Translation failed: missing method or endpoint');
    }

    restRequest.protocol = 'rest';

    // Ensure headers exist
    if (!restRequest.headers) {
      restRequest.headers = {};
    }

    // Add default Content-Type if body exists
    if (restRequest.body && !restRequest.headers['Content-Type']) {
      restRequest.headers['Content-Type'] = 'application/json';
    }

    logger.info('Successfully translated GraphQL to REST');

    // Cache the result
    translationCache.set(cacheKey, {
      result: restRequest,
      timestamp: Date.now(),
    });

    return restRequest;
  } catch (error) {
    logger.error('GraphQL to REST translation error:', error);
    throw new Error(`Failed to translate GraphQL to REST: ${error.message}`);
  }
};

/**
 * Explain the translation between protocols
 * @param {Object} sourceRequest - Original request
 * @param {Object} translatedRequest - Translated request
 * @param {String} sourceProtocol - Source protocol
 * @param {String} targetProtocol - Target protocol
 * @returns {Promise<String>} Explanation of the translation
 */
export const explainTranslation = async (sourceRequest, translatedRequest, sourceProtocol, targetProtocol) => {
  try {
    const prompt = `You are an expert API protocol translator. Explain how the following API request was translated from ${sourceProtocol.toUpperCase()} to ${targetProtocol.toUpperCase()}.

Original ${sourceProtocol.toUpperCase()} Request:
${JSON.stringify(sourceRequest, null, 2)}

Translated ${targetProtocol.toUpperCase()} Request:
${JSON.stringify(translatedRequest, null, 2)}

Provide a clear, concise explanation covering:
1. How the endpoint/operation was mapped
2. How parameters/arguments were converted
3. How the request method/operation type was determined
4. Any important differences or limitations
5. Best practices for this type of translation

Keep the explanation under 300 words and make it developer-friendly.`;

    logger.info(`Generating explanation for ${sourceProtocol} to ${targetProtocol} translation`);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert API protocol translator. Provide clear, concise explanations of protocol translations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: 0.5,
      max_completion_tokens: 1024,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const explanation = completion.choices[0]?.message?.content;

    if (!explanation) {
      throw new Error('Empty response from Groq API');
    }

    logger.info('Successfully generated translation explanation');

    return explanation.trim();
  } catch (error) {
    logger.error('Translation explanation error:', error);
    
    // Provide a fallback explanation
    return `Translation from ${sourceProtocol.toUpperCase()} to ${targetProtocol.toUpperCase()} completed. The request structure has been adapted to match the target protocol's conventions.`;
  }
};

/**
 * Generic translation function using Groq API
 * @param {Object} sourceRequest - Source request
 * @param {Function} promptBuilder - Function to build the prompt
 * @param {String} sourceProtocol - Source protocol name
 * @param {String} targetProtocol - Target protocol name
 * @returns {Promise<Object>} Translated request
 */
const translateWithGroq = async (sourceRequest, promptBuilder, sourceProtocol, targetProtocol) => {
  try {
    // Check cache
    const cacheKey = getCacheKey(sourceRequest, sourceProtocol, targetProtocol);
    const cached = translationCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logger.info(`Returning cached ${sourceProtocol} to ${targetProtocol} translation`);
      return cached.result;
    }

    // Build prompt
    const prompt = promptBuilder(sourceRequest);

    logger.info(`Translating ${sourceProtocol} to ${targetProtocol} using Groq API`);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert API protocol translator specializing in ${sourceProtocol.toUpperCase()} and ${targetProtocol.toUpperCase()}. Always respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: GROQ_CONFIG.model,
      temperature: 0.3,
      max_completion_tokens: GROQ_CONFIG.max_completion_tokens,
      top_p: GROQ_CONFIG.top_p,
      stream: GROQ_CONFIG.stream,
      stop: GROQ_CONFIG.stop,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in LLM response');
    }

    const translatedRequest = JSON.parse(jsonMatch[0]);
    translatedRequest.protocol = targetProtocol;

    logger.info(`Successfully translated ${sourceProtocol} to ${targetProtocol}`);

    // Cache the result
    translationCache.set(cacheKey, {
      result: translatedRequest,
      timestamp: Date.now(),
    });

    return translatedRequest;
  } catch (error) {
    logger.error(`${sourceProtocol} to ${targetProtocol} translation error:`, error);
    throw new Error(`Failed to translate ${sourceProtocol} to ${targetProtocol}: ${error.message}`);
  }
};

/**
 * Main translation function that routes to appropriate translator
 * @param {Object} sourceRequest - Source API request
 * @param {String} sourceProtocol - Source protocol (rest, graphql, grpc)
 * @param {String} targetProtocol - Target protocol (rest, graphql, grpc)
 * @returns {Promise<Object>} Translation result with original, translated, and explanation
 */
export const translateProtocol = async (sourceRequest, sourceProtocol, targetProtocol) => {
  try {
    // Validate translatability
    const validation = validateTranslatability(sourceRequest, sourceProtocol, targetProtocol);
    
    if (!validation.isValid) {
      throw new Error(`Translation not possible: ${validation.errors.join(', ')}`);
    }

    const sourceLower = sourceProtocol.toLowerCase();
    const targetLower = targetProtocol.toLowerCase();

    let translatedRequest;

    // Route to appropriate translator
    if (sourceLower === 'rest' && targetLower === 'graphql') {
      translatedRequest = await translateRESTtoGraphQL(sourceRequest);
    } else if (sourceLower === 'graphql' && targetLower === 'rest') {
      translatedRequest = await translateGraphQLtoREST(sourceRequest);
    } else if (sourceLower === 'rest' && targetLower === 'grpc') {
      translatedRequest = await translateWithGroq(sourceRequest, buildRESTtoGRPCPrompt, 'REST', 'gRPC');
    } else if (sourceLower === 'grpc' && targetLower === 'rest') {
      translatedRequest = await translateWithGroq(sourceRequest, buildGRPCtoRESTPrompt, 'gRPC', 'REST');
    } else if (sourceLower === 'graphql' && targetLower === 'grpc') {
      translatedRequest = await translateWithGroq(sourceRequest, buildGraphQLtoGRPCPrompt, 'GraphQL', 'gRPC');
    } else if (sourceLower === 'grpc' && targetLower === 'graphql') {
      translatedRequest = await translateWithGroq(sourceRequest, buildGRPCtoGraphQLPrompt, 'gRPC', 'GraphQL');
    } else {
      throw new Error(`Translation from ${sourceProtocol} to ${targetProtocol} is not supported`);
    }

    // Generate explanation
    const explanation = await explainTranslation(
      sourceRequest,
      translatedRequest,
      sourceProtocol,
      targetProtocol
    );

    return {
      original: sourceRequest,
      translated: translatedRequest,
      sourceProtocol: sourceLower,
      targetProtocol: targetLower,
      explanation,
    };
  } catch (error) {
    logger.error('Protocol translation error:', error);
    throw error;
  }
};

/**
 * Clear the translation cache
 */
export const clearCache = () => {
  translationCache.clear();
  logger.info('Translation cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: translationCache.size,
    ttl: CACHE_TTL,
  };
};
