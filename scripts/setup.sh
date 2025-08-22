#!/bin/bash

echo "🚀 Setting up Flex ERP PoC..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T postgres pg_isready -U postgres; do
    sleep 1
done

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend && go mod tidy && cd ..

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd frontend && pnpm install && cd ..

# Copy environment files
echo "📄 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from example"
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "  npm run dev    # Start both frontend and backend"
echo "  or"
echo "  ./scripts/dev.sh"