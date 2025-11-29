import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Zap, 
  Home, 
  FileText,
  MessageSquare, 
  Workflow, 
  ArrowLeftRight, 
  TestTube, 
  Bookmark, 
  Clock,
  BarChart3,
  Settings,
  Menu,
  X
} from 'lucide-react';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/api-specs', icon: FileText, label: 'API Specifications' },
    { to: '/natural-language', icon: MessageSquare, label: 'Natural Language' },
    { to: '/workflows', icon: Workflow, label: 'Workflows' },
    { to: '/translator', icon: ArrowLeftRight, label: 'Protocol Translator' },
    { to: '/tests', icon: TestTube, label: 'Test Generator' },
    { to: '/saved', icon: Bookmark, label: 'Saved Items' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white border-r border-gray-200 fixed h-full overflow-y-auto z-30 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-zombie-600" />
              <h1 className="text-xl font-bold text-gray-900">
                API<span className="text-zombie-600">Zombie</span>
              </h1>
            </div>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            AI-Powered API Testing 🧟
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-zombie-50 text-zombie-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-700 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <p className="text-sm text-gray-500 hidden sm:block">
                Transform your API testing workflow with AI-powered automation
              </p>
              <div className="lg:hidden">
                <Zap className="w-6 h-6 text-zombie-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-8 py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="px-4 sm:px-8 py-4">
            <p className="text-center text-sm text-gray-500">
              Built with ❤️ using React, Node.js, and Groq AI by Shripad SK
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
