# Development Setup

## Prerequisites

- [Go 1.21+](https://golang.org/dl/)
- [Node.js 18+](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Docker](https://www.docker.com/) for PostgreSQL

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repo-url>
   cd flex-erp-poc
   ./scripts/setup.sh
   ```

2. **Start development servers**:
   ```bash
   ./scripts/dev.sh
   # Or use npm scripts:
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080
   - Database: localhost:5432

## Manual Setup

### Database Setup
```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check database is running
docker-compose ps
```

### Backend Setup
```bash
cd backend

# Install dependencies
go mod tidy

# Copy environment file
cp .env.example .env

# Run the server
go run cmd/server/main.go
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Building for Production

```bash
./scripts/build.sh
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/flex_erp_poc?sslmode=disable
PORT=8080
JWT_SECRET=your-secret-key-here
```

## Project Structure

```
flex-erp-poc/
├── backend/           # Go backend
│   ├── cmd/server/    # Main application
│   ├── internal/      # Private application code
│   ├── go.mod         # Go modules
│   └── .env.example   # Environment template
├── frontend/          # React frontend
│   ├── src/           # Source code
│   ├── package.json   # Node dependencies
│   └── vite.config.ts # Vite configuration
├── database/          # Database files
│   ├── migrations/    # SQL migrations
│   └── seeds/         # Seed data
├── scripts/           # Development scripts
├── docs/              # Documentation
└── docker-compose.yml # Database setup
```

## Testing the Setup

1. Visit http://localhost:8080/health - should return `{"status": "ok"}`
2. Visit http://localhost:5173 - should show the React frontend
3. Try mock login with any email address

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Backend Issues
```bash
# Check Go modules
cd backend && go mod tidy

# Verify environment
cat backend/.env
```

### Frontend Issues
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
```