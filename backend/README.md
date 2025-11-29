# APIZombie Backend

AI-powered API testing and integration platform backend built with Node.js, Express, and MongoDB.

## 📁 Project Structure

```
backend/
├── docs/                    # 📚 All documentation files
│   ├── README.md
│   ├── GROQ_API_SETUP.md
│   ├── NL_ENGINE_README.md
│   ├── MODELS_DOCUMENTATION.md
│   ├── MODELS_REQUIREMENTS_CHECKLIST.md
│   ├── TASK_2_COMPLETION_SUMMARY.md
│   └── TASK_4_COMPLETION_SUMMARY.md
│
├── src/                     # 💻 Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
│
├── test-scripts/           # 🧪 Test and verification scripts
│   ├── README.md
│   ├── test-connection.js
│   ├── test-models.js
│   ├── test-groq-connection.js
│   ├── test-nl-api.js
│   ├── test-specs-api.js
│   └── verify-design-compliance.js
│
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Groq API key

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Individual Tests
```bash
# Test database connection
npm run test:db

# Test Mongoose models
npm run test:models

# Verify design compliance
npm run verify:models

# Test Groq API connection
npm run test:groq

# Test Natural Language API
npm run test:nl

# Test Specs API
npm run test:specs
```

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/MODELS_DOCUMENTATION.md](docs/MODELS_DOCUMENTATION.md)** - Database models reference
- **[docs/GROQ_API_SETUP.md](docs/GROQ_API_SETUP.md)** - Groq API setup guide
- **[docs/NL_ENGINE_README.md](docs/NL_ENGINE_README.md)** - Natural Language Engine docs

## 🗄️ Database Models

The application uses 6 Mongoose models:

1. **APISpec** - API specifications (OpenAPI, GraphQL, gRPC)
2. **APIRequest** - Saved API requests
3. **Workflow** - Multi-step API workflows
4. **TestSuite** - Generated test suites
5. **RequestHistory** - Execution history (90-day TTL)
6. **AuthConfig** - Encrypted authentication configs

See [docs/MODELS_DOCUMENTATION.md](docs/MODELS_DOCUMENTATION.md) for details.

## 🔧 Environment Variables

Required environment variables in `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/apizombie

# Groq API
GROQ_API_KEY=your_groq_api_key_here

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your_jwt_secret_here
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm test` | Run Jest test suite |
| `npm run test:db` | Test database connection |
| `npm run test:models` | Test Mongoose models |
| `npm run test:groq` | Test Groq API connection |
| `npm run test:nl` | Test Natural Language API |
| `npm run test:specs` | Test Specs API |
| `npm run verify:models` | Verify models comply with design |

## 🏗️ Architecture

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI/LLM**: Groq API for natural language processing
- **Authentication**: JWT with encrypted credential storage
- **API Protocols**: REST, GraphQL, gRPC support

## 🔐 Security Features

- AES-256-CBC encryption for sensitive credentials
- JWT-based authentication
- Rate limiting on API endpoints
- Helmet.js security headers
- Input validation and sanitization
- CORS configuration

## 📝 API Endpoints

### Natural Language
- `POST /api/nl/parse` - Convert natural language to API request

### API Specifications
- `POST /api/specs/upload` - Upload API specification
- `GET /api/specs` - List all specifications
- `GET /api/specs/:id` - Get specification details
- `DELETE /api/specs/:id` - Delete specification

### Execution
- `POST /api/execute` - Execute API request
- `POST /api/execute/workflow` - Execute workflow

### More endpoints documented in [docs/](docs/)

## 🤝 Contributing

1. Follow the organized structure:
   - Place test scripts in `test-scripts/`
   - Place documentation in `docs/`
   - Place source code in `src/`

2. Update relevant documentation when making changes

3. Run tests before committing:
   ```bash
   npm run test:models
   npm run verify:models
   ```

## 📄 License

MIT

## 🔗 Related

- [Frontend README](../frontend/README.md)
- [Project Specifications](.kiro/specs/api-zombie/)
