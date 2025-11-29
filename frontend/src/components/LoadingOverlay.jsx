import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {message}
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we process your request...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
