#!/bin/bash

# Docker Workshop Platform Setup Script
# This script sets up the development environment

set -e

echo "🐳 Docker Workshop Platform Setup"
echo "================================="

# Check dependencies
echo "📋 Checking dependencies..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if ports are available
echo "🔍 Checking available ports..."

ports=(3000 5432 6379 8000 8080 8081)
for port in "${ports[@]}"; do
    if lsof -i :$port &> /dev/null; then
        echo "⚠️  Port $port is in use. You may need to stop conflicting services."
    else
        echo "✅ Port $port is available"
    fi
done

# Set up environment file
echo "⚙️  Setting up environment..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from template"
else
    echo "✅ backend/.env already exists"
fi

# Start services
echo "🚀 Starting Docker Workshop Platform..."

docker-compose down -v 2>/dev/null || true
docker-compose build
docker-compose up -d

echo "⏳ Waiting for services to be ready..."

# Wait for backend to be healthy
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend API is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend API failed to start. Check logs with: docker-compose logs backend"
        exit 1
    fi
    sleep 2
done

# Test API
echo "🧪 Testing API..."

if response=$(curl -s http://localhost:8000/health); then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Docker Workshop Platform is running."
echo ""
echo "📍 Access Points:"
echo "   • API:           http://localhost:8000"
echo "   • Health Check:  http://localhost:8000/health"
echo "   • Database:      http://localhost:8080 (Adminer)"
echo "   • Redis:         http://localhost:8081 (Redis Commander)"
echo "   • Frontend:      http://localhost:3000 (Coming in Phase 2)"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs:     docker-compose logs -f"
echo "   • Stop platform: docker-compose down"
echo "   • Reset data:    docker-compose down -v"
echo ""
echo "📚 Next Steps:"
echo "   • Read docs/QUICK_START.md for API examples"
echo "   • Test registration: curl -X POST http://localhost:8000/api/auth/register -H 'Content-Type: application/json' -d '{...}'"
echo "   • Explore database: Visit http://localhost:8080"
echo ""
echo "Happy coding! 🚀"