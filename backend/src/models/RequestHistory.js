import mongoose from 'mongoose';

const requestHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'default-user',
  },
  request: {
    protocol: {
      type: String,
      required: true,
      enum: ['rest', 'graphql', 'grpc'],
    },
    method: { type: String },
    endpoint: {
      type: String,
      required: true,
    },
    headers: {
      type: Map,
      of: String,
    },
    body: { type: mongoose.Schema.Types.Mixed },
    query: { type: String },
    variables: { type: mongoose.Schema.Types.Mixed },
  },
  response: {
    statusCode: { type: Number },
    headers: {
      type: Map,
      of: String,
    },
    body: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
  },
  duration: {
    type: Number,
    required: true,
    description: 'Request duration in milliseconds',
  },
  success: {
    type: Boolean,
    required: true,
  },
  apiSpecId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APISpec',
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
  },
  source: {
    type: String,
    enum: ['natural-language', 'manual', 'workflow', 'test-suite'],
    default: 'manual',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: false, // Using custom timestamp field
});

// Indexes for efficient queries
requestHistorySchema.index({ userId: 1, timestamp: -1 });
requestHistorySchema.index({ apiSpecId: 1, timestamp: -1 });
requestHistorySchema.index({ 'request.protocol': 1 });
requestHistorySchema.index({ 'response.statusCode': 1 });
requestHistorySchema.index({ success: 1 });
requestHistorySchema.index({ timestamp: -1 });

// TTL index to automatically delete old history after 90 days
requestHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const RequestHistory = mongoose.model('RequestHistory', requestHistorySchema);

export default RequestHistory;
