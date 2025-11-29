import RESTHandler from './RESTHandler.js';
import GraphQLHandler from './GraphQLHandler.js';
import gRPCHandler from './gRPCHandler.js';

/**
 * Get the appropriate protocol handler based on protocol type
 * @param {string} protocol - Protocol type ('rest', 'graphql', 'grpc')
 * @returns {ProtocolHandler} Protocol handler instance
 */
export function getProtocolHandler(protocol) {
  switch (protocol.toLowerCase()) {
    case 'rest':
      return new RESTHandler();
    case 'graphql':
      return new GraphQLHandler();
    case 'grpc':
      return new gRPCHandler();
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

export { RESTHandler, GraphQLHandler, gRPCHandler };
