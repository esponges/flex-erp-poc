#!/bin/bash

echo "🚀 Starting Flex ERP PoC in development mode..."

# Function to cleanup all processes
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill processes by PID if available
    if [ ! -z "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
    fi
    
    # Kill any remaining processes by name/port
    pkill -f "dlv.*server" 2>/dev/null || true
    pkill -f "backend/bin/server" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    # Kill processes using specific ports
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:2345 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    echo "✅ All services stopped"
    exit 0
}

# Set up trap for cleanup for ctrl+c exit event
trap cleanup INT TERM

# Initial cleanup to ensure clean start
echo "🧹 Cleaning up any existing processes..."
cleanup() {
    pkill -f "dlv.*server" 2>/dev/null || true
    pkill -f "backend/bin/server" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:2345 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
}
cleanup

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
echo "🏃 Rebuilding and starting backend and frontend..."

# Rebuild backend binary
echo "🔨 Building backend binary..."
if ! npm run backend:build; then
    echo "❌ Backend build failed!"
    exit 1
fi

# Start backend in debug mode with Delve
echo "🚀 Starting backend in debug mode..."
cd backend
dlv exec bin/server --headless --listen=:2345 --api-version=2 &
BACKEND_PID=$!
cd ..

# Give backend a moment to start
sleep 2

# Verify backend started
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend..."
cd frontend && pnpm dev &
FRONTEND_PID=$!
cd ..

# Give frontend a moment to start
sleep 2

# Verify frontend started
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "❌ Frontend failed to start!"
    cleanup
    exit 1
fi

echo ""
echo "🎉 Services started successfully!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8080"
echo "🐛 Debugger: :2345 (use 'Attach to backend debugger')"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to restore cleanup for shutdown
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    
    # Kill processes by PID if available
    if [ ! -z "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID"
    fi
    
    # Kill any remaining processes by name/port
    pkill -f "dlv.*server" 2>/dev/null || true
    pkill -f "backend/bin/server" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    # Kill processes using specific ports
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    lsof -ti:2345 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    
    echo "✅ All services stopped"
    exit 0
}

# Reset trap for the main wait loop
trap cleanup INT TERM

# Monitor processes and wait
while true; do
    # Check if backend is still running
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Backend process died unexpectedly!"
        cleanup
        exit 1
    fi
    
    # Check if frontend is still running  
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "❌ Frontend process died unexpectedly!"
        cleanup
        exit 1
    fi
    
    sleep 1
done
