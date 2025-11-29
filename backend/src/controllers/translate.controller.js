import { translateProtocol } from '../services/protocolTranslator.service.js';
import logger from '../utils/logger.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

/**
 * Translate API request between protocols
 * POST /api/translate
 */
export const translate = async (req, res) => {
  try {
    const { sourceRequest, sourceProtocol, targetProtocol } = req.body;

    // Validate required fields
    if (!sourceRequest) {
      return res.status(400).json(
        errorResponse(
          'MISSING_SOURCE_REQUEST',
          'Source request is required',
          null,
          ['Provide the API request you want to translate']
        )
      );
    }

    if (!sourceProtocol || typeof sourceProtocol !== 'string') {
      return res.status(400).json(
        errorResponse(
          'INVALID_SOURCE_PROTOCOL',
          'Source protocol is required and must be a string',
          null,
          ['Supported protocols: rest, graphql, grpc']
        )
      );
    }

    if (!targetProtocol || typeof targetProtocol !== 'string') {
      return res.status(400).json(
        errorResponse(
          'INVALID_TARGET_PROTOCOL',
          'Target protocol is required and must be a string',
          null,
          ['Supported protocols: rest, graphql, grpc']
        )
      );
    }

    // Perform translation
    const result = await translateProtocol(sourceRequest, sourceProtocol, targetProtocol);

    logger.info(`Successfully translated from ${sourceProtocol} to ${targetProtocol}`);

    return res.json(
      successResponse(
        result,
        `Successfully translated from ${sourceProtocol.toUpperCase()} to ${targetProtocol.toUpperCase()}`
      )
    );
  } catch (error) {
    logger.error('Error in translate controller:', error);

    // Handle specific error types
    if (error.message.includes('not possible') || error.message.includes('not yet supported') || error.message.includes('not supported')) {
      return res.status(400).json(
        errorResponse(
          'TRANSLATION_NOT_SUPPORTED',
          error.message,
          null,
          [
            'Check that both protocols are supported (rest, graphql)',
            'Ensure source and target protocols are different',
            'Note: gRPC translation is not yet fully supported',
          ]
        )
      );
    }

    if (error.message.includes('Groq API')) {
      return res.status(503).json(
        errorResponse(
          'LLM_SERVICE_ERROR',
          error.message,
          null,
          ['The AI service is temporarily unavailable. Please try again later.']
        )
      );
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json(
        errorResponse(
          'RATE_LIMIT_EXCEEDED',
          error.message,
          null,
          ['Too many requests. Please wait a moment before trying again.']
        )
      );
    }

    return res.status(500).json(
      errorResponse(
        'TRANSLATION_ERROR',
        error.message,
        null,
        ['Verify your request structure is valid', 'Try a simpler request to test the translation']
      )
    );
  }
};
