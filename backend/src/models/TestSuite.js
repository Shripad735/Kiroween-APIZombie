import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  request: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: 'API request configuration',
  },
  expectedResponse: {
    statusCode: {
      type: Number,
      required: true,
    },
    schema: {
      type: mongoose.Schema.Types.Mixed,
      description: 'JSON Schema for response validation',
    },
    assertions: [{
      type: {
        type: String,
        enum: ['equals', 'contains', 'matches', 'exists', 'type', 'range', 'gte', 'lte', 'gt', 'lt', 'length'],
        required: true,
      },
      path: {
        type: String,
        description: 'JSONPath to the field being tested',
      },
      expected: {
        type: mongoose.Schema.Types.Mixed,
      },
    }],
  },
  category: {
    type: String,
    required: true,
    enum: ['success', 'error', 'edge', 'security', 'performance'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
}, { _id: true });

const testSuiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  apiSpecId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APISpec',
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  tests: [testCaseSchema],
  generatedBy: {
    type: String,
    enum: ['ai', 'manual', 'template'],
    default: 'ai',
  },
  userId: {
    type: String,
    default: 'default-user',
  },
  lastRunAt: {
    type: Date,
  },
  lastRunResults: {
    total: { type: Number },
    passed: { type: Number },
    failed: { type: Number },
    duration: { type: Number }, // milliseconds
  },
}, {
  timestamps: true,
});

// Indexes
testSuiteSchema.index({ userId: 1, createdAt: -1 });
testSuiteSchema.index({ apiSpecId: 1 });
testSuiteSchema.index({ endpoint: 1 });

const TestSuite = mongoose.model('TestSuite', testSuiteSchema);

export default TestSuite;
