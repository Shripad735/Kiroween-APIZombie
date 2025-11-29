import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Trash2, ChevronDown, ChevronUp, FileText, Database, Code } from 'lucide-react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { showSuccess, showError } from '../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function APISpecManager({ onSpecSelected, selectedSpecId }) {
  const { apiSpecs, loadApiSpecs, addApiSpec, removeApiSpec, showLoading, hideLoading } = useApp();
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedSpec, setExpandedSpec] = useState(null);
  
  // Upload form state
  const [uploadType, setUploadType] = useState('openapi'); // openapi, graphql, grpc
  const [uploadMethod, setUploadMethod] = useState('file'); // file or url (for GraphQL)
  const [specName, setSpecName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [graphqlUrl, setGraphqlUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Update selected spec when selectedSpecId changes
  useEffect(() => {
    if (selectedSpecId && apiSpecs.length > 0) {
      const spec = apiSpecs.find(s => s._id === selectedSpecId || s.id === selectedSpecId);
      if (spec) {
        loadSpecDetails(spec._id || spec.id);
      }
    }
  }, [selectedSpecId, apiSpecs]);

  const loadSpecDetails = async (specId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/specs/${specId}`);
      if (response.data.success) {
        setSelectedSpec(response.data.data);
        if (onSpecSelected) {
          onSpecSelected(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load spec details:', error);
      showError('Failed to load specification details');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!specName || !baseUrl) {
      showError('Please provide a name and base URL');
      return;
    }

    if (uploadMethod === 'file' && !selectedFile) {
      showError('Please select a file');
      return;
    }

    if (uploadMethod === 'url' && !graphqlUrl) {
      showError('Please provide a GraphQL URL');
      return;
    }

    setUploading(true);
    showLoading('Uploading specification...');

    try {
      if (uploadMethod === 'url' && uploadType === 'graphql') {
        // GraphQL introspection
        const response = await axios.post(`${API_BASE_URL}/api/specs/introspect`, {
          name: specName,
          url: graphqlUrl,
        });

        if (response.data.success) {
          showSuccess('GraphQL schema introspected successfully!');
          addApiSpec(response.data.data);
          resetForm();
        }
      } else {
        // File upload
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            let fileContent = event.target.result;
            
            // For OpenAPI/GraphQL, try to parse as JSON first
            // If it fails, send as string (could be YAML)
            if (uploadType === 'openapi' || uploadType === 'graphql') {
              try {
                // Try parsing as JSON
                const parsed = JSON.parse(fileContent);
                fileContent = parsed; // Use parsed JSON object
              } catch (jsonError) {
                // Not JSON, keep as string (likely YAML)
                // Backend will handle YAML parsing
                console.log('File is not JSON, sending as string (likely YAML)');
              }
            }

            const response = await axios.post(`${API_BASE_URL}/api/specs/upload`, {
              name: specName,
              type: uploadType,
              baseUrl: baseUrl,
              fileContent: fileContent,
            });

            if (response.data.success) {
              showSuccess(`${uploadType.toUpperCase()} specification uploaded successfully!`);
              addApiSpec(response.data.data);
              resetForm();
            }
          } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.error?.message || 'Failed to upload specification';
            showError(errorMessage);
          } finally {
            setUploading(false);
            hideLoading();
          }
        };

        reader.onerror = () => {
          showError('Failed to read file');
          setUploading(false);
          hideLoading();
        };

        reader.readAsText(selectedFile);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to upload specification';
      showError(errorMessage);
      setUploading(false);
      hideLoading();
    }
  };

  const handleDelete = async (specId, specName) => {
    if (!confirm(`Are you sure you want to delete "${specName}"?`)) {
      return;
    }

    showLoading('Deleting specification...');
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/specs/${specId}`);
      if (response.data.success) {
        showSuccess('Specification deleted successfully');
        removeApiSpec(specId);
        const currentSpecId = selectedSpec?._id || selectedSpec?.id;
        if (currentSpecId === specId) {
          setSelectedSpec(null);
          if (onSpecSelected) {
            onSpecSelected(null);
          }
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete specification');
    } finally {
      hideLoading();
    }
  };

  const resetForm = () => {
    setSpecName('');
    setBaseUrl('');
    setGraphqlUrl('');
    setSelectedFile(null);
    setUploadType('openapi');
    setUploadMethod('file');
  };

  const toggleExpandSpec = (specId) => {
    if (expandedSpec === specId) {
      setExpandedSpec(null);
    } else {
      setExpandedSpec(specId);
      loadSpecDetails(specId);
    }
  };

  const getSpecIcon = (type) => {
    switch (type) {
      case 'openapi':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'graphql':
        return <Database className="w-5 h-5 text-pink-600" />;
      case 'grpc':
        return <Code className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
          Upload API Specification
        </h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Spec Type Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Specification Type
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setUploadType('openapi');
                  setUploadMethod('file');
                }}
                className={`p-2 sm:p-3 border-2 rounded-lg transition-colors touch-manipulation ${
                  uploadType === 'openapi'
                    ? 'border-zombie-600 bg-zombie-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium">OpenAPI</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('graphql')}
                className={`p-2 sm:p-3 border-2 rounded-lg transition-colors touch-manipulation ${
                  uploadType === 'graphql'
                    ? 'border-zombie-600 bg-zombie-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Database className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-pink-600" />
                <span className="text-xs sm:text-sm font-medium">GraphQL</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadType('grpc');
                  setUploadMethod('file');
                }}
                className={`p-2 sm:p-3 border-2 rounded-lg transition-colors touch-manipulation ${
                  uploadType === 'grpc'
                    ? 'border-zombie-600 bg-zombie-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Code className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 text-purple-600" />
                <span className="text-xs sm:text-sm font-medium">gRPC</span>
              </button>
            </div>
          </div>

          {/* GraphQL Method Selection */}
          {uploadType === 'graphql' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Upload Method
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setUploadMethod('file')}
                  className={`p-2 border-2 rounded-lg transition-colors touch-manipulation ${
                    uploadMethod === 'file'
                      ? 'border-zombie-600 bg-zombie-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                  <span className="text-xs sm:text-sm font-medium">Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod('url')}
                  className={`p-2 border-2 rounded-lg transition-colors touch-manipulation ${
                    uploadMethod === 'url'
                      ? 'border-zombie-600 bg-zombie-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1" />
                  <span className="text-xs sm:text-sm font-medium">Introspect URL</span>
                </button>
              </div>
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Specification Name
            </label>
            <input
              type="text"
              value={specName}
              onChange={(e) => setSpecName(e.target.value)}
              placeholder="e.g., My API v1"
              className="input text-sm sm:text-base"
              required
            />
          </div>

          {/* Base URL or GraphQL URL */}
          {uploadMethod === 'url' && uploadType === 'graphql' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GraphQL Endpoint URL
              </label>
              <input
                type="url"
                value={graphqlUrl}
                onChange={(e) => setGraphqlUrl(e.target.value)}
                placeholder="https://api.example.com/graphql"
                className="input"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="input"
                required
              />
            </div>
          )}

          {/* File Upload */}
          {uploadMethod === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {uploadType === 'openapi' && 'OpenAPI/Swagger File (JSON/YAML)'}
                {uploadType === 'graphql' && 'GraphQL Schema File'}
                {uploadType === 'grpc' && 'gRPC Proto File'}
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex-1 cursor-pointer">
                  <div className="input flex items-center justify-between">
                    <span className="text-gray-500">
                      {selectedFile ? selectedFile.name : 'Choose file...'}
                    </span>
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      uploadType === 'openapi'
                        ? '.json,.yaml,.yml'
                        : uploadType === 'graphql'
                        ? '.graphql,.gql,.json'
                        : '.proto'
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {uploading ? 'Uploading...' : 'Upload Specification'}
          </button>
        </form>
      </div>

      {/* Specs List */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
          Loaded API Specifications
        </h3>

        {apiSpecs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm sm:text-base">No API specifications loaded yet.</p>
            <p className="text-xs sm:text-sm">Upload one above to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiSpecs.map((spec) => {
              const specId = spec._id || spec.id;
              return (
              <div
                key={specId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="p-3 sm:p-4 bg-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    {getSpecIcon(spec.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">{spec.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {spec.type.toUpperCase()} • {spec.endpointCount || 0} endpoints
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <button
                      onClick={() => toggleExpandSpec(specId)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
                      title="View details"
                    >
                      {expandedSpec === specId ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(specId, spec.name)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSpec === specId && selectedSpec && (
                  <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                    <div className="mb-3">
                      <p className="text-xs sm:text-sm text-gray-600 break-all">
                        <span className="font-medium">Base URL:</span> {selectedSpec.baseUrl}
                      </p>
                    </div>

                    <h5 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Endpoints:</h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedSpec.endpoints && selectedSpec.endpoints.length > 0 ? (
                        selectedSpec.endpoints.map((endpoint, idx) => (
                          <div
                            key={idx}
                            className="p-2 sm:p-3 bg-gray-50 rounded border border-gray-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                  {endpoint.method && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                                      endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                      endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                                      endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {endpoint.method}
                                    </span>
                                  )}
                                  {endpoint.operationType && (
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-pink-100 text-pink-800 flex-shrink-0">
                                      {endpoint.operationType}
                                    </span>
                                  )}
                                  <code className="text-xs sm:text-sm text-gray-800 break-all">{endpoint.path}</code>
                                </div>
                                {endpoint.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {endpoint.description}
                                  </p>
                                )}
                                {endpoint.parameters && endpoint.parameters.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Parameters: {endpoint.parameters.length}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500">No endpoints found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Spec Selection Dropdown (for use in other components) */}
      {apiSpecs.length > 0 && (
        <div className="card">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Select Active Specification
          </label>
          <select
            value={selectedSpec?._id || selectedSpec?.id || ''}
            onChange={(e) => {
              const specId = e.target.value;
              if (specId) {
                loadSpecDetails(specId);
              } else {
                setSelectedSpec(null);
                if (onSpecSelected) {
                  onSpecSelected(null);
                }
              }
            }}
            className="input text-sm sm:text-base"
          >
            <option value="">-- Select a specification --</option>
            {apiSpecs.map((spec) => {
              const specId = spec._id || spec.id;
              return (
                <option key={specId} value={specId}>
                  {spec.name} ({spec.type.toUpperCase()})
                </option>
              );
            })}
          </select>
        </div>
      )}
    </div>
  );
}

export default APISpecManager;
