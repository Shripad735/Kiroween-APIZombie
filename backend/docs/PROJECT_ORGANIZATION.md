# Project Organization Guide

## Overview

The APIZombie backend follows a clean, organized structure with dedicated folders for different types of files.

## Folder Structure

```
backend/
├── docs/                    # 📚 All documentation
├── src/                     # 💻 Source code
├── test-scripts/           # 🧪 Test scripts
├── node_modules/           # 📦 Dependencies
├── .env                    # 🔐 Environment variables
├── package.json            # 📋 Project configuration
└── README.md              # 📖 Main documentation
```

## Organization Rules

### 1. Documentation Files (`docs/`)

**All `.md` documentation files go here**, including:
- API documentation
- Setup guides
- Model documentation
- Task completion summaries
- Architecture documents
- Any other markdown documentation

**Example:**
```
docs/
├── README.md
├── GROQ_API_SETUP.md
├── MODELS_DOCUMENTATION.md
├── NL_ENGINE_README.md
└── TASK_X_COMPLETION_SUMMARY.md
```

### 2. Test Scripts (`test-scripts/`)

**All test and verification scripts go here**, including:
- Database connection tests
- Model validation tests
- API endpoint tests
- Integration tests
- Verification scripts

**Example:**
```
test-scripts/
├── README.md
├── test-connection.js
├── test-models.js
├── test-groq-connection.js
├── test-nl-api.js
└── verify-design-compliance.js
```

**Important:** Test scripts use relative imports:
```javascript
// ✅ Correct
import { APISpec } from '../src/models/index.js';
dotenv.config({ path: '../.env' });

// ❌ Wrong
import { APISpec } from './src/models/index.js';
dotenv.config();
```

### 3. Source Code (`src/`)

**All application source code goes here**, organized by function:

```
src/
├── config/         # Configuration files (database, etc.)
├── controllers/    # Route controllers
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Main server file
```

## NPM Scripts

All test scripts can be run via npm commands:

```bash
# Test database connection
npm run test:db

# Test models
npm run test:models

# Verify design compliance
npm run verify:models

# Test Groq API
npm run test:groq

# Test Natural Language API
npm run test:nl

# Test Specs API
npm run test:specs
```

## Adding New Files

### Adding Documentation

1. Create the `.md` file in `docs/` folder
2. Update `docs/README.md` with a link to the new document
3. Reference it in the main `README.md` if needed

**Example:**
```bash
# Create new documentation
touch docs/NEW_FEATURE_GUIDE.md

# Edit docs/README.md to add link
# Edit README.md if it's important enough
```

### Adding Test Scripts

1. Create the `.js` file in `test-scripts/` folder
2. Use relative imports: `../src/...`
3. Use dotenv with path: `dotenv.config({ path: '../.env' })`
4. Add npm script in `package.json`
5. Update `test-scripts/README.md`

**Example:**
```bash
# Create new test script
touch test-scripts/test-new-feature.js

# Add to package.json scripts:
"test:new-feature": "node test-scripts/test-new-feature.js"

# Update test-scripts/README.md
```

### Adding Source Code

1. Place in appropriate `src/` subfolder
2. Follow existing patterns
3. Export from index files if needed

## Benefits of This Organization

### ✅ Clarity
- Easy to find documentation
- Easy to find tests
- Easy to find source code

### ✅ Maintainability
- Clear separation of concerns
- Consistent structure
- Easy to navigate

### ✅ Scalability
- Can add more docs without cluttering root
- Can add more tests without cluttering root
- Source code stays organized

### ✅ Professional
- Industry-standard structure
- Easy for new developers to understand
- Clean repository

## Migration Notes

All existing files have been moved to their appropriate folders:

**Moved to `docs/`:**
- GROQ_API_SETUP.md
- NL_ENGINE_README.md
- MODELS_DOCUMENTATION.md
- MODELS_REQUIREMENTS_CHECKLIST.md
- TASK_2_COMPLETION_SUMMARY.md
- TASK_4_COMPLETION_SUMMARY.md

**Moved to `test-scripts/`:**
- test-connection.js
- test-models.js
- test-groq-connection.js
- test-groq-streaming.js
- test-nl-api.js
- test-specs-api.js
- verify-design-compliance.js

**Updated:**
- All import paths in test scripts
- All dotenv.config() calls
- package.json scripts
- Created README files in both folders

## Quick Reference

| File Type | Location | Example |
|-----------|----------|---------|
| Documentation | `docs/` | `docs/API_GUIDE.md` |
| Test Scripts | `test-scripts/` | `test-scripts/test-api.js` |
| Source Code | `src/` | `src/models/User.js` |
| Config | Root or `src/config/` | `.env`, `src/config/database.js` |

## Checklist for New Files

- [ ] Is it documentation? → Put in `docs/`
- [ ] Is it a test script? → Put in `test-scripts/`
- [ ] Is it source code? → Put in `src/`
- [ ] Update relevant README files
- [ ] Add npm script if needed
- [ ] Use correct import paths

---

**Remember:** Keep the project organized! Future you (and your team) will thank you. 🎉
