import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import LoadingOverlay from './components/LoadingOverlay';
import Dashboard from './pages/Dashboard';
import APISpecifications from './pages/APISpecifications';
import NaturalLanguage from './pages/NaturalLanguage';
import WorkflowBuilder from './pages/WorkflowBuilder';
import ProtocolTranslator from './pages/ProtocolTranslator';
import TestGenerator from './pages/TestGenerator';
import SavedItems from './pages/SavedItems';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function AppContent() {
  const { isLoading, loadingMessage } = useApp();

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="api-specs" element={<APISpecifications />} />
          <Route path="natural-language" element={<NaturalLanguage />} />
          <Route path="workflows" element={<WorkflowBuilder />} />
          <Route path="translator" element={<ProtocolTranslator />} />
          <Route path="tests" element={<TestGenerator />} />
          <Route path="saved" element={<SavedItems />} />
          <Route path="history" element={<History />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
