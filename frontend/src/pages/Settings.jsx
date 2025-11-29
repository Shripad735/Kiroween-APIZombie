import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Shield, Eye, EyeOff, Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Settings() {
  const [apiSpecs, setApiSpecs] = useState([]);
  const [authConfigs, setAuthConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    apiSpecId: '',
    authType: 'apikey',
    // API Key fields
    apiKeyName: '',
    apiKeyValue: '',
    apiKeyLocation: 'header',
    // Bearer Token fields
    bearerToken: '',
    // Basic Auth fields
    basicUsername: '',
    basicPassword: '',
    // OAuth 2.0 fields
    oauth2AccessToken: '',
    oauth2RefreshToken: '',
    oauth2TokenType: 'Bearer',
    oauth2ClientId: '',
    oauth2ClientSecret: '',
    oauth2AuthUrl: '',
    oauth2TokenUrl: '',
    oauth2Scope: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Fetch API specs
      const specsResponse = await axios.get(`${API_URL}/specs`);
      const specs = specsResponse.data.data || [];
      setApiSpecs(specs);

      // Fetch auth configs for each API spec
      const configs = [];
      for (const spec of specs) {
        try {
          const configResponse = await axios.get(`${API_URL}/auth/config/${spec._id}`);
          if (configResponse.data.success) {
            configs.push({ ...configResponse.data.data, apiSpecName: spec.name });
          }
        } catch (err) {
          // Config doesn't exist for this API, that's okay
          if (err.response?.status !== 404) {
            console.error(`Error fetching config for ${spec.name}:`, err);
          }
        }
      }
      setAuthConfigs(configs);
    } catch (err) {
      console.error('Error fetching data:', err);
      // Only show error if it's not a 404 (no specs found is okay)
      if (err.response?.status !== 404) {
        setError('Failed to load data. Please ensure the backend server is running.');
      } else {
        // No specs found, that's okay
        setApiSpecs([]);
        setAuthConfigs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      apiSpecId: '',
      authType: 'apikey',
      apiKeyName: '',
      apiKeyValue: '',
      apiKeyLocation: 'header',
      bearerToken: '',
      basicUsername: '',
      basicPassword: '',
      oauth2AccessToken: '',
      oauth2RefreshToken: '',
      oauth2TokenType: 'Bearer',
      oauth2ClientId: '',
      oauth2ClientSecret: '',
      oauth2AuthUrl: '',
      oauth2TokenUrl: '',
      oauth2Scope: '',
    });
    setShowForm(false);
    setEditingConfig(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        apiSpecId: formData.apiSpecId,
        authType: formData.authType,
      };

      // Add type-specific fields
      if (formData.authType === 'apikey') {
        payload.apiKey = {
          key: formData.apiKeyName,
          value: formData.apiKeyValue,
          location: formData.apiKeyLocation,
        };
      } else if (formData.authType === 'bearer') {
        payload.bearerToken = {
          token: formData.bearerToken,
        };
      } else if (formData.authType === 'basic') {
        payload.basic = {
          username: formData.basicUsername,
          password: formData.basicPassword,
        };
      } else if (formData.authType === 'oauth2') {
        payload.oauth2 = {
          accessToken: formData.oauth2AccessToken || undefined,
          refreshToken: formData.oauth2RefreshToken || undefined,
          tokenType: formData.oauth2TokenType,
          clientId: formData.oauth2ClientId || undefined,
          clientSecret: formData.oauth2ClientSecret || undefined,
          authUrl: formData.oauth2AuthUrl || undefined,
          tokenUrl: formData.oauth2TokenUrl || undefined,
          scope: formData.oauth2Scope || undefined,
        };
      }

      if (editingConfig) {
        // Update existing config
        await axios.put(`${API_URL}/auth/config/${formData.apiSpecId}`, payload);
        setSuccess('Authentication configuration updated successfully');
      } else {
        // Create new config
        await axios.post(`${API_URL}/auth/config`, payload);
        setSuccess('Authentication configuration saved successfully');
      }

      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error saving auth config:', err);
      setError(err.response?.data?.error?.message || 'Failed to save authentication configuration');
    }
  };

  const handleEdit = (config) => {
    const spec = apiSpecs.find(s => s._id === config.apiSpecId);
    if (!spec) return;

    setEditingConfig(config);
    setFormData({
      apiSpecId: config.apiSpecId,
      authType: config.authType,
      apiKeyName: config.apiKey?.key || '',
      apiKeyValue: '', // Don't populate masked values
      apiKeyLocation: config.apiKey?.location || 'header',
      bearerToken: '',
      basicUsername: config.basic?.username || '',
      basicPassword: '',
      oauth2AccessToken: '',
      oauth2RefreshToken: '',
      oauth2TokenType: config.oauth2?.tokenType || 'Bearer',
      oauth2ClientId: config.oauth2?.clientId || '',
      oauth2ClientSecret: '',
      oauth2AuthUrl: config.oauth2?.authUrl || '',
      oauth2TokenUrl: config.oauth2?.tokenUrl || '',
      oauth2Scope: config.oauth2?.scope || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (apiSpecId) => {
    if (!confirm('Are you sure you want to delete this authentication configuration?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/auth/config/${apiSpecId}`);
      setSuccess('Authentication configuration deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting auth config:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete authentication configuration');
    }
  };

  const togglePasswordVisibility = (configId) => {
    setShowPasswords(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  const getAuthTypeLabel = (type) => {
    const labels = {
      apikey: 'API Key',
      bearer: 'Bearer Token',
      basic: 'Basic Auth',
      oauth2: 'OAuth 2.0',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure authentication and application preferences
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Authentication</span>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* No API Specs Warning */}
      {apiSpecs.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p className="font-medium">No API Specifications Found</p>
          <p className="text-sm mt-1">
            Please upload an API specification first in the{' '}
            <a href="/api-specs" className="underline font-medium">API Specifications</a> page 
            before configuring authentication.
          </p>
        </div>
      )}

      {/* Authentication Configuration Form */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>{editingConfig ? 'Edit' : 'Add'} Authentication Configuration</span>
            </h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Specification *
              </label>
              <select
                name="apiSpecId"
                value={formData.apiSpecId}
                onChange={handleInputChange}
                required
                disabled={editingConfig !== null}
                className="input w-full"
              >
                <option value="">Select an API</option>
                {apiSpecs.map(spec => (
                  <option key={spec._id} value={spec._id}>
                    {spec.name} ({spec.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Auth Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Type *
              </label>
              <select
                name="authType"
                value={formData.authType}
                onChange={handleInputChange}
                required
                className="input w-full"
              >
                <option value="apikey">API Key</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </div>

            {/* API Key Fields */}
            {formData.authType === 'apikey' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key Name *
                  </label>
                  <input
                    type="text"
                    name="apiKeyName"
                    value={formData.apiKeyName}
                    onChange={handleInputChange}
                    placeholder="e.g., X-API-Key, api_key"
                    required
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key Value *
                  </label>
                  <input
                    type="password"
                    name="apiKeyValue"
                    value={formData.apiKeyValue}
                    onChange={handleInputChange}
                    placeholder="Enter API key"
                    required
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    name="apiKeyLocation"
                    value={formData.apiKeyLocation}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Parameter</option>
                  </select>
                </div>
              </>
            )}

            {/* Bearer Token Fields */}
            {formData.authType === 'bearer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bearer Token *
                </label>
                <input
                  type="password"
                  name="bearerToken"
                  value={formData.bearerToken}
                  onChange={handleInputChange}
                  placeholder="Enter bearer token"
                  required
                  className="input w-full"
                />
              </div>
            )}

            {/* Basic Auth Fields */}
            {formData.authType === 'basic' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="basicUsername"
                    value={formData.basicUsername}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="basicPassword"
                    value={formData.basicPassword}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    className="input w-full"
                  />
                </div>
              </>
            )}

            {/* OAuth 2.0 Fields */}
            {formData.authType === 'oauth2' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    name="oauth2AccessToken"
                    value={formData.oauth2AccessToken}
                    onChange={handleInputChange}
                    placeholder="Enter access token (if available)"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Token
                  </label>
                  <input
                    type="password"
                    name="oauth2RefreshToken"
                    value={formData.oauth2RefreshToken}
                    onChange={handleInputChange}
                    placeholder="Enter refresh token (optional)"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    name="oauth2ClientId"
                    value={formData.oauth2ClientId}
                    onChange={handleInputChange}
                    placeholder="Enter client ID"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Secret
                  </label>
                  <input
                    type="password"
                    name="oauth2ClientSecret"
                    value={formData.oauth2ClientSecret}
                    onChange={handleInputChange}
                    placeholder="Enter client secret"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization URL
                  </label>
                  <input
                    type="url"
                    name="oauth2AuthUrl"
                    value={formData.oauth2AuthUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/oauth/authorize"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token URL
                  </label>
                  <input
                    type="url"
                    name="oauth2TokenUrl"
                    value={formData.oauth2TokenUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/oauth/token"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scope
                  </label>
                  <input
                    type="text"
                    name="oauth2Scope"
                    value={formData.oauth2Scope}
                    onChange={handleInputChange}
                    placeholder="read write (space-separated)"
                    className="input w-full"
                  />
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{editingConfig ? 'Update' : 'Save'} Configuration</span>
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Authentication Configurations */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Saved Authentication Configurations</span>
        </h2>

        {authConfigs.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No authentication configurations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Add authentication to secure your API requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {authConfigs.map(config => (
              <div
                key={config.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{config.apiSpecName}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {getAuthTypeLabel(config.authType)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {config.authType === 'apikey' && (
                        <>
                          <div>Key Name: <span className="font-mono">{config.apiKey?.key}</span></div>
                          <div>Location: {config.apiKey?.location}</div>
                          <div>Value: <span className="font-mono text-gray-400">***masked***</span></div>
                        </>
                      )}
                      {config.authType === 'bearer' && (
                        <div>Token: <span className="font-mono text-gray-400">***masked***</span></div>
                      )}
                      {config.authType === 'basic' && (
                        <>
                          <div>Username: <span className="font-mono">{config.basic?.username}</span></div>
                          <div>Password: <span className="font-mono text-gray-400">***masked***</span></div>
                        </>
                      )}
                      {config.authType === 'oauth2' && (
                        <>
                          {config.oauth2?.clientId && (
                            <div>Client ID: <span className="font-mono">{config.oauth2.clientId}</span></div>
                          )}
                          {config.oauth2?.authUrl && (
                            <div>Auth URL: <span className="font-mono text-xs">{config.oauth2.authUrl}</span></div>
                          )}
                          {config.oauth2?.tokenUrl && (
                            <div>Token URL: <span className="font-mono text-xs">{config.oauth2.tokenUrl}</span></div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(config)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(config.apiSpecId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
