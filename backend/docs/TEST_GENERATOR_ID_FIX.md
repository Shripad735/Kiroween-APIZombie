# Test Generator ID Field Fix

## Issue
When trying to generate tests for an uploaded API specification, the Test Generator showed this error:
```
API specification ID is required
```

## Root Cause
The Test Generator was using `selectedSpec.id` to get the API specification ID, but the spec object from the backend uses `_id` (MongoDB ObjectId field).

This is the same ID field mismatch issue we fixed earlier in other components.

## Solution
Updated the Test Generator to handle both ID formats (`_id` and `id`).

## Files Modified

**frontend/src/pages/TestGenerator.jsx**

### Change 1: API Spec Manager Props
```javascript
// Before
<APISpecManager 
  onSpecSelected={setSelectedSpec}
  selectedSpecId={selectedSpec?.id}
/>

// After
<APISpecManager 
  onSpecSelected={setSelectedSpec}
  selectedSpecId={selectedSpec?._id || selectedSpec?.id}
/>
```

### Change 2: Test Generation Payload
```javascript
// Before
const payload = {
  apiSpecId: selectedSpec.id,
  endpoint: selectedEndpoint,
  // ...
};

// After
const payload = {
  apiSpecId: selectedSpec._id || selectedSpec.id,
  endpoint: selectedEndpoint,
  // ...
};
```

## How It Works

The fix uses JavaScript's OR operator (`||`) to check for both ID formats:
1. First tries `_id` (MongoDB format from database)
2. Falls back to `id` (simplified format from API response)

This ensures compatibility regardless of which format the spec object uses.

## Testing

### Steps to Verify
1. Navigate to Test Generator page
2. Upload or select an API specification
3. Select an endpoint from the dropdown
4. Click "Generate Tests"
5. Verify tests are generated successfully

### Expected Behavior
- ✅ No "API specification ID is required" error
- ✅ Tests generate successfully
- ✅ Test suite displays with all categories
- ✅ Can run and export tests

## Related Fixes

This is part of a series of ID field fixes across the application:
1. ✅ Settings page - Fixed auth config loading
2. ✅ API Specifications page - Fixed spec selection
3. ✅ Test Generator page - Fixed test generation (THIS FIX)

All components now consistently handle both `_id` and `id` formats.

## No Backend Changes Required

This is a frontend-only fix. The backend API is working correctly and returns data in the expected format.

## Deployment

1. No database changes needed
2. No environment variable changes
3. Simply rebuild and redeploy frontend
4. Backward compatible with existing code

The Test Generator should now work correctly! 🎉
