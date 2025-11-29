import { useState, useEffect } from 'react';
import { Workflow, Plus, Play, Save, Trash2, GripVertical, Loader2, CheckCircle, XCircle, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function WorkflowBuilder() {
  // Workflow state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  
  // Execution state
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedStep, setExpandedStep] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  
  // Available API specs for selection
  const [availableSpecs, setAvailableSpecs] = useState([]);

  useEffect(() => {
    loadSavedWorkflows();
    loadAvailableSpecs();
  }, []);

  const loadSavedWorkflows = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/saved/workflows`);
      if (response.data.success) {
        setSavedWorkflows(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toast.error('Failed to load saved workflows');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSpecs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/specs`);
      if (response.data.success) {
        setAvailableSpecs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load specs:', error);
    }
  };

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      order: steps.length,
      name: `Step ${steps.length + 1}`,
      apiRequest: {
        protocol: 'rest',
        method: 'GET',
        endpoint: '',
        headers: {},
        body: null,
      },
      variableMappings: [],
      assertions: [],
    };
    setSteps([...steps, newStep]);
    setEditingStep(newStep.id);
  };

  const removeStep = (stepId) => {
    const updatedSteps = steps
      .filter(s => s.id !== stepId)
      .map((s, idx) => ({ ...s, order: idx }));
    setSteps(updatedSteps);
    if (editingStep === stepId) {
      setEditingStep(null);
    }
  };

  const updateStep = (stepId, updates) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const moveStep = (stepId, direction) => {
    const index = steps.findIndex(s => s.id === stepId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Update order numbers
    newSteps.forEach((step, idx) => {
      step.order = idx;
    });
    
    setSteps(newSteps);
  };

  const addVariableMapping = (stepId) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const newMapping = {
      sourceStep: step.order > 0 ? step.order - 1 : 0,
      sourcePath: '$.data',
      targetVariable: 'variable1',
    };

    updateStep(stepId, {
      variableMappings: [...step.variableMappings, newMapping],
    });
  };

  const updateVariableMapping = (stepId, mappingIndex, updates) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const updatedMappings = step.variableMappings.map((mapping, idx) =>
      idx === mappingIndex ? { ...mapping, ...updates } : mapping
    );

    updateStep(stepId, { variableMappings: updatedMappings });
  };

  const removeVariableMapping = (stepId, mappingIndex) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    const updatedMappings = step.variableMappings.filter((_, idx) => idx !== mappingIndex);
    updateStep(stepId, { variableMappings: updatedMappings });
  };

  const executeWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error('Please provide a workflow name');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const workflow = {
        name: workflowName,
        description: workflowDescription,
        steps: steps.map(step => ({
          order: step.order,
          name: step.name,
          apiRequest: step.apiRequest,
          variableMappings: step.variableMappings,
          assertions: step.assertions,
        })),
      };

      const response = await axios.post(`${API_BASE_URL}/api/execute/workflow`, {
        workflow,
        userId: 'default-user',
      });

      if (response.data.success) {
        setExecutionResult(response.data.data);
        toast.success('Workflow executed successfully!');
      } else {
        toast.error('Workflow execution failed');
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to execute workflow';
      toast.error(errorMessage);
      
      setExecutionResult({
        success: false,
        error: errorMessage,
        steps: [],
      });
    } finally {
      setExecuting(false);
    }
  };

  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      toast.error('Please provide a workflow name');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one step');
      return;
    }

    setSaving(true);

    try {
      const workflow = {
        name: workflowName,
        description: workflowDescription,
        steps: steps.map(step => ({
          order: step.order,
          name: step.name,
          apiRequest: step.apiRequest,
          variableMappings: step.variableMappings,
          assertions: step.assertions,
        })),
        userId: 'default-user',
      };

      const response = await axios.post(`${API_BASE_URL}/api/saved/workflows`, workflow);

      if (response.data.success) {
        toast.success('Workflow saved successfully!');
        loadSavedWorkflows();
      }
    } catch (error) {
      console.error('Save workflow error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save workflow';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const loadWorkflow = (workflow) => {
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setSteps(workflow.steps.map((step, idx) => ({
      ...step,
      id: Date.now() + idx,
    })));
    setExecutionResult(null);
    toast.success(`Loaded workflow: ${workflow.name}`);
  };

  const clearWorkflow = () => {
    if (steps.length > 0 && !confirm('Clear current workflow?')) {
      return;
    }
    setWorkflowName('');
    setWorkflowDescription('');
    setSteps([]);
    setExecutionResult(null);
    setEditingStep(null);
  };

  const formatRequestForDisplay = (request) => {
    if (!request) return '';
    return JSON.stringify(request, null, 2);
  };

  const formatResponseForDisplay = (response) => {
    if (!response) return '';
    return JSON.stringify(response, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Workflow className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Workflow Builder</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Chain multiple API calls together across different protocols
            </p>
          </div>
        </div>
        <button
          onClick={clearWorkflow}
          className="btn-secondary text-sm sm:text-base whitespace-nowrap"
        >
          New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Workflow Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow Info */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Workflow Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="e.g., User Registration Flow"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe what this workflow does..."
                  className="input min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Workflow Steps ({steps.length})
              </h3>
              <button
                onClick={addStep}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">No steps added yet</p>
                <p className="text-sm text-gray-500">Click "Add Step" to create your first API call</p>
              </div>
            ) : (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={index}
                    totalSteps={steps.length}
                    isExpanded={expandedStep === step.id}
                    isEditing={editingStep === step.id}
                    availableSpecs={availableSpecs}
                    executionResult={executionResult?.steps?.find(s => s.stepOrder === step.order)}
                    onToggleExpand={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    onEdit={() => setEditingStep(step.id)}
                    onUpdate={(updates) => updateStep(step.id, updates)}
                    onRemove={() => removeStep(step.id)}
                    onMoveUp={() => moveStep(step.id, 'up')}
                    onMoveDown={() => moveStep(step.id, 'down')}
                    onAddVariableMapping={() => addVariableMapping(step.id)}
                    onUpdateVariableMapping={(idx, updates) => updateVariableMapping(step.id, idx, updates)}
                    onRemoveVariableMapping={(idx) => removeVariableMapping(step.id, idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {steps.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={executeWorkflow}
                disabled={executing}
                className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Execute Workflow</span>
                  </>
                )}
              </button>
              <button
                onClick={saveWorkflow}
                disabled={saving}
                className="btn-secondary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Save Workflow</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Execution Results */}
          {executionResult && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Execution Results
                </h3>
                <div className="flex items-center space-x-2">
                  {executionResult.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Success</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Failed</span>
                    </>
                  )}
                  <span className="text-xs font-medium text-gray-600">
                    {executionResult.totalDuration}ms
                  </span>
                </div>
              </div>

              {executionResult.error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{executionResult.error}</p>
                </div>
              )}

              <div className="space-y-3">
                {executionResult.steps?.map((stepResult, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      stepResult.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {stepResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {stepResult.stepName || `Step ${stepResult.stepOrder + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {stepResult.response?.statusCode && (
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            stepResult.response.statusCode >= 200 && stepResult.response.statusCode < 300
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {stepResult.response.statusCode}
                          </span>
                        )}
                        <span className="text-xs text-gray-600">{stepResult.duration}ms</span>
                      </div>
                    </div>

                    {stepResult.response?.error && (
                      <p className="text-sm text-red-800 mb-2">{stepResult.response.error}</p>
                    )}

                    {stepResult.response?.body && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                          View Response
                        </summary>
                        <div className="mt-2 border border-gray-300 rounded overflow-hidden">
                          <Editor
                            height="200px"
                            defaultLanguage="json"
                            value={formatResponseForDisplay(stepResult.response)}
                            theme="vs-light"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </details>
                    )}

                    {stepResult.assertions && stepResult.assertions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-700">Assertions:</p>
                        {stepResult.assertions.map((assertion, aIdx) => (
                          <div
                            key={aIdx}
                            className={`text-xs p-2 rounded ${
                              assertion.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {assertion.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Saved Workflows */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Saved Workflows
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
              </div>
            ) : savedWorkflows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No saved workflows yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {savedWorkflows.map((workflow) => (
                  <div
                    key={workflow._id}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => loadWorkflow(workflow)}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{workflow.name}</h4>
                    {workflow.description && (
                      <p className="text-xs text-gray-600 mb-2">{workflow.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{workflow.steps?.length || 0} steps</span>
                      <span>{new Date(workflow.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// StepCard Component
function StepCard({
  step,
  index,
  totalSteps,
  isExpanded,
  isEditing,
  availableSpecs,
  executionResult,
  onToggleExpand,
  onEdit,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onAddVariableMapping,
  onUpdateVariableMapping,
  onRemoveVariableMapping,
}) {
  const updateRequest = (field, value) => {
    onUpdate({
      apiRequest: {
        ...step.apiRequest,
        [field]: value,
      },
    });
  };

  const updateRequestHeaders = (headersString) => {
    try {
      const headers = JSON.parse(headersString);
      updateRequest('headers', headers);
    } catch (error) {
      // Invalid JSON, don't update
    }
  };

  const updateRequestBody = (bodyString) => {
    try {
      const body = JSON.parse(bodyString);
      updateRequest('body', body);
    } catch (error) {
      // Invalid JSON, don't update
    }
  };

  return (
    <div className={`border-2 rounded-lg ${
      executionResult
        ? executionResult.success
          ? 'border-green-300 bg-green-50'
          : 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-white'
    }`}>
      {/* Step Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex flex-col space-y-1">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalSteps - 1}
              className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
              {index + 1}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={step.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="input py-1 px-2 text-sm"
                placeholder="Step name"
              />
            ) : (
              <span className="font-medium text-gray-900">{step.name}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              step.apiRequest.protocol === 'rest' ? 'bg-blue-100 text-blue-800' :
              step.apiRequest.protocol === 'graphql' ? 'bg-pink-100 text-pink-800' :
              step.apiRequest.protocol === 'grpc' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {step.apiRequest.protocol?.toUpperCase()}
            </span>
            {step.apiRequest.method && (
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                step.apiRequest.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                step.apiRequest.method === 'POST' ? 'bg-green-100 text-green-800' :
                step.apiRequest.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                step.apiRequest.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {step.apiRequest.method}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {executionResult && (
            <span className="text-xs text-gray-600">{executionResult.duration}ms</span>
          )}
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-200 rounded"
            title="Edit step"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleExpand}
            className="p-2 hover:bg-gray-200 rounded"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onRemove}
            className="p-2 hover:bg-red-100 rounded text-red-600"
            title="Remove step"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Details (Expanded) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white space-y-4">
          {/* Protocol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Protocol
            </label>
            <select
              value={step.apiRequest.protocol}
              onChange={(e) => updateRequest('protocol', e.target.value)}
              className="input text-sm"
            >
              <option value="rest">REST</option>
              <option value="graphql">GraphQL</option>
              <option value="grpc">gRPC</option>
            </select>
          </div>

          {/* REST-specific fields */}
          {step.apiRequest.protocol === 'rest' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Method
                </label>
                <select
                  value={step.apiRequest.method || 'GET'}
                  onChange={(e) => updateRequest('method', e.target.value)}
                  className="input text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={step.apiRequest.endpoint}
                  onChange={(e) => updateRequest('endpoint', e.target.value)}
                  placeholder="https://api.example.com/users"
                  className="input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headers (JSON)
                </label>
                <textarea
                  value={JSON.stringify(step.apiRequest.headers || {}, null, 2)}
                  onChange={(e) => updateRequestHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  className="input text-sm font-mono min-h-[80px]"
                />
              </div>

              {(step.apiRequest.method === 'POST' || 
                step.apiRequest.method === 'PUT' || 
                step.apiRequest.method === 'PATCH') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Body (JSON)
                  </label>
                  <textarea
                    value={JSON.stringify(step.apiRequest.body || {}, null, 2)}
                    onChange={(e) => updateRequestBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="input text-sm font-mono min-h-[120px]"
                  />
                </div>
              )}
            </>
          )}

          {/* GraphQL-specific fields */}
          {step.apiRequest.protocol === 'graphql' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GraphQL Endpoint
                </label>
                <input
                  type="text"
                  value={step.apiRequest.endpoint}
                  onChange={(e) => updateRequest('endpoint', e.target.value)}
                  placeholder="https://api.example.com/graphql"
                  className="input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Query/Mutation
                </label>
                <textarea
                  value={step.apiRequest.query || ''}
                  onChange={(e) => updateRequest('query', e.target.value)}
                  placeholder="query { users { id name } }"
                  className="input text-sm font-mono min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variables (JSON)
                </label>
                <textarea
                  value={JSON.stringify(step.apiRequest.variables || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const variables = JSON.parse(e.target.value);
                      updateRequest('variables', variables);
                    } catch (error) {
                      // Invalid JSON
                    }
                  }}
                  placeholder='{"userId": 123}'
                  className="input text-sm font-mono min-h-[80px]"
                />
              </div>
            </>
          )}

          {/* gRPC-specific fields */}
          {step.apiRequest.protocol === 'grpc' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  gRPC Service URL
                </label>
                <input
                  type="text"
                  value={step.apiRequest.endpoint}
                  onChange={(e) => updateRequest('endpoint', e.target.value)}
                  placeholder="localhost:50051"
                  className="input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Method
                </label>
                <input
                  type="text"
                  value={step.apiRequest.method || ''}
                  onChange={(e) => updateRequest('method', e.target.value)}
                  placeholder="UserService.GetUser"
                  className="input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Data (JSON)
                </label>
                <textarea
                  value={JSON.stringify(step.apiRequest.body || {}, null, 2)}
                  onChange={(e) => updateRequestBody(e.target.value)}
                  placeholder='{"userId": 123}'
                  className="input text-sm font-mono min-h-[80px]"
                />
              </div>
            </>
          )}

          {/* Variable Mappings */}
          {index > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Variable Mappings
                  <span className="text-xs text-gray-500 ml-2">
                    (Extract data from previous steps)
                  </span>
                </label>
                <button
                  onClick={onAddVariableMapping}
                  className="text-xs btn-secondary py-1 px-2"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add Mapping
                </button>
              </div>

              {step.variableMappings.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No variable mappings. Add one to use data from previous steps.
                </p>
              ) : (
                <div className="space-y-2">
                  {step.variableMappings.map((mapping, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Source Step
                          </label>
                          <select
                            value={mapping.sourceStep}
                            onChange={(e) =>
                              onUpdateVariableMapping(idx, {
                                sourceStep: parseInt(e.target.value),
                              })
                            }
                            className="input text-xs py-1"
                          >
                            {Array.from({ length: index }, (_, i) => (
                              <option key={i} value={i}>
                                Step {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            JSONPath
                          </label>
                          <input
                            type="text"
                            value={mapping.sourcePath}
                            onChange={(e) =>
                              onUpdateVariableMapping(idx, {
                                sourcePath: e.target.value,
                              })
                            }
                            placeholder="$.data.id"
                            className="input text-xs py-1 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Variable Name
                          </label>
                          <input
                            type="text"
                            value={mapping.targetVariable}
                            onChange={(e) =>
                              onUpdateVariableMapping(idx, {
                                targetVariable: e.target.value,
                              })
                            }
                            placeholder="userId"
                            className="input text-xs py-1 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          Use in request as: <code className="bg-gray-200 px-1 rounded">
                            {`{{${mapping.targetVariable}}}`}
                          </code>
                        </p>
                        <button
                          onClick={() => onRemoveVariableMapping(idx)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkflowBuilder;
