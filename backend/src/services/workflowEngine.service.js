import { JSONPath } from 'jsonpath-plus';
import { getProtocolHandler } from '../handlers/index.js';
import { AuthConfig, RequestHistory } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * WorkflowEngine - Executes multi-step workflows with data passing between steps
 */
class WorkflowEngine {
  constructor() {
    this.executionState = {
      currentStep: 0,
      results: [],
      context: {},
    };
  }

  /**
   * Execute a complete workflow
   * @param {Object} workflow - Workflow object with steps
   * @param {string} userId - User ID for auth and history
   * @returns {Promise<Object>} Workflow execution result
   */
  async executeWorkflow(workflow, userId = 'default-user') {
    logger.info(`Starting workflow execution: ${workflow.name || 'Unnamed'}`);
    
    // Reset execution state
    this.executionState = {
      currentStep: 0,
      results: [],
      context: {},
      startTime: Date.now(),
    };

    const workflowResult = {
      workflowId: workflow._id,
      workflowName: workflow.name,
      success: true,
      steps: [],
      totalDuration: 0,
      error: null,
    };

    try {
      // Sort steps by order
      const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);

      // Execute each step sequentially
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        this.executionState.currentStep = i;

        logger.info(`Executing workflow step ${i + 1}/${sortedSteps.length}: ${step.name || 'Unnamed step'}`);

        try {
          // Resolve variables from previous steps
          const resolvedRequest = this.resolveVariables(step, this.executionState.context);

          // Get auth config if apiSpecId is present
          let authConfig = null;
          if (step.apiRequest.apiSpecId) {
            authConfig = await AuthConfig.findOne({
              apiSpecId: step.apiRequest.apiSpecId,
              userId,
            });
          }

          // Get the appropriate protocol handler
          const handler = getProtocolHandler(resolvedRequest.protocol);

          // Execute the request
          const stepStartTime = Date.now();
          const response = await handler.execute(resolvedRequest, authConfig);
          const stepDuration = Date.now() - stepStartTime;

          // Store step result
          const stepResult = {
            stepOrder: step.order,
            stepName: step.name,
            request: resolvedRequest,
            response: {
              statusCode: response.statusCode,
              headers: response.headers,
              body: response.body,
              error: response.error,
            },
            duration: stepDuration,
            success: response.success,
            assertions: [],
          };

          // Run assertions if defined
          if (step.assertions && step.assertions.length > 0) {
            stepResult.assertions = this.runAssertions(step.assertions, response, stepDuration);
            
            // Check if any assertions failed
            const assertionsFailed = stepResult.assertions.some(a => !a.passed);
            if (assertionsFailed) {
              stepResult.success = false;
            }
          }

          // Add to results
          this.executionState.results.push(stepResult);
          workflowResult.steps.push(stepResult);

          // Update context with response data for next steps
          this.executionState.context[`step${step.order}`] = response.body;

          // Save to history
          await this.saveStepToHistory(
            userId,
            workflow._id,
            resolvedRequest,
            response,
            stepDuration
          );

          // Check if step failed and should halt execution
          if (!response.success && !step.continueOnFailure) {
            logger.error(`Workflow step ${i + 1} failed, halting execution`);
            workflowResult.success = false;
            workflowResult.error = `Step ${step.order} failed: ${response.error || 'Unknown error'}`;
            break;
          }

          // Check if assertions failed and should halt
          if (stepResult.assertions.length > 0 && !stepResult.success && !step.continueOnFailure) {
            logger.error(`Workflow step ${i + 1} assertions failed, halting execution`);
            workflowResult.success = false;
            workflowResult.error = `Step ${step.order} assertions failed`;
            break;
          }

        } catch (stepError) {
          logger.error(`Error executing workflow step ${i + 1}:`, stepError);
          
          const stepResult = {
            stepOrder: step.order,
            stepName: step.name,
            request: step.apiRequest,
            response: {
              error: stepError.message,
            },
            duration: 0,
            success: false,
            assertions: [],
          };

          this.executionState.results.push(stepResult);
          workflowResult.steps.push(stepResult);

          // Halt execution on error unless continueOnFailure is true
          if (!step.continueOnFailure) {
            workflowResult.success = false;
            workflowResult.error = `Step ${step.order} error: ${stepError.message}`;
            break;
          }
        }
      }

      // Calculate total duration
      workflowResult.totalDuration = Date.now() - this.executionState.startTime;

      logger.info(`Workflow execution completed: ${workflowResult.success ? 'SUCCESS' : 'FAILED'}`);
      return workflowResult;

    } catch (error) {
      logger.error('Workflow execution error:', error);
      workflowResult.success = false;
      workflowResult.error = error.message;
      workflowResult.totalDuration = Date.now() - this.executionState.startTime;
      return workflowResult;
    }
  }

  /**
   * Resolve variables in a workflow step using data from previous steps
   * @param {Object} step - Workflow step with variableMappings
   * @param {Object} context - Execution context with previous step results
   * @returns {Object} Resolved API request
   */
  resolveVariables(step, context) {
    // Deep clone the request to avoid modifying the original
    const resolvedRequest = JSON.parse(JSON.stringify(step.apiRequest));

    // If no variable mappings, return as-is
    if (!step.variableMappings || step.variableMappings.length === 0) {
      return resolvedRequest;
    }

    // Build a map of variables to their values
    const variables = {};
    for (const mapping of step.variableMappings) {
      const sourceData = context[`step${mapping.sourceStep}`];
      
      if (!sourceData) {
        logger.warn(`Source step ${mapping.sourceStep} data not found in context`);
        continue;
      }

      // Extract data using JSONPath
      const extractedValue = this.extractResponseData(sourceData, mapping.sourcePath);
      variables[mapping.targetVariable] = extractedValue;
    }

    // Replace variables in the request
    const requestString = JSON.stringify(resolvedRequest);
    let resolvedString = requestString;

    // Replace {{variableName}} patterns
    for (const [varName, varValue] of Object.entries(variables)) {
      const pattern = new RegExp(`{{${varName}}}`, 'g');
      const replacement = typeof varValue === 'string' ? varValue : JSON.stringify(varValue);
      resolvedString = resolvedString.replace(pattern, replacement);
    }

    return JSON.parse(resolvedString);
  }

  /**
   * Extract data from a response using JSONPath
   * @param {Object} responseData - Response data object
   * @param {string} path - JSONPath expression
   * @returns {any} Extracted value
   */
  extractResponseData(responseData, path) {
    try {
      // Handle simple dot notation paths
      if (!path.startsWith('$') && !path.startsWith('[')) {
        path = `$.${path}`;
      }

      const result = JSONPath({ path, json: responseData, wrap: false });
      return result;
    } catch (error) {
      logger.error(`Error extracting data with path ${path}:`, error);
      return null;
    }
  }

  /**
   * Run assertions on a step response
   * @param {Array} assertions - Array of assertion objects
   * @param {Object} response - API response
   * @param {number} duration - Request duration in ms
   * @returns {Array} Assertion results
   */
  runAssertions(assertions, response, duration) {
    return assertions.map(assertion => {
      const result = {
        type: assertion.type,
        expected: assertion.expected,
        actual: null,
        passed: false,
        message: '',
      };

      try {
        switch (assertion.type) {
          case 'statusCode':
            result.actual = response.statusCode;
            result.passed = response.statusCode === assertion.expected;
            result.message = result.passed
              ? `Status code is ${assertion.expected}`
              : `Expected status ${assertion.expected}, got ${response.statusCode}`;
            break;

          case 'responseTime':
            result.actual = duration;
            result.passed = duration <= assertion.expected;
            result.message = result.passed
              ? `Response time ${duration}ms is within ${assertion.expected}ms`
              : `Response time ${duration}ms exceeds ${assertion.expected}ms`;
            break;

          case 'bodyContains':
            const bodyString = JSON.stringify(response.body);
            result.actual = bodyString;
            result.passed = bodyString.includes(assertion.expected);
            result.message = result.passed
              ? `Response body contains "${assertion.expected}"`
              : `Response body does not contain "${assertion.expected}"`;
            break;

          case 'headerExists':
            const headerExists = response.headers && response.headers[assertion.expected.toLowerCase()];
            result.actual = headerExists || null;
            result.passed = !!headerExists;
            result.message = result.passed
              ? `Header "${assertion.expected}" exists`
              : `Header "${assertion.expected}" not found`;
            break;

          case 'jsonPath':
            const extractedValue = this.extractResponseData(response.body, assertion.path);
            result.actual = extractedValue;
            result.passed = JSON.stringify(extractedValue) === JSON.stringify(assertion.expected);
            result.message = result.passed
              ? `JSONPath ${assertion.path} matches expected value`
              : `JSONPath ${assertion.path} value mismatch`;
            break;

          default:
            result.message = `Unknown assertion type: ${assertion.type}`;
        }
      } catch (error) {
        result.message = `Assertion error: ${error.message}`;
      }

      return result;
    });
  }

  /**
   * Save workflow step execution to request history
   * @param {string} userId - User ID
   * @param {string} workflowId - Workflow ID
   * @param {Object} request - API request
   * @param {Object} response - API response
   * @param {number} duration - Request duration
   */
  async saveStepToHistory(userId, workflowId, request, response, duration) {
    try {
      const historyEntry = new RequestHistory({
        userId,
        workflowId,
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
        duration,
        success: response.success,
        apiSpecId: request.apiSpecId || null,
        source: 'workflow',
        timestamp: new Date(),
      });

      await historyEntry.save();
      logger.debug(`Workflow step saved to history: ${historyEntry._id}`);
    } catch (error) {
      logger.error('Failed to save workflow step to history:', error);
      // Don't throw - history save failure shouldn't stop workflow
    }
  }

  /**
   * Get current execution state
   * @returns {Object} Current execution state
   */
  getExecutionState() {
    return { ...this.executionState };
  }
}

export default WorkflowEngine;
