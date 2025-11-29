import { useState, useEffect } from 'react';
import { Bookmark, Search, Download, Upload, Loader2, Trash2, Play, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function SavedItems() {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    } else {
      fetchWorkflows();
    }
  }, [activeTab, searchTerm, protocolFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (protocolFilter) params.protocol = protocolFilter;

      const response = await axios.get(`${API_BASE_URL}/api/saved/requests`, { params });
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch saved requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_BASE_URL}/api/saved/workflows`, { params });
      if (response.data.success) {
        setWorkflows(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to fetch saved workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/saved/export`, {
        type: 'all',
      });

      if (response.data.success) {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `apizombie-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Items exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting items:', error);
      toast.error('Failed to export items');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await axios.post(`${API_BASE_URL}/api/saved/import`, { data });

      if (response.data.success) {
        const results = response.data.data;
        toast.success(
          `Imported ${results.requests.imported} requests and ${results.workflows.imported} workflows`
        );
        if (activeTab === 'requests') {
          fetchRequests();
        } else {
          fetchWorkflows();
        }
      }
    } catch (error) {
      console.error('Error importing items:', error);
      toast.error('Failed to import items. Please check the file format.');
    }
    event.target.value = '';
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getProtocolBadgeColor = (protocol) => {
    switch (protocol?.toLowerCase()) {
      case 'rest':
        return 'bg-blue-100 text-blue-800';
      case 'graphql':
        return 'bg-pink-100 text-pink-800';
      case 'grpc':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodBadgeColor = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-800';
      case 'POST':
        return 'bg-green-100 text-green-800';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bookmark className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Items</h1>
            <p className="text-gray-600 mt-1">
              Manage your saved API requests and workflows
            </p>
          </div>
        </div>

        {/* Export/Import Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Saved Requests
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'workflows'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Saved Workflows
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {activeTab === 'requests' && (
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={protocolFilter}
                onChange={(e) => setProtocolFilter(e.target.value)}
                className="input w-40"
              >
                <option value="">All Protocols</option>
                <option value="rest">REST</option>
                <option value="graphql">GraphQL</option>
                <option value="grpc">gRPC</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'requests' ? (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="card">
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No Saved Requests
                    </h3>
                    <p className="text-gray-500">
                      Save requests from the Natural Language page to see them here
                    </p>
                  </div>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request._id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.name || 'Unnamed Request'}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getProtocolBadgeColor(request.protocol)}`}>
                            {request.protocol?.toUpperCase()}
                          </span>
                          {request.method && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getMethodBadgeColor(request.method)}`}>
                              {request.method}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 font-mono">
                          {request.endpoint}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-500 mb-2">
                            {request.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          Saved {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.length === 0 ? (
                <div className="card">
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No Saved Workflows
                    </h3>
                    <p className="text-gray-500">
                      Save workflows from the Workflow Builder to see them here
                    </p>
                  </div>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div key={workflow._id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {workflow.name}
                        </h3>
                        {workflow.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {workflow.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{workflow.steps?.length || 0} steps</span>
                          <span>Saved {formatDate(workflow.createdAt)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewDetails(workflow)}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem.name || 'Details'}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <Editor
                height="500px"
                defaultLanguage="json"
                value={JSON.stringify(selectedItem, null, 2)}
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
      )}
    </div>
  );
}

export default SavedItems;
