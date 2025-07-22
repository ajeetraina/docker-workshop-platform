#!/bin/bash

# Docker Workshop Platform Setup Script
# This script sets up the development environment with sample data

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

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env from template"
else
    echo "✅ frontend/.env already exists"
fi

# Start services
echo "🚀 Starting Docker Workshop Platform..."

docker-compose down -v 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to be ready..."

# Wait for database to be ready
echo "📊 Waiting for database..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U workshop_user -d workshop_platform &> /dev/null; then
        echo "✅ Database is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start. Check logs with: docker-compose logs postgres"
        exit 1
    fi
    sleep 2
done

# Wait for backend to be healthy
echo "🖥️  Waiting for backend API..."
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

# Load sample data
echo "📚 Loading sample data..."
if docker-compose exec -T postgres psql -U workshop_user -d workshop_platform -f /docker-entrypoint-initdb.d/sample_data.sql 2>/dev/null; then
    echo "✅ Sample data loaded successfully"
else
    echo "⚠️  Sample data may already be loaded or there was an error"
fi

# Wait for frontend to be ready
echo "🌐 Waiting for frontend..."
for i in {1..45}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 45 ]; then
        echo "⚠️  Frontend might still be starting. Check logs with: docker-compose logs frontend"
        # Don't exit here as frontend might just be slow
    fi
    sleep 2
done

# Test API endpoints
echo "🧪 Testing API..."

if response=$(curl -s http://localhost:8000/health); then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Test course endpoint
if curl -s http://localhost:8000/api/courses > /dev/null 2>&1; then
    echo "✅ Course API endpoint working"
else
    echo "❌ Course API endpoint failed"
fi

echo ""
echo "🎉 Setup complete! Docker Workshop Platform is running."
echo ""
echo "📍 Access Points:"
echo "   • Frontend:      http://localhost:3000"
echo "   • API:           http://localhost:8000"
echo "   • Health Check:  http://localhost:8000/health"
echo "   • Database:      http://localhost:8080 (Adminer)"
echo "   • Redis:         http://localhost:8081 (Redis Commander)"
echo ""
echo "🔑 Demo Credentials:"
echo "   • Email:         demo@docker.com"
echo "   • Password:      password123"
echo ""
echo "🔧 Useful Commands:"
echo "   • View logs:     docker-compose logs -f"
echo "   • Stop platform: docker-compose down"
echo "   • Reset data:    docker-compose down -v"
echo "   • Rebuild:       docker-compose build --no-cache"
echo ""
echo "📚 What's Available:"
echo "   • 4 sample courses with labs"
echo "   • Demo user with progress"
echo "   • Full authentication system"
echo "   • Course enrollment and progress tracking"
echo "   • Workshop session management"
echo ""
echo "🎯 Next Steps:"
echo "   • Visit http://localhost:3000 to explore the platform"
echo "   • Login with demo credentials to see sample data"
echo "   • Browse courses and enroll in Docker Fundamentals"
echo "   • Try creating a workshop session (mock environment)"
echo ""
echo "Happy coding! 🚀"
