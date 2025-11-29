import { useState, useEffect } from 'react';
import { TestTube, Play, Download, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import APISpecManager from '../components/APISpecManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TestGenerator() {
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [testSuite, setTestSuite] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [exportFormat, setExportFormat] = useState('jest');

  // Extract endpoints when spec is selected
  useEffect(() => {
    if (selectedSpec && selectedSpec.endpoints) {
      setEndpoints(selectedSpec.endpoints);
      setSelectedEndpoint('');
      setTestSuite(null);
      setTestResults(null);
    } else {
      setEndpoints([]);
      setSelectedEndpoint('');
    }
  }, [selectedSpec]);

  const handleGenerateTests = async () => {
    if (!selectedSpec) {
      toast.error('Please select an API specification');
      return;
    }

    if (!selectedEndpoint) {
      toast.error('Please select an endpoint');
      return;
    }

    setGenerating(true);
    setTestSuite(null);
    setTestResults(null);

    try {
      const payload = {
        apiSpecId: selectedSpec._id || selectedSpec.id,
        endpoint: selectedEndpoint,
        name: `Test Suite for ${selectedEndpoint}`,
        description: `Auto-generated test suite for ${selectedSpec.name} - ${selectedEndpoint}`,
      };

      const result = await axios.post(`${API_BASE_URL}/api/tests/generate`, payload);

      if (result.data.success) {
        setTestSuite(result.data.data.testSuite);
        toast.success(`Generated ${result.data.data.testSuite.testCount} tests successfully!`);
      }
    } catch (error) {
      console.error('Test generation error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to generate tests';
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

  const handleRunTests = async () => {
    if (!testSuite) {
      toast.error('No test suite to run');
      return;
    }

    setRunning(true);
    setTestResults(null);

    try {
      const payload = {
        testSuiteId: testSuite.id,
      };

      const result = await axios.post(`${API_BASE_URL}/api/tests/run`, payload);

      if (result.data.success) {
        setTestResults(result.data.data.results);
        
        const { passed, failed, total } = result.data.data.results;
        if (failed === 0) {
          toast.success(`All ${total} tests passed!`);
        } else {
          toast.error(`${failed} of ${total} tests failed`);
        }
      }
    } catch (error) {
      console.error('Test execution error:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to run tests';
      toast.error(errorMessage);
    } finally {
      setRunning(false);
    }
  };

  const handleExportTests = () => {
    if (!testSuite) {
      toast.error('No test suite to export');
      return;
    }

    try {
      const exportData = {
        name: testSuite.name,
        description: testSuite.description,
        endpoint: testSuite.endpoint,
        format: exportFormat,
        tests: testSuite.tests,
        createdAt: testSuite.createdAt,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-suite-${testSuite.endpoint.replace(/\//g, '-')}-${exportFormat}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Test suite exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export test suite');
    }
  };

  const groupTestsByCategory = (tests) => {
    const grouped = {
      success: [],
      error: [],
      edge: [],
      security: [],
    };

    tests.forEach(test => {
      if (grouped[test.category]) {
        grouped[test.category].push(test);
      }
    });

    return grouped;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'edge':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'security':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'edge':
        return <AlertCircle className="w-5 h-5" />;
      case 'security':
        return <TestTube className="w-5 h-5" />;
      default:
        return <TestTube className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <TestTube className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Test Generator</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Automatically generate comprehensive test suites for your APIs
          </p>
        </div>
      </div>

      {/* API Spec Manager */}
      <APISpecManager 
        onSpecSelected={setSelectedSpec}
        selectedSpecId={selectedSpec?._id || selectedSpec?.id}
      />

      {/* Test Generation Panel */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Generate Test Suite
        </h3>

        <div className="space-y-4">
          {/* Endpoint Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="input"
              disabled={!selectedSpec || endpoints.length === 0 || generating}
            >
              <option value="">
                {!selectedSpec 
                  ? 'Select an API specification first' 
                  : endpoints.length === 0 
                    ? 'No endpoints available' 
                    : 'Choose an endpoint...'}
              </option>
              {endpoints.map((endpoint, idx) => (
                <option key={idx} value={endpoint.path || endpoint}>
                  {endpoint.method ? `${endpoint.method} ` : ''}{endpoint.path || endpoint}
                </option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateTests}
            disabled={generating || !selectedSpec || !selectedEndpoint}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Generating Tests...</span>
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Generate Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Test Suite Display */}
      {testSuite && (
        <>
          {/* Test Suite Header */}
          <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {testSuite.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {testSuite.description}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {testSuite.testCount} tests generated for <span className="font-mono break-all">{testSuite.endpoint}</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Export Format Selection */}
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="input text-sm py-2"
                >
                  <option value="jest">Jest</option>
                  <option value="postman">Postman</option>
                </select>
                
                {/* Export Button */}
                <button
                  onClick={handleExportTests}
                  className="btn-secondary flex items-center justify-center space-x-2 text-sm whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>

                {/* Run Tests Button */}
                <button
                  onClick={handleRunTests}
                  disabled={running}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm whitespace-nowrap"
                >
                  {running ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Run Tests</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Results Summary */}
            {testResults && (
              <div className={`p-4 rounded-lg border ${
                testResults.failed === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {testResults.failed === 0 ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className={`font-bold ${
                        testResults.failed === 0 ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {testResults.failed === 0 ? 'All Tests Passed!' : 'Some Tests Failed'}
                      </p>
                      <p className={`text-sm ${
                        testResults.failed === 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResults.passed} passed, {testResults.failed} failed out of {testResults.total} tests
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      Duration: {testResults.duration}ms
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Cases Grouped by Category */}
          <div className="space-y-4">
            {Object.entries(groupTestsByCategory(testSuite.tests)).map(([category, tests]) => (
              tests.length > 0 && (
                <div key={category} className="card">
                  <div className={`flex items-center space-x-2 mb-4 pb-3 border-b ${getCategoryColor(category)}`}>
                    {getCategoryIcon(category)}
                    <h4 className="text-lg font-bold capitalize">
                      {category} Tests ({tests.length})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {tests.map((test, idx) => {
                      const testResult = testResults?.results?.find(r => r.name === test.name);
                      
                      return (
                        <div 
                          key={test._id || idx} 
                          className={`p-4 rounded-lg border ${
                            testResult 
                              ? testResult.passed 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {testResult && (
                                  testResult.passed ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )
                                )}
                                <h5 className="font-bold text-gray-900">{test.name}</h5>
                              </div>
                              
                              {test.description && (
                                <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                              )}

                              <div className="text-xs font-mono text-gray-700 space-y-1">
                                <p>
                                  <span className="font-bold">Request:</span>{' '}
                                  {test.request.method} {test.request.endpoint}
                                </p>
                                <p>
                                  <span className="font-bold">Expected Status:</span>{' '}
                                  {test.expectedResponse.statusCode}
                                </p>
                              </div>

                              {/* Test Failure Details */}
                              {testResult && !testResult.passed && testResult.error && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                                  <p className="text-sm font-bold text-red-900 mb-1">Error:</p>
                                  <p className="text-xs font-mono text-red-800">{testResult.error}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TestGenerator;
