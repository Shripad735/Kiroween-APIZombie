import { Link } from 'react-router-dom';
import { 
  Activity, 
  Zap, 
  FileText,
  TestTube, 
  Workflow, 
  ArrowLeftRight, 
  Bookmark, 
  Clock, 
  Settings 
} from 'lucide-react';

function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome to APIZombie! 🧟
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Your AI-powered API testing and integration platform. Get started by exploring the features below.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          to="/api-specs"
          icon={<FileText className="w-8 h-8 text-blue-600" />}
          title="API Specifications"
          description="Upload and manage OpenAPI, GraphQL, and gRPC specifications."
          comingSoon={false}
        />
        <FeatureCard
          to="/natural-language"
          icon={<Zap className="w-8 h-8 text-zombie-600" />}
          title="Natural Language"
          description="Describe API requests in plain English and let AI generate them for you."
          comingSoon={false}
        />
        <FeatureCard
          to="/workflows"
          icon={<Workflow className="w-8 h-8 text-blue-600" />}
          title="Workflows"
          description="Chain multiple API calls together across different protocols."
          comingSoon={false}
        />
        <FeatureCard
          to="/tests"
          icon={<TestTube className="w-8 h-8 text-purple-600" />}
          title="Test Generation"
          description="Automatically generate comprehensive test suites for your APIs."
          comingSoon={false}
        />
        <FeatureCard
          to="/translator"
          icon={<ArrowLeftRight className="w-8 h-8 text-orange-600" />}
          title="Protocol Translation"
          description="Convert between REST, GraphQL, and gRPC seamlessly."
          comingSoon={false}
        />
        <FeatureCard
          to="/saved"
          icon={<Bookmark className="w-8 h-8 text-indigo-600" />}
          title="Saved Items"
          description="Manage and organize your saved API requests and workflows."
          comingSoon={false}
        />
        <FeatureCard
          to="/history"
          icon={<Clock className="w-8 h-8 text-teal-600" />}
          title="History"
          description="View and re-execute your API request history."
          comingSoon={false}
        />
        <FeatureCard
          to="/analytics"
          icon={<Activity className="w-8 h-8 text-indigo-600" />}
          title="Analytics"
          description="Visualize API testing metrics and performance insights."
          comingSoon={false}
        />
        <FeatureCard
          to="/settings"
          icon={<Settings className="w-8 h-8 text-gray-600" />}
          title="Settings"
          description="Configure authentication and application preferences."
          comingSoon={false}
        />
      </div>

      {/* Quick Start Guide */}
      <div className="card">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          🚀 Quick Start Guide
        </h3>
        <ol className="space-y-3 text-sm sm:text-base text-gray-700">
          <li className="flex items-start">
            <span className="font-bold text-zombie-600 mr-2 flex-shrink-0">1.</span>
            <span>
              Go to <Link to="/api-specs" className="text-zombie-600 hover:underline font-medium">API Specifications</Link> and upload your API spec (OpenAPI, GraphQL, or gRPC)
            </span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-zombie-600 mr-2 flex-shrink-0">2.</span>
            <span>Describe what you want to test in natural language</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-zombie-600 mr-2 flex-shrink-0">3.</span>
            <span>Review and execute the generated API request</span>
          </li>
          <li className="flex items-start">
            <span className="font-bold text-zombie-600 mr-2 flex-shrink-0">4.</span>
            <span>Save your requests and build workflows for complex scenarios</span>
          </li>
        </ol>
      </div>

      {/* Status */}
      <div className="card bg-zombie-50 border border-zombie-200">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-zombie-500 rounded-full animate-pulse"></div>
          <p className="text-zombie-800 font-medium">
            Backend Status: Connected ✅
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ to, icon, title, description, comingSoon, highlight }) {
  const cardContent = (
    <>
      {comingSoon && (
        <span className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
          Coming Soon
        </span>
      )}
      {highlight && (
        <span className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
          Ready
        </span>
      )}
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </>
  );

  return (
    <Link
      to={to}
      className={`card hover:shadow-lg transition-shadow duration-200 relative block ${
        highlight ? 'ring-2 ring-zombie-500' : ''
      }`}
    >
      {cardContent}
    </Link>
  );
}

export default Dashboard;
