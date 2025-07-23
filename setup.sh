#!/bin/bash

# Docker Workshop Platform Setup
# One-command setup for a fully working platform

set -e

echo "🚀 Setting up Docker Workshop Platform..."

# Check dependencies
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is required. Please install Docker Compose first."
    exit 1
fi

# Setup environment files
echo "📝 Setting up environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

# Start the platform
echo "🐳 Starting Docker Workshop Platform..."
docker compose up --build -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 20

# Health check
echo "🔍 Checking service health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "⚠️ Backend may still be starting..."
fi

if curl -s http://localhost:3004 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️ Frontend may still be starting..."
fi

echo ""
echo "🎉 Docker Workshop Platform is ready!"
echo ""
echo "📱 Frontend:    http://localhost:3004"
echo "🔧 Backend:     http://localhost:8000"
echo "📊 Database UI: http://localhost:8080 (Adminer)"
echo "🗄️ Redis UI:    http://localhost:8081"
echo ""
echo "🔐 Demo Login:"
echo "   Email:    demo@docker.com"
echo "   Password: password123"
echo ""
echo "✨ Happy learning with Docker! 🐳"
