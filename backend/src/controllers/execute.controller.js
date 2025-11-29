import { getProtocolHandler } from '../handlers/index.js';
import { AuthConfig, RequestHistory, APISpec, Workflow } from '../models/index.js';
import WorkflowEngine from '../services/workflowEngine.service.js';
import { validateWithApiSpec } from '../services/responseValidator.service.js';
import logger from '../utils/logger.js';
import { successResponse } from '../utils/responseFormatter.js';
import { asyncHandler, createError } from '../middleware/errorHandler.middleware.js';

/**
 * Execute an API request
 * POST /api/execute
 */
export const executeRequest = asyncHandler(async (req, res) => {
  const { request, apiSpecId, saveToHistory = true } = req.body;

  // Validate request object
  if (!request) {
    throw createError('INVALID_INPUT', 'Request object is required');
  }

  if (!request.protocol) {
    throw createError('INVALID_INPUT', 'Request protocol is required');
  }

  // Get auth config if apiSpecId is provided
  let authConfig = null;
  if (apiSpecId) {
    const userId = req.body.userId || 'default-user';
    authConfig = await AuthConfig.findOne({ apiSpecId, userId });
  }

  // Get the appropriate protocol handler
  let handler;
  try {
    handler = getProtocolHandler(request.protocol);
  } catch (error) {
    throw createError('INVALID_INPUT', `Invalid protocol: ${error.message}`);
  }

  // Execute the request
  logger.info(`Executing ${request.protocol.toUpperCase()} request to ${request.endpoint}`);
  const response = await handler.execute(request, authConfig);

  // Perform automatic validation if API spec is available and validation is requested
  let validationResult = null;
  if (apiSpecId && req.body.validateResponse !== false) {
    try {
      const apiSpec = await APISpec.findById(apiSpecId);
      if (apiSpec) {
        validationResult = validateWithApiSpec(
          response.body,
          apiSpec,
          request.endpoint,
          request.method || 'GET',
          response.statusCode
        );
        logger.info('Response validation completed', { success: validationResult.success });
      }
    } catch (validationError) {
      logger.error('Error during automatic validation:', validationError);
      // Don't fail the request if validation fails
    }
  }

  // Save to history if requested
  if (saveToHistory) {
    try {
      const historyEntry = new RequestHistory({
        userId: req.body.userId || 'default-user',
        request: {
          protocol: request.protocol,
          method: request.method,
          endpoint: request.endpoint,
          headers: request.headers,
          body: request.body,
          query: request.query,
          variables: request.variables,
        },
        response: {
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body,
          error: response.error,
        },
        duration: response.duration,
        success: response.success,
        apiSpecId: apiSpecId || null,
        source: req.body.source || 'manual',
        timestamp: new Date(),
      });

      await historyEntry.save();
      logger.info(`Request saved to history: ${historyEntry._id}`);
    } catch (historyError) {
      logger.error('Failed to save request to history:', historyError);
      // Don't fail the request if history save fails
    }
  }

  // Return response with validation result if available
  return res.json(
    successResponse({
      statusCode: response.statusCode,
      headers: response.headers,
      body: response.body,
      duration: response.duration,
      error: response.error,
      validation: validationResult,
    }, 'Request executed successfully')
  );
});

/**
 * Execute a workflow
 * POST /api/execute/workflow
 */
export const executeWorkflow = asyncHandler(async (req, res) => {
  const { workflowId, workflow, userId = 'default-user' } = req.body;

  // Validate input - either workflowId or workflow object must be provided
  if (!workflowId && !workflow) {
    throw createError('INVALID_INPUT', 'Either workflowId or workflow object is required');
  }

  let workflowToExecute;

  // If workflowId is provided, fetch from database
  if (workflowId) {
    workflowToExecute = await Workflow.findById(workflowId);
    
    if (!workflowToExecute) {
      throw createError('NOT_FOUND', `Workflow with ID ${workflowId} not found`);
    }
  } else {
    // Use provided workflow object
    workflowToExecute = workflow;
  }

  // Validate workflow has steps
  if (!workflowToExecute.steps || workflowToExecute.steps.length === 0) {
    throw createError('INVALID_INPUT', 'Workflow must contain at least one step');
  }

  // Create workflow engine instance
  const engine = new WorkflowEngine();

  // Execute the workflow
  logger.info(`Executing workflow: ${workflowToExecute.name || workflowId || 'Unnamed'}`);
  const result = await engine.executeWorkflow(workflowToExecute, userId);

  // Return result
  return res.json(
    successResponse(result, 'Workflow executed successfully')
  );
});
