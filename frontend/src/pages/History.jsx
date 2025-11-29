import { useState, useEffect } from 'react';
import { Clock, Filter, Trash2, Play, Loader2, CheckCircle, XCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    protocol: '',
    statusCode: '',
    success: '',
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchHistory();
  }, [filters, pagination.page]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.protocol) params.protocol = filters.protocol;
      if (filters.statusCode) params.statusCode = filters.statusCode;
      if (filters.success) params.success = filters.success;

      const response = await axios.get(`${API_BASE_URL}/api/history`, { params });
      if (response.data.success) {
        setHistory(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch request history');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/history`);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchHistory();
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleReExecute = async (entry) => {
    setExecuting(entry._id);
    try {
      const payload = {
        request: entry.request,
        saveToHistory: true,
        source: 're-execution',
      };

      const response = await axios.post(`${API_BASE_URL}/api/execute`, payload);
      if (response.data.success) {
        toast.success('Request re-executed successfully!');
        fetchHistory();
      }
    } catch (error) {
      console.error('Error re-executing request:', error);
      toast.error('Failed to re-execute request');
    } finally {
      setExecuting(null);
    }
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      protocol: '',
      statusCode: '',
      success: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
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

  const getStatusBadgeColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800';
    if (statusCode >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 flex-shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Request History</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              View and analyze your API request history
            </p>
          </div>
        </div>

        {/* Clear History Button */}
        <button
          onClick={handleClearHistory}
          className="btn-secondary flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 text-sm sm:text-base whitespace-nowrap"
          disabled={history.length === 0}
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Protocol Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Protocol
            </label>
            <select
              value={filters.protocol}
              onChange={(e) => handleFilterChange('protocol', e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">All Protocols</option>
              <option value="rest">REST</option>
              <option value="graphql">GraphQL</option>
              <option value="grpc">gRPC</option>
            </select>
          </div>

          {/* Status Code Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Status Code
            </label>
            <input
              type="number"
              placeholder="e.g., 200"
              value={filters.statusCode}
              onChange={(e) => handleFilterChange('statusCode', e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Success Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Result
            </label>
            <select
              value={filters.success}
              onChange={(e) => handleFilterChange('success', e.target.value)}
              className="input w-full text-sm"
            >
              <option value="">All Results</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No History Found
            </h3>
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'No requests match your filters. Try adjusting them.'
                : 'Execute some API requests to see them here'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Protocol
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Duration
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {formatDate(entry.timestamp)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getProtocolBadgeColor(entry.request?.protocol)}`}>
                          {entry.request?.protocol?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 font-mono max-w-[150px] sm:max-w-xs truncate">
                        {entry.request?.endpoint || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {entry.response?.statusCode ? (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusBadgeColor(entry.response.statusCode)}`}>
                            {entry.response.statusCode}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                        {formatDuration(entry.duration)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {entry.success ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-xs sm:text-sm space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleReExecute(entry)}
                          disabled={executing === entry._id}
                          className="text-teal-600 hover:text-teal-900 disabled:opacity-50 inline-flex items-center space-x-1"
                        >
                          {executing === entry._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Re-execute</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="card">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} total entries)
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Request Details</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {formatDate(selectedEntry.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Request</h3>
                  <Editor
                    height="300px"
                    defaultLanguage="json"
                    value={JSON.stringify(selectedEntry.request, null, 2)}
                    theme="vs-light"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                      lineNumbers: 'on',
                      folding: true,
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Response</h3>
                  <Editor
                    height="300px"
                    defaultLanguage="json"
                    value={JSON.stringify(selectedEntry.response, null, 2)}
                    theme="vs-light"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 12,
                      lineNumbers: 'on',
                      folding: true,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
