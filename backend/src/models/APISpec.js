import mongoose from 'mongoose';

const endpointSchema = new mongoose.Schema({
  path: { type: String, required: true },
  method: { type: String }, // For REST: GET, POST, etc.
  operationType: { type: String }, // For GraphQL: query, mutation, subscription
  description: { type: String },
  parameters: [{ type: mongoose.Schema.Types.Mixed }],
  requestBody: { type: mongoose.Schema.Types.Mixed },
  responses: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const apiSpecSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['openapi', 'graphql', 'grpc'],
  },
  baseUrl: {
    type: String,
    required: true,
  },
  specification: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  endpoints: [endpointSchema],
  authentication: {
    type: {
      type: String,
      enum: ['none', 'apikey', 'bearer', 'basic', 'oauth2'],
      default: 'none',
    },
    config: { type: mongoose.Schema.Types.Mixed },
  },
  userId: {
    type: String,
    default: 'default-user', // For now, we'll use a default user
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
apiSpecSchema.index({ userId: 1, createdAt: -1 });
apiSpecSchema.index({ name: 1, userId: 1 });
apiSpecSchema.index({ type: 1 });

const APISpec = mongoose.model('APISpec', apiSpecSchema);

export default APISpec;
