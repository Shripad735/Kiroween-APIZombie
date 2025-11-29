# Task 14 - API Specification Manager Component - Testing Guide

## 🎯 Overview

The API Specification Manager component has been successfully implemented and is ready for testing. This guide will help you verify all the functionality.

## 🚀 Quick Start

### Prerequisites
- Backend server running on `http://localhost:5000` ✅ (Already running)
- Frontend dev server running on `http://localhost:3001` ✅ (Already running)

### Access the Component
Navigate to: **http://localhost:3001/api-specs**

Or from the dashboard: Click on **"API Specifications"** in the sidebar

## 🧪 Test Scenarios

### Test 1: Upload OpenAPI Specification

1. **Navigate** to http://localhost:3001/api-specs
2. **Select** "OpenAPI" type (should be selected by default)
3. **Enter** the following details:
   - Name: `Sample User API`
   - Base URL: `https://api.example.com/v1`
4. **Click** "Choose file..." and select `frontend/test-openapi-spec.json`
5. **Click** "Upload Specification"
6. **Expected Result**: 
   - Success toast notification appears
   - New spec appears in the "Loaded API Specifications" section
   - Shows "5 endpoints" count

### Test 2: View Specification Details

1. **Find** the uploaded spec in the list
2. **Click** the down arrow (chevron) button to expand
3. **Expected Result**:
   - Base URL is displayed
   - All 5 endpoints are shown:
     - GET /users
     - POST /users
     - GET /users/{id}
     - PUT /users/{id}
     - DELETE /users/{id}
   - HTTP methods are color-coded:
     - GET = Blue
     - POST = Green
     - PUT = Yellow
     - DELETE = Red
   - Descriptions are visible
   - Parameter counts are shown

### Test 3: Select Active Specification

1. **Scroll** to the "Select Active Specification" dropdown at the bottom
2. **Select** your uploaded spec from the dropdown
3. **Expected Result**:
   - Dropdown shows the selected spec
   - Green info box appears showing "Currently Selected: [spec name]"
   - This spec is now available for use in other features

### Test 4: GraphQL Introspection (Optional)

If you have a GraphQL endpoint available:

1. **Select** "GraphQL" type
2. **Click** "Introspect URL" method
3. **Enter** details:
   - Name: `My GraphQL API`
   - GraphQL Endpoint URL: `https://your-graphql-endpoint.com/graphql`
4. **Click** "Upload Specification"
5. **Expected Result**: Schema is introspected and saved

### Test 5: Delete Specification

1. **Find** any spec in the list
2. **Click** the trash icon (red)
3. **Confirm** deletion in the dialog
4. **Expected Result**:
   - Confirmation dialog appears
   - After confirming, spec is removed from the list
   - Success toast notification appears

### Test 6: Error Handling

Test various error scenarios:

1. **Try uploading without a name** - Should show error toast
2. **Try uploading without a base URL** - Should show error toast
3. **Try uploading without selecting a file** - Should show error toast
4. **Try uploading an invalid JSON file** - Should show parse error

### Test 7: Multiple Specifications

1. **Upload** 2-3 different specifications
2. **Verify** all appear in the list
3. **Expand** different specs to view their endpoints
4. **Switch** between specs using the dropdown
5. **Expected Result**: All specs are managed independently

### Test 8: Responsive Design

1. **Resize** browser window to mobile size (< 768px)
2. **Verify** layout adapts properly
3. **Test** all functionality on mobile view
4. **Expected Result**: Component is fully functional on all screen sizes

## 📋 Feature Checklist

- [x] OpenAPI/Swagger file upload (JSON/YAML)
- [x] GraphQL schema file upload
- [x] GraphQL URL introspection
- [x] gRPC proto file upload
- [x] Display list of loaded specifications
- [x] Show spec type icons (OpenAPI, GraphQL, gRPC)
- [x] Show endpoint count
- [x] Expandable spec details
- [x] Display endpoints with methods
- [x] Color-coded HTTP methods
- [x] Show endpoint descriptions
- [x] Show parameter counts
- [x] Spec selection dropdown
- [x] Delete functionality with confirmation
- [x] Loading states during API calls
- [x] Error handling with toast notifications
- [x] Empty state messaging
- [x] Responsive design
- [x] Integration with backend API

## 🎨 UI Elements to Verify

### Upload Section
- Three type buttons: OpenAPI, GraphQL, gRPC
- Visual selection state (green border when selected)
- File input with custom styling
- Name and URL input fields
- Upload button with loading state

### Specifications List
- Card-based layout
- Spec type icons (different colors)
- Spec name and metadata
- Expand/collapse buttons
- Delete buttons
- Empty state message when no specs

### Spec Details (Expanded)
- Base URL display
- Endpoint list with scrolling
- HTTP method badges (color-coded)
- Endpoint paths in monospace font
- Descriptions and parameter info

### Selection Dropdown
- All specs listed
- Current selection highlighted
- Info box showing active spec

## 🐛 Known Limitations

1. **File Size**: Large specification files may take time to parse
2. **YAML Support**: YAML files are sent as strings (backend handles parsing)
3. **GraphQL Introspection**: Requires accessible GraphQL endpoint

## 🔧 Troubleshooting

### Issue: "Failed to load API specifications"
- **Solution**: Check backend server is running on port 5000
- **Verify**: Visit http://localhost:5000/api/specs in browser

### Issue: "Failed to upload specification"
- **Solution**: Check file format is valid JSON/YAML
- **Verify**: Backend logs for detailed error messages

### Issue: Component not rendering
- **Solution**: Check browser console for errors
- **Verify**: All dependencies are installed (`npm install` in frontend)

### Issue: CORS errors
- **Solution**: Backend should have CORS enabled for http://localhost:3001
- **Verify**: Check backend CORS configuration

## 📊 Success Criteria

✅ All upload methods work (file and URL)
✅ All spec types are supported (OpenAPI, GraphQL, gRPC)
✅ Specs are listed and displayed correctly
✅ Endpoints are shown with proper formatting
✅ Selection mechanism works
✅ Delete functionality works with confirmation
✅ Error handling provides clear feedback
✅ Loading states are visible during operations
✅ Responsive design works on all screen sizes

## 🎉 Next Steps

After verifying the API Specification Manager:

1. **Integrate** with Natural Language Panel (Task 15)
2. **Use** selected specs in Workflow Builder (Task 16)
3. **Reference** specs in Test Generator (Task 18)

## 📝 Notes

- The component is designed to be reusable across different pages
- It can be controlled via props (`onSpecSelected`, `selectedSpecId`)
- Toast notifications use `react-hot-toast` library
- Icons use `lucide-react` library
- Styling follows Tailwind CSS patterns from the project

## 🔗 Related Files

- Component: `frontend/src/components/APISpecManager.jsx`
- Page: `frontend/src/pages/APISpecifications.jsx`
- Test File: `frontend/test-openapi-spec.json`
- Backend API: `backend/src/controllers/specs.controller.js`

---

**Status**: ✅ Ready for Testing
**Last Updated**: 2025-11-28
