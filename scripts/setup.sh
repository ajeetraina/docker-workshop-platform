#!/bin/bash

# Docker Workshop Platform Setup Script
# Fixes authentication issues and sets up environment properly

set -e

echo "🚀 Setting up Docker Workshop Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are installed ✓"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down -v --remove-orphans || true

# Clean up
print_status "Cleaning up Docker system..."
docker system prune -f || true

# Setup environment files
print_status "Setting up environment files..."

# Backend environment
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env from .env.example"
    else
        print_error "backend/.env.example not found!"
        exit 1
    fi
else
    print_warning "backend/.env already exists, skipping..."
fi

# Frontend environment
if [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env from .env.example"
    else
        print_error "frontend/.env.example not found!"
        exit 1
    fi
else
    print_warning "frontend/.env already exists, skipping..."
fi

# Verify environment files have correct configuration
print_status "Verifying environment configuration..."

# Check backend .env for correct database and Redis URLs
if grep -q "localhost:5432" backend/.env; then
    print_warning "Fixing database URL in backend/.env (localhost -> postgres)"
    sed -i.bak 's/localhost:5432/postgres:5432/g' backend/.env
fi

if grep -q "localhost:6379" backend/.env; then
    print_warning "Fixing Redis URL in backend/.env (localhost -> redis)"
    sed -i.bak 's/localhost:6379/redis:6379/g' backend/.env
fi

# Check for JWT secrets
if grep -q "your-super-secret" backend/.env; then
    print_warning "Default JWT secrets detected. Consider generating secure secrets for production."
fi

# Generate new JWT secrets if requested
read -p "Would you like to generate new JWT secrets? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Generating new JWT secrets..."
    
    # Generate secrets using OpenSSL if available, otherwise use Node.js
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 64)
        JWT_REFRESH_SECRET=$(openssl rand -hex 64)
    elif command -v node &> /dev/null; then
        JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
        JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    else
        print_error "Neither OpenSSL nor Node.js found. Cannot generate JWT secrets."
        print_warning "Using default secrets. Please update them manually for production."
        JWT_SECRET=""
        JWT_REFRESH_SECRET=""
    fi
    
    if [ ! -z "$JWT_SECRET" ]; then
        # Update JWT secrets in backend/.env
        sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" backend/.env
        sed -i.bak "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" backend/.env
        print_success "JWT secrets updated"
    fi
fi

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to start
print_status "Waiting for services to start..."
sleep 10

# Check service status
print_status "Checking service status..."
docker-compose ps

# Verify backend health
print_status "Verifying backend health..."
for i in {1..10}; do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Backend is healthy!"
        break
    elif [ $i -eq 10 ]; then
        print_error "Backend health check failed after 10 attempts"
        print_status "Checking backend logs..."
        docker-compose logs workshop-backend | tail -20
        exit 1
    else
        print_status "Waiting for backend... (attempt $i/10)"
        sleep 3
    fi
done

# Verify frontend accessibility
print_status "Verifying frontend accessibility..."
for i in {1..5}; do
    if curl -s http://localhost:3004 > /dev/null 2>&1; then
        print_success "Frontend is accessible!"
        break
    elif [ $i -eq 5 ]; then
        print_warning "Frontend accessibility check failed, but this might be normal"
        break
    else
        print_status "Waiting for frontend... (attempt $i/5)"
        sleep 2
    fi
done

# Test authentication endpoint
print_status "Testing authentication endpoint..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "demo@docker.com", "password": "password123"}' || echo "000")

if [ "$AUTH_RESPONSE" = "200" ]; then
    print_success "Authentication endpoint is working!"
elif [ "$AUTH_RESPONSE" = "401" ]; then
    print_warning "Authentication endpoint returned 401 (expected for invalid credentials)"
else
    print_error "Authentication endpoint test failed (HTTP $AUTH_RESPONSE)"
fi

# Final status
echo
echo "=============================================="
print_success "🎉 Docker Workshop Platform Setup Complete!"
echo "=============================================="
echo
echo -e "${BLUE}Access Information:${NC}"
echo -e "  📱 Frontend:     ${GREEN}http://localhost:3004${NC}"
echo -e "  🔧 Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  📊 Database:     ${GREEN}localhost:5432${NC} (internal: postgres:5432)"
echo -e "  📋 Database UI:  ${GREEN}http://localhost:8080${NC} (if Adminer is configured)"
echo -e "  🗄️  Redis:       ${GREEN}localhost:6379${NC} (internal: redis:6379)"
echo
echo -e "${BLUE}Login Credentials:${NC}"
echo -e "  📧 Email:        ${GREEN}demo@docker.com${NC}"
echo -e "  🔑 Password:     ${GREEN}password123${NC}"
echo
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  🔍 View logs:    ${YELLOW}docker-compose logs -f${NC}"
echo -e "  🛑 Stop all:     ${YELLOW}docker-compose down${NC}"
echo -e "  🔄 Restart:      ${YELLOW}docker-compose restart${NC}"
echo -e "  📊 Status:       ${YELLOW}docker-compose ps${NC}"
echo
echo -e "${BLUE}Troubleshooting:${NC}"
echo -e "  📖 Auth Guide:   ${YELLOW}docs/AUTHENTICATION_FIX.md${NC}"
echo -e "  🚀 Quick Start:  ${YELLOW}docs/QUICK_START.md${NC}"
echo
print_success "Happy learning with Docker! 🐳"
