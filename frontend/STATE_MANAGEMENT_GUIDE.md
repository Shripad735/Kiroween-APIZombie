# State Management Guide

## Overview

The APIZombie frontend now includes comprehensive state management using React Context API, along with error boundaries, loading overlays, and toast notifications.

## Features Implemented

### 1. AppContext - Global State Management

Located in `src/context/AppContext.jsx`, this provides centralized state management for:

- **API Specifications**: Loaded specs, selected spec
- **Authentication Configs**: Per-API auth configurations
- **Current User**: User information (for future auth implementation)
- **Loading State**: Global loading overlay control

#### Usage Example

```jsx
import { useApp } from '../context/AppContext';

function MyComponent() {
  const { 
    apiSpecs, 
    selectedSpec, 
    selectSpec,
    showLoading,
    hideLoading 
  } = useApp();

  const handleAction = async () => {
    showLoading('Processing...');
    try {
      // Your async operation
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      <h2>Selected: {selectedSpec?.name}</h2>
      {/* Your component content */}
    </div>
  );
}
```

### 2. ErrorBoundary Component

Located in `src/components/ErrorBoundary.jsx`, this catches React errors and displays a user-friendly error page.

**Features:**
- Catches all React component errors
- Shows error details in development mode
- Provides "Try Again" and "Go to Dashboard" actions
- Prevents entire app crashes

**Already integrated** in `main.jsx` - wraps the entire app.

### 3. LoadingOverlay Component

Located in `src/components/LoadingOverlay.jsx`, provides a full-screen loading indicator.

**Features:**
- Blocks user interaction during long operations
- Shows custom loading messages
- Animated spinner
- Automatically controlled via AppContext

**Usage:**
```jsx
const { showLoading, hideLoading } = useApp();

// Show loading
showLoading('Uploading specification...');

// Hide loading
hideLoading();
```

### 4. Toast Notifications

Toast notifications are already configured using `react-hot-toast`. A utility wrapper is provided in `src/utils/toast.js`.

**Usage:**
```jsx
import { showSuccess, showError, showWarning, showInfo } from '../utils/toast';

// Success message
showSuccess('Operation completed successfully!');

// Error message
showError('Something went wrong');

// Warning
showWarning('Please review your input');

// Info
showInfo('Processing your request...');

// Promise-based (auto-updates)
showPromise(
  myAsyncFunction(),
  {
    loading: 'Processing...',
    success: 'Done!',
    error: 'Failed!'
  }
);
```

## State Preservation

The AppContext ensures state is preserved across route navigation. When you navigate between pages:

- Selected API spec remains active
- Auth configurations stay loaded
- User preferences are maintained

## Integration Examples

### Example 1: Using Context in a Page

```jsx
import { useApp } from '../context/AppContext';
import { showSuccess, showError } from '../utils/toast';

function MyPage() {
  const { selectedSpec, apiSpecs, showLoading, hideLoading } = useApp();

  const handleSubmit = async () => {
    if (!selectedSpec) {
      showError('Please select an API specification first');
      return;
    }

    showLoading('Processing request...');
    try {
      // Your API call
      const result = await myApiCall();
      showSuccess('Request completed!');
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading();
    }
  };

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

### Example 2: Auth Configuration

```jsx
import { useApp } from '../context/AppContext';

function AuthSettings() {
  const { selectedSpec, saveAuthConfig, getAuthConfig } = useApp();

  const handleSaveAuth = async (config) => {
    const success = await saveAuthConfig(selectedSpec._id, config);
    if (success) {
      showSuccess('Auth configuration saved!');
    }
  };

  const currentAuth = getAuthConfig(selectedSpec?._id);

  return (
    <div>
      {/* Auth form */}
    </div>
  );
}
```

## Best Practices

1. **Always use the context** for shared state instead of prop drilling
2. **Use toast notifications** for user feedback instead of alerts
3. **Show loading overlays** for operations that take >1 second
4. **Handle errors gracefully** - the ErrorBoundary will catch unhandled errors
5. **Keep loading messages descriptive** - tell users what's happening

## Architecture

```
App (wrapped in ErrorBoundary)
  └── AppProvider (provides global state)
      └── AppContent
          ├── Routes (all pages have access to context)
          └── LoadingOverlay (controlled by context)
      └── Toaster (react-hot-toast)
```

## Requirements Validated

This implementation validates:
- **Requirement 8.2**: State preservation across route navigation ✓
- **Requirement 8.4**: User-friendly error messages and graceful error handling ✓

## Future Enhancements

- Add user authentication state
- Implement persistent storage (localStorage) for preferences
- Add undo/redo functionality for workflows
- Implement optimistic UI updates
