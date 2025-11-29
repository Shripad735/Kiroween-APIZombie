import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Activity, Calendar, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PROTOCOL_COLORS = {
  rest: '#3B82F6',
  graphql: '#EC4899',
  grpc: '#8B5CF6',
};

const PIE_COLORS = ['#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'];

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'daily',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        groupBy: dateRange.groupBy,
      };

      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const response = await axios.get(`${API_BASE_URL}/api/analytics`, { params });
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (key, value) => {
    setDateRange((prev) => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTimeSeriesData = (data) => {
    return data.map((item) => ({
      ...item,
      date: item.date ? formatDate(item.date) : `Week ${item.week}`,
    }));
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 flex-shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Visualize your API testing metrics and performance
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Date Range & Grouping</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Group By
            </label>
            <select
              value={dateRange.groupBy}
              onChange={(e) => handleDateRangeChange('groupBy', e.target.value)}
              className="input w-full text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard
              icon={<Activity className="w-6 h-6 text-blue-600" />}
              title="Total Requests"
              value={analytics.summary.totalRequests}
              bgColor="bg-blue-50"
            />
            <SummaryCard
              icon={<TrendingUp className="w-6 h-6 text-green-600" />}
              title="Success Rate"
              value={`${analytics.summary.successRate.toFixed(1)}%`}
              bgColor="bg-green-50"
            />
            <SummaryCard
              icon={<Clock className="w-6 h-6 text-purple-600" />}
              title="Avg Response Time"
              value={`${analytics.summary.averageResponseTime.toFixed(0)}ms`}
              bgColor="bg-purple-50"
            />
            <SummaryCard
              icon={<BarChart3 className="w-6 h-6 text-orange-600" />}
              title="Failed Requests"
              value={analytics.summary.failedRequests}
              bgColor="bg-orange-50"
            />
          </div>

          {/* Charts Row 1: Success Rate Over Time */}
          {analytics.timeSeriesData && analytics.timeSeriesData.length > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Success Rate Over Time
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={formatTimeSeriesData(analytics.timeSeriesData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="successRate"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Success Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts Row 2: Average Response Time */}
          {analytics.timeSeriesData && analytics.timeSeriesData.length > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Average Response Time Over Time
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={formatTimeSeriesData(analytics.timeSeriesData)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Avg Response Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Charts Row 3: Protocol Breakdown and Most Used Endpoints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protocol Breakdown Pie Chart */}
            {analytics.protocolBreakdown && analytics.protocolBreakdown.length > 0 && (
              <div className="card">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Protocol Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.protocolBreakdown}
                      dataKey="count"
                      nameKey="protocol"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.protocol?.toUpperCase() || 'N/A'}: ${entry.count}`}
                      labelStyle={{ fontSize: '11px' }}
                    >
                      {analytics.protocolBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PROTOCOL_COLORS[entry.protocol] || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Most Used Endpoints Bar Chart */}
            {analytics.mostUsedEndpoints && analytics.mostUsedEndpoints.length > 0 && (
              <div className="card">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                  Most Used Endpoints
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.mostUsedEndpoints.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="endpoint"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#3B82F6" name="Request Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Most Used Endpoints Table */}
          {analytics.mostUsedEndpoints && analytics.mostUsedEndpoints.length > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Most Used Endpoints Details
              </h3>
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Method
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocol
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Avg Duration
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Success Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.mostUsedEndpoints.map((endpoint, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 font-mono max-w-[150px] sm:max-w-xs truncate">
                          {endpoint.endpoint || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                          {endpoint.method || 'N/A'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              endpoint.protocol === 'rest'
                                ? 'bg-blue-100 text-blue-800'
                                : endpoint.protocol === 'graphql'
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {endpoint.protocol?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {endpoint.count}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                          {endpoint.avgDuration.toFixed(0)}ms
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          <span
                            className={`font-medium ${
                              endpoint.successRate >= 90
                                ? 'text-green-600'
                                : endpoint.successRate >= 70
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}
                          >
                            {endpoint.successRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {analytics.summary.totalRequests === 0 && (
            <div className="card">
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Analytics Data Available
                </h3>
                <p className="text-gray-500">
                  Execute some API requests to see analytics and insights here
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, title, value, bgColor }) {
  return (
    <div className={`card ${bgColor}`}>
      <div className="flex items-center space-x-3">
        <div>{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
