import mongoose from 'mongoose';

const variableMappingSchema = new mongoose.Schema({
  sourceStep: {
    type: Number,
    required: true,
  },
  sourcePath: {
    type: String,
    required: true,
    description: 'JSONPath to extract data from source step response',
  },
  targetVariable: {
    type: String,
    required: true,
    description: 'Variable name to use in current step',
  },
}, { _id: false });

const assertionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['statusCode', 'responseTime', 'bodyContains', 'headerExists', 'jsonPath'],
    required: true,
  },
  expected: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  path: {
    type: String,
    description: 'JSONPath for jsonPath assertion type',
  },
}, { _id: false });

const workflowStepSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  apiRequest: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: 'Embedded API request configuration',
  },
  variableMappings: [variableMappingSchema],
  assertions: [assertionSchema],
  continueOnFailure: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  steps: [workflowStepSchema],
  tags: [{
    type: String,
    trim: true,
  }],
  userId: {
    type: String,
    default: 'default-user',
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
workflowSchema.index({ userId: 1, createdAt: -1 });
workflowSchema.index({ name: 1, userId: 1 });
workflowSchema.index({ tags: 1 });
workflowSchema.index({ isTemplate: 1 });

const Workflow = mongoose.model('Workflow', workflowSchema);

export default Workflow;
