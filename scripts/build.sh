#!/bin/bash

echo "🔨 Building Flex ERP PoC..."

# Build backend
echo "🏗️ Building backend..."
cd backend
go build -o bin/server cmd/server/main.go
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
pnpm build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "✅ Build complete!"
echo "Backend binary: ./backend/bin/server"
echo "Frontend dist: ./frontend/dist"