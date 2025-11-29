import { useState } from 'react';
import { ArrowLeftRight, Loader2, AlertCircle, Info } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PROTOCOLS = [
  { value: 'rest', label: 'REST', color: 'blue' },
  { value: 'graphql', label: 'GraphQL', color: 'pink' },
  { value: 'grpc', label: 'gRPC', color: 'purple' },
];

const EXAMPLE_REQUESTS = {
  rest: `{
  "method": "GET",
  "endpoint": "/api/users/123",
  "headers": {
    "Authorization": "Bearer token123",
    "Content-Type": "application/json"
  }
}`,
  graphql: `{
  "query": "query GetUser($id: ID!) { user(id: $id) { id name email } }",
  "variables": {
    "id": "123"
  },
  "operationType": "query"
}`,
  grpc: `{
  "service": "UserService",
  "method": "GetUser",
  "message": {
    "id": "123"
  }
}`,
};

function ProtocolTranslator() {
  const [sourceProtocol, setSourceProtocol] = useState('rest');
  const [targetProtocol, setTargetProtocol] = useState('graphql');
  const [sourceRequest, setSourceRequest] = useState(EXAMPLE_REQUESTS.rest);
  const [translatedRequest, setTranslatedRequest] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(null);

  const handleSourceProtocolChange = (protocol) => {
    setSourceProtocol(protocol);
    setSourceRequest(EXAMPLE_REQUESTS[protocol]);
    setTranslatedRequest(null);
    setExplanation(null);
    setError(null);
    
    // Auto-adjust target protocol if same as source
    if (protocol === targetProtocol) {
      const otherProtocols = PROTOCOLS.filter(p => p.value !== protocol);
      setTargetProtocol(otherProtocols[0].value);
    }
  };

  const handleTargetProtocolChange = (protocol) => {
    setTargetProtocol(protocol);
    setTranslatedRequest(null);
    setExplanation(null);
    setError(null);
    
    // Auto-adjust source protocol if same as target
    if (protocol === sourceProtocol) {
      const otherProtocols = PROTOCOLS.filter(p => p.value !== protocol);
      setSourceProtocol(otherProtocols[0].value);
      setSourceRequest(EXAMPLE_REQUESTS[otherProtocols[0].value]);
    }
  };

  const handleTranslate = async () => {
    // Validate source request
    if (!sourceRequest.trim()) {
      toast.error('Please enter a source request');
      return;
    }

    // Parse source request
    let parsedRequest;
    try {
      parsedRequest = JSON.parse(sourceRequest);
    } catch (err) {
      toast.error('Invalid JSON in source request');
      return;
    }

    // Check if protocols are the same
    if (sourceProtocol === targetProtocol) {
      toast.error('Source and target protocols must be different');
      return;
    }

    setTranslating(true);
    setTranslatedRequest(null);
    setExplanation(null);
    setError(null);

    try {
      const payload = {
        sourceRequest: parsedRequest,
        sourceProtocol,
        targetProtocol,
      };

      const result = await axios.post(`${API_BASE_URL}/api/translate`, payload);

      if (result.data.success) {
        const { translated, explanation } = result.data.data;
        setTranslatedRequest(translated);
        setExplanation(explanation);
        toast.success('Translation completed successfully!');
      }
    } catch (err) {
      console.error('Translation error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to translate request';
      const suggestions = err.response?.data?.error?.suggestions;
      
      setError({
        message: errorMessage,
        suggestions: suggestions || [],
      });
      
      toast.error(errorMessage);
      
      if (suggestions && suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          toast(suggestion, { icon: '💡' });
        });
      }
    } finally {
      setTranslating(false);
    }
  };

  const formatRequestForDisplay = (request) => {
    if (!request) return '';
    return JSON.stringify(request, null, 2);
  };

  const getProtocolColor = (protocol) => {
    const protocolObj = PROTOCOLS.find(p => p.value === protocol);
    return protocolObj?.color || 'gray';
  };

  const getProtocolBadgeClass = (protocol) => {
    const color = getProtocolColor(protocol);
    return `bg-${color}-100 text-${color}-800`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <ArrowLeftRight className="w-8 h-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protocol Translator</h1>
          <p className="text-gray-600 mt-1">
            Convert API requests between REST, GraphQL, and gRPC
          </p>
        </div>
      </div>

      {/* Protocol Selection */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Select Protocols
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Source Protocol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Protocol
            </label>
            <select
              value={sourceProtocol}
              onChange={(e) => handleSourceProtocolChange(e.target.value)}
              className="input"
              disabled={translating}
            >
              {PROTOCOLS.map((protocol) => (
                <option key={protocol.value} value={protocol.value}>
                  {protocol.label}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow Icon */}
          <div className="flex justify-center items-end pb-2">
            <ArrowLeftRight className="w-8 h-8 text-orange-600" />
          </div>

          {/* Target Protocol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Protocol
            </label>
            <select
              value={targetProtocol}
              onChange={(e) => handleTargetProtocolChange(e.target.value)}
              className="input"
              disabled={translating}
            >
              {PROTOCOLS.map((protocol) => (
                <option key={protocol.value} value={protocol.value}>
                  {protocol.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info about gRPC */}
        {(sourceProtocol === 'grpc' || targetProtocol === 'grpc') && (
          <div className="mt-4 flex items-start space-x-2 text-sm text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">gRPC Translation Available</p>
              <p className="text-blue-700 mt-1">
                gRPC translation is supported! You can translate between REST, GraphQL, and gRPC protocols.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Source Request Input */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Source Request
          </h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            sourceProtocol === 'rest' ? 'bg-blue-100 text-blue-800' :
            sourceProtocol === 'graphql' ? 'bg-pink-100 text-pink-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {sourceProtocol.toUpperCase()}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your {sourceProtocol.toUpperCase()} request (JSON format)
          </label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <Editor
              height="300px"
              defaultLanguage="json"
              value={sourceRequest}
              onChange={(value) => setSourceRequest(value || '')}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                lineNumbers: 'on',
                folding: true,
                readOnly: translating,
              }}
            />
          </div>
        </div>

        {/* Translate Button */}
        <button
          onClick={handleTranslate}
          disabled={translating || !sourceRequest.trim()}
          className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {translating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-5 h-5" />
              <span>Translate to {targetProtocol.toUpperCase()}</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                Translation Failed
              </h3>
              <p className="text-red-800 mb-3">
                {error.message}
              </p>
              {error.suggestions && error.suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-900 mb-2">Suggestions:</p>
                  <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                    {error.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Translation Results - Side by Side */}
      {translatedRequest && (
        <div className="space-y-6">
          {/* Side-by-Side Comparison */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Translation Result
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Original Request */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Original ({sourceProtocol.toUpperCase()})
                  </label>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    sourceProtocol === 'rest' ? 'bg-blue-100 text-blue-800' :
                    sourceProtocol === 'graphql' ? 'bg-pink-100 text-pink-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {sourceProtocol.toUpperCase()}
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={sourceRequest}
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

              {/* Translated Request */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Translated ({targetProtocol.toUpperCase()})
                  </label>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    targetProtocol === 'rest' ? 'bg-blue-100 text-blue-800' :
                    targetProtocol === 'graphql' ? 'bg-pink-100 text-pink-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {targetProtocol.toUpperCase()}
                  </span>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="json"
                    value={formatRequestForDisplay(translatedRequest)}
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
            </div>
          </div>

          {/* Explanation */}
          {explanation && (
            <div className="card bg-blue-50 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    Translation Explanation
                  </h3>
                  <div className="text-blue-800 whitespace-pre-wrap">
                    {explanation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProtocolTranslator;
