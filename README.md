# Flex ERP PoC - Inventory Management System

A proof-of-concept ERP inventory management system built with React, Go, and PostgreSQL.

## 🚀 Quick Start

```bash
# Setup everything
npm run setup

# Start development servers
npm run dev
```

Visit:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 📋 Features

### ✅ Phase 1: Foundation (Complete)
- PostgreSQL database with Docker
- Go backend with JWT authentication
- React frontend with TypeScript
- Development environment setup

### 🚧 Upcoming Phases
- **Phase 2**: SKU Management
- **Phase 3**: Inventory Tracking
- **Phase 4**: Transaction System
- **Phase 5**: User Management
- **Phase 6**: Field Customization
- **Phase 7**: Change Logging
- **Phase 8**: File Import System

## 🏗️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for development and building
- **TailwindCSS** for styling
- **TanStack Router** for routing
- **TanStack Query** for data fetching

### Backend
- **Go 1.21+** with Gorilla Mux
- **PostgreSQL 15** database
- **JWT** authentication
- **Docker** for database

## 📁 Project Structure

```
flex-erp-poc/
├── backend/           # Go backend
│   ├── cmd/server/    # Main application
│   ├── internal/      # Private application code
│   └── go.mod         # Go modules
├── frontend/          # React frontend
│   ├── src/           # Source code
│   └── package.json   # Dependencies
├── database/          # Database files
│   ├── migrations/    # SQL migrations
│   └── seeds/         # Seed data
├── scripts/           # Development scripts
├── docs/              # Documentation
└── docker-compose.yml # Database setup
```

## 🛠️ Development

### Prerequisites
- Go 1.21+
- Node.js 18+
- pnpm (recommended)
- Docker

### Available Scripts

```bash
# Setup and development
npm run setup          # Full environment setup
npm run dev            # Start both backend and frontend
npm run build          # Build for production

# Individual services
npm run backend:dev    # Start Go backend only
npm run frontend:dev   # Start React frontend only

# Database
npm run db:up          # Start PostgreSQL
npm run db:down        # Stop PostgreSQL
npm run db:reset       # Reset database with fresh data
```

## 📚 Documentation

- [Technical Specification](./docs/spec.md)
- [Development Setup](./docs/setup.md)

## 🔧 Environment Configuration

### Backend (.env)
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/flex_erp_poc?sslmode=disable
PORT=8080
JWT_SECRET=your-secret-key-here
```

## 🧪 Testing the Setup

1. **Database**: `curl http://localhost:8080/health`
2. **Authentication**: POST to `/auth/login` with any email
3. **Frontend**: Access the React app at `http://localhost:5173`

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Mock authentication (accepts any email)

### Health
- `GET /health` - Server health check

*More endpoints will be added in upcoming phases*

## 🤝 Contributing

This is a proof-of-concept project. Each phase should be implemented and tested before moving to the next.

## 📄 License

MIT License