import { useApp } from '../context/AppContext';
import APISpecManager from '../components/APISpecManager';
import { FileText } from 'lucide-react';

function APISpecifications() {
  const { selectedSpec, selectSpec } = useApp();

  const handleSpecSelected = (spec) => {
    selectSpec(spec);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-2">
          <FileText className="w-8 h-8 text-zombie-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            API Specifications
          </h2>
        </div>
        <p className="text-gray-600">
          Upload and manage your API specifications. Supports OpenAPI/Swagger, GraphQL, and gRPC.
        </p>
      </div>

      {/* API Spec Manager Component */}
      <APISpecManager 
        onSpecSelected={handleSpecSelected}
        selectedSpecId={selectedSpec?._id}
      />

      {/* Selected Spec Info */}
      {selectedSpec && (
        <div className="card bg-zombie-50 border border-zombie-200">
          <h3 className="font-bold text-zombie-900 mb-2">
            Currently Selected: {selectedSpec.name}
          </h3>
          <p className="text-sm text-zombie-700">
            This specification is now active and can be used in Natural Language requests, 
            Workflows, and Test Generation.
          </p>
        </div>
      )}
    </div>
  );
}

export default APISpecifications;
