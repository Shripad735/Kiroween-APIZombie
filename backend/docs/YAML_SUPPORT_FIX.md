# YAML Support Fix for OpenAPI Specifications

## Issue
When uploading a YAML file (`.yaml` or `.yml`) for OpenAPI specifications, the application was showing this error:
```
Failed to parse openapi specification: Failed to parse OpenAPI specification: 
Unexpected token 'o', "openapi: 3"... is not valid JSON
```

## Root Cause
The backend was trying to parse YAML files as JSON using `JSON.parse()`, which fails because YAML syntax is different from JSON syntax.

## Solution

### 1. Installed YAML Parser
Added `js-yaml` package to parse YAML files:
```bash
npm install js-yaml
```

### 2. Updated Backend Parser
Modified `backend/src/services/specParser.service.js` to:
- Import `js-yaml` library
- Try parsing as JSON first
- If JSON parsing fails, try parsing as YAML
- Log successful YAML parsing

**Code Changes:**
```javascript
import yaml from 'js-yaml';

// In parseOpenAPISpec function:
if (typeof spec === 'string') {
  try {
    // Try parsing as JSON
    specObject = JSON.parse(spec);
  } catch (jsonError) {
    // Not JSON, try parsing as YAML
    try {
      specObject = yaml.load(spec);
      logger.info('Successfully parsed YAML specification');
    } catch (yamlError) {
      throw new Error(`Failed to parse specification as JSON or YAML: ${yamlError.message}`);
    }
  }
}
```

### 3. Updated Frontend
Modified `frontend/src/components/APISpecManager.jsx` to:
- Keep file content as string if JSON parsing fails
- Let backend handle YAML parsing
- Added better error logging

**Code Changes:**
```javascript
// Try parsing as JSON
try {
  const parsed = JSON.parse(fileContent);
  fileContent = parsed; // Use parsed JSON object
} catch (jsonError) {
  // Not JSON, keep as string (likely YAML)
  // Backend will handle YAML parsing
  console.log('File is not JSON, sending as string (likely YAML)');
}
```

## Testing

### Test File
```yaml
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0

servers:
  - url: https://example.com

paths:
  /hello:
    get:
      summary: Returns a test message
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Hello from the test API!"
```

### Expected Behavior
1. Upload the YAML file through the UI
2. Backend parses YAML successfully
3. Specification is stored in database
4. Endpoints are extracted and displayed
5. Success message: "OPENAPI specification uploaded successfully!"

## Files Modified

1. **backend/package.json**
   - Added `js-yaml` dependency

2. **backend/src/services/specParser.service.js**
   - Added YAML parsing support
   - Improved error messages
   - Added logging for YAML parsing

3. **frontend/src/components/APISpecManager.jsx**
   - Improved file content handling
   - Better error logging
   - Let backend handle format detection

## Supported Formats

The application now supports:

### OpenAPI/Swagger
- ✅ JSON format (`.json`)
- ✅ YAML format (`.yaml`, `.yml`)

### GraphQL
- ✅ Schema files (`.graphql`, `.gql`)
- ✅ JSON introspection results (`.json`)

### gRPC
- ✅ Protocol Buffer files (`.proto`)

## Benefits

1. **Better User Experience**: Users can upload OpenAPI specs in either JSON or YAML format
2. **Industry Standard**: YAML is the most common format for OpenAPI specifications
3. **Automatic Detection**: System automatically detects and parses the correct format
4. **Clear Error Messages**: If parsing fails, users get helpful error messages

## Verification Steps

1. ✅ Backend server restarted with new dependencies
2. ✅ YAML parser integrated successfully
3. ✅ No syntax errors in modified files
4. ✅ Server running and connected to database

## Next Steps

To test the fix:
1. Navigate to API Specifications page
2. Click "Upload API Specification"
3. Select "OpenAPI" type
4. Choose your YAML file (e.g., `test-api.yaml`)
5. Fill in name and base URL
6. Click "Upload Specification"
7. Verify success message and spec appears in list

## Technical Details

### js-yaml Library
- **Version**: Latest (installed via npm)
- **Purpose**: Parse YAML strings to JavaScript objects
- **Method Used**: `yaml.load(string)`
- **Error Handling**: Catches YAML parsing errors and provides clear messages

### Parsing Flow
```
File Upload → Read as Text → Try JSON.parse()
                                    ↓ (fails)
                              Try yaml.load()
                                    ↓ (success)
                              Validate with SwaggerParser
                                    ↓
                              Extract Endpoints
                                    ↓
                              Save to Database
```

## Error Handling

The system now handles three scenarios:

1. **Valid JSON**: Parses successfully with `JSON.parse()`
2. **Valid YAML**: Parses successfully with `yaml.load()`
3. **Invalid Format**: Returns clear error message indicating neither JSON nor YAML could be parsed

## Compatibility

- ✅ Backward compatible with existing JSON uploads
- ✅ Forward compatible with YAML uploads
- ✅ No breaking changes to API
- ✅ No database schema changes required

The fix is complete and ready for testing! 🎉
