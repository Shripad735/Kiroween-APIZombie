import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Global state
  const [apiSpecs, setApiSpecs] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [authConfigs, setAuthConfigs] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Load API specs on mount
  useEffect(() => {
    loadApiSpecs();
  }, []);

  // Load API specifications
  const loadApiSpecs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/specs`);
      if (response.data.success) {
        setApiSpecs(response.data.data);
        // Auto-select first spec if none selected
        if (!selectedSpec && response.data.data.length > 0) {
          setSelectedSpec(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load API specs:', error);
    }
  };

  // Add a new API spec
  const addApiSpec = (spec) => {
    setApiSpecs(prev => [...prev, spec]);
    if (!selectedSpec) {
      setSelectedSpec(spec);
    }
  };

  // Remove an API spec
  const removeApiSpec = (specId) => {
    setApiSpecs(prev => prev.filter(spec => spec._id !== specId));
    if (selectedSpec?._id === specId) {
      setSelectedSpec(apiSpecs[0] || null);
    }
  };

  // Update selected spec
  const selectSpec = (spec) => {
    setSelectedSpec(spec);
  };

  // Load auth config for a specific API
  const loadAuthConfig = async (apiId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/config/${apiId}`
      );
      if (response.data.success) {
        setAuthConfigs(prev => ({
          ...prev,
          [apiId]: response.data.data
        }));
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to load auth config:', error);
      return null;
    }
  };

  // Save auth config
  const saveAuthConfig = async (apiId, config) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/config`,
        { apiId, ...config }
      );
      if (response.data.success) {
        setAuthConfigs(prev => ({
          ...prev,
          [apiId]: response.data.data
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save auth config:', error);
      return false;
    }
  };

  // Get auth config for a specific API
  const getAuthConfig = (apiId) => {
    return authConfigs[apiId] || null;
  };

  // Show loading overlay
  const showLoading = (message = 'Loading...') => {
    setIsLoading(true);
    setLoadingMessage(message);
  };

  // Hide loading overlay
  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  const value = {
    // State
    apiSpecs,
    selectedSpec,
    authConfigs,
    currentUser,
    isLoading,
    loadingMessage,
    
    // Actions
    loadApiSpecs,
    addApiSpec,
    removeApiSpec,
    selectSpec,
    loadAuthConfig,
    saveAuthConfig,
    getAuthConfig,
    showLoading,
    hideLoading,
    setCurrentUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
