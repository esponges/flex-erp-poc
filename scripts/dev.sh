#!/bin/bash

echo "🚀 Starting Flex ERP PoC in development mode..."

# Check if database is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "📦 Starting database..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    until docker-compose exec -T postgres pg_isready -U postgres; do
        sleep 1
    done
fi

# Start backend and frontend in parallel
echo "🏃 Starting backend and frontend..."

# Kill any existing processes on these ports
pkill -f "go run.*main.go" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Start backend
cd backend && go run cmd/server/main.go &
BACKEND_PID=$!

# Start frontend
cd ../frontend && pnpm dev &
FRONTEND_PID=$!

echo "✅ Backend started on http://localhost:8080"
echo "✅ Frontend started on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for interrupt signal
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait