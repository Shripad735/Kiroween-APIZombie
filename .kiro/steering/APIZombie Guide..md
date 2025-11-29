---
inclusion: always
---

# APIZombie Project Guidelines

## Documentation Policy
- Do not create completion summaries, verification documents, or other .md files after completing tasks unless explicitly requested
- Keep documentation minimal and focused on essential information only

## Project Architecture
- Backend: Node.js/Express API with MongoDB
- Frontend: React with Vite, TailwindCSS
- Key features: Natural language API testing, protocol translation (REST/GraphQL/gRPC), workflow automation, test generation

## Code Organization
- Backend services in `backend/src/services/` handle core logic
- Controllers in `backend/src/controllers/` manage API endpoints
- Protocol handlers in `backend/src/handlers/` support REST, GraphQL, and gRPC
- Frontend pages in `frontend/src/pages/` correspond to major features
- Mongoose models in `backend/src/models/` define data schemas

## Development Practices
- Follow established patterns in existing controllers and services
- Maintain consistent error handling using `responseFormatter` utility
- Use the logger utility for consistent logging across services
- Keep API responses consistent with existing format conventions

## Key Dependencies
- Backend: Express, Mongoose, Groq AI SDK, Axios
- Frontend: React, React Router, TailwindCSS, Lucide React icons
- Protocol support: GraphQL (graphql-request), gRPC (@grpc/grpc-js)

## Testing Approach
- Test scripts are provided for manual verification
- Run relevant test scripts after making changes to verify functionality
