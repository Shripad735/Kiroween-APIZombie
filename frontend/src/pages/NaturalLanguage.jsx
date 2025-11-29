import { useState } from 'react';
import { MessageSquare, Send, Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import APISpecManager from '../components/APISpecManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function NaturalLanguage() {
  const [input, setInput] = useState('');
  const [generatedRequest, setGeneratedRequest] = useState(null);
  const [response, setResponse] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setGenerating(true);
    setGeneratedRequest(null);
    setResponse(null);

    try {
      const payload = {
        input: input.trim(),
      };

      // Include API spec if selected
      if (selectedSpec) {
        payload.apiSpecId = selectedSpec.id;
      }

      const result = await axios.post(`${API_BASE_URL}/api/nl/parse`, payload);

      if (result.data.success) {
        setGeneratedRequest(result.data.data.request);
        toast.success('Request generated successfully!');
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to generate request';
      const suggestions = error.response?.data?.error?.suggestions;
      
      toast.error(errorMessage);
      
      if (suggestions && suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          toast(suggestion, { icon: '💡' });
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!generatedRequest) {
      toast.error('No request to execute');
      return;
    }

    setExecuting(true);
    setResponse(null);

    try {
      const payload = {
        request: generatedRequest,
        saveToHistory: true,
        source: 'natural-language',
      };

      // Include API spec if selected
      if (selectedSpec) {
        payload.apiSpecId = selectedSpec.id;
      }

      const result = await axios.post(`${API_BASE_URL}/api/execute`, payload);

      if (result.data.success) {
        setResponse(result.data.data);
        toast.success('Request executed successfully!');
      }
    } catch (error) {
      console.error('Execution error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to execute request';
      toast.error(errorMessage);
      
      // Set error response for display
      setResponse({
        success: false,
        error: errorMessage,
        statusCode: error.response?.status || 500,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyPress = (e) => {
    // Allow Ctrl+Enter or Cmd+Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const formatRequestForDisplay = (request) => {
    if (!request) return '';
    
    const formatted = {
      protocol: request.protocol,
      ...(request.method && { method: request.method }),
      endpoint: request.endpoint,
      ...(request.headers && Object.keys(request.headers).length > 0 && { headers: request.headers }),
      ...(request.body && { body: request.body }),
      ...(request.query && { query: request.query }),
      ...(request.variables && { variables: request.variables }),
    };

    return JSON.stringify(formatted, null, 2);
  };

  const formatResponseForDisplay = (response) => {
    if (!response) return '';
    
    const formatted = {
      statusCode: response.statusCode,
      success: response.success !== false,
      duration: response.duration ? `${response.duration}ms` : undefined,
      ...(response.headers && { headers: response.headers }),
      ...(response.body && { body: response.body }),
      ...(response.error && { error: response.error }),
      ...(response.validation && { validation: response.validation }),
    };

    return JSON.stringify(formatted, null, 2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-zombie-600 flex-shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Natural Language to API</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Describe your API request in plain English and let AI generate it for you
          </p>
        </div>
      </div>

      {/* API Spec Manager */}
      <APISpecManager 
        onSpecSelected={setSelectedSpec}
        selectedSpecId={selectedSpec?.id}
      />

      {/* Natural Language Input Panel */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Describe Your Request
        </h3>

        <div className="space-y-4">
          {/* Input Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Natural Language Description
              <span className="text-gray-500 font-normal ml-2">
                (Press Ctrl+Enter to generate)
              </span>
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Example: Get all users from the API&#10;Example: Create a new post with title 'Hello World' and body 'This is my first post'&#10;Example: Update user with id 123 to set their email to john@example.com"
              className="input min-h-[120px] font-mono text-sm"
              disabled={generating}
            />
          </div>

          {/* Selected Spec Info */}
          {selectedSpec && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>
                Using <span className="font-medium">{selectedSpec.name}</span> specification
              </span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !input.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Generating Request...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Generate Request</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Request Display */}
      {generatedRequest && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Generated API Request
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                generatedRequest.protocol === 'rest' ? 'bg-blue-100 text-blue-800' :
                generatedRequest.protocol === 'graphql' ? 'bg-pink-100 text-pink-800' :
                generatedRequest.protocol === 'grpc' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {generatedRequest.protocol?.toUpperCase()}
              </span>
              {generatedRequest.method && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  generatedRequest.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                  generatedRequest.method === 'POST' ? 'bg-green-100 text-green-800' :
                  generatedRequest.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  generatedRequest.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {generatedRequest.method}
                </span>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-4">
            {/* Endpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint
              </label>
              <div className="input bg-gray-50 font-mono text-sm">
                {generatedRequest.endpoint}
              </div>
            </div>

            {/* Monaco Editor for Full Request */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Request Details
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <Editor
                  height="300px"
                  defaultLanguage="json"
                  value={formatRequestForDisplay(generatedRequest)}
                  theme="vs-light"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    lineNumbers: 'on',
                    folding: true,
                  }}
                />
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecute}
              disabled={executing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Executing Request...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Execute Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              API Response
            </h3>
            <div className="flex items-center space-x-2">
              {response.success !== false ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Success</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Error</span>
                </>
              )}
              {response.statusCode && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  response.statusCode >= 200 && response.statusCode < 300 ? 'bg-green-100 text-green-800' :
                  response.statusCode >= 400 && response.statusCode < 500 ? 'bg-yellow-100 text-yellow-800' :
                  response.statusCode >= 500 ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {response.statusCode}
                </span>
              )}
              {response.duration && (
                <span className="text-xs font-medium text-gray-600">
                  {response.duration}ms
                </span>
              )}
            </div>
          </div>

          {/* Response Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Response Data
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="json"
                value={formatResponseForDisplay(response)}
                theme="vs-light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'on',
                  folding: true,
                }}
              />
            </div>
          </div>

          {/* Validation Results */}
          {response.validation && (
            <div className={`mt-4 p-4 rounded-lg ${
              response.validation.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {response.validation.success ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Response Validation Passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Response Validation Failed</span>
                  </>
                )}
              </div>
              {response.validation.errors && response.validation.errors.length > 0 && (
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {response.validation.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NaturalLanguage;
