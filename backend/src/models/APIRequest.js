import mongoose from 'mongoose';

const apiRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  protocol: {
    type: String,
    required: true,
    enum: ['rest', 'graphql', 'grpc'],
  },
  // REST specific fields
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  },
  endpoint: {
    type: String,
    required: true,
  },
  headers: {
    type: Map,
    of: String,
    default: {},
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
  },
  // GraphQL specific fields
  query: {
    type: String,
  },
  variables: {
    type: mongoose.Schema.Types.Mixed,
  },
  // gRPC specific fields
  service: {
    type: String,
  },
  rpcMethod: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  // Common fields
  apiSpecId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APISpec',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  userId: {
    type: String,
    default: 'default-user',
  },
}, {
  timestamps: true,
});

// Indexes
apiRequestSchema.index({ userId: 1, createdAt: -1 });
apiRequestSchema.index({ apiSpecId: 1 });
apiRequestSchema.index({ tags: 1 });
apiRequestSchema.index({ protocol: 1 });

const APIRequest = mongoose.model('APIRequest', apiRequestSchema);

export default APIRequest;
