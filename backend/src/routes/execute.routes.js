import express from 'express';
import { executeRequest, executeWorkflow } from '../controllers/execute.controller.js';

const router = express.Router();

/**
 * POST /api/execute
 * Execute an API request using the appropriate protocol handler
 * 
 * Request body:
 * {
 *   request: {
 *     protocol: 'rest' | 'graphql' | 'grpc',
 *     endpoint: string,
 *     method?: string (for REST),
 *     headers?: object,
 *     body?: any,
 *     query?: string (for GraphQL),
 *     variables?: object (for GraphQL),
 *     service?: string (for gRPC),
 *     rpcMethod?: string (for gRPC),
 *     metadata?: object (for gRPC)
 *   },
 *   apiSpecId?: string,
 *   userId?: string,
 *   saveToHistory?: boolean,
 *   source?: string
 * }
 */
router.post('/', executeRequest);

/**
 * POST /api/execute/workflow
 * Execute a multi-step workflow
 * 
 * Request body:
 * {
 *   workflowId?: string (ID of saved workflow),
 *   workflow?: object (inline workflow definition),
 *   userId?: string
 * }
 */
router.post('/workflow', executeWorkflow);

export default router;
