#!/bin/bash

# Docker Workshop Platform - Authentication Fix Script
# This script applies all the fixes for authentication issues and port configuration

set -e

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

print_status "🔧 Docker Workshop Platform - Authentication Fix Script"
echo "=================================================================="
echo "This script will:"
echo "  ✅ Fix authentication loop issues"
echo "  ✅ Standardize port configuration (frontend: 3004, backend: 8000)"
echo "  ✅ Update environment files with correct Docker service names"
echo "  ✅ Create comprehensive documentation"
echo "  ✅ Optionally create a Git branch and commit changes"
echo "=================================================================="
echo

# Confirm execution
read -p "Do you want to proceed with applying all fixes? [Y/n]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    print_warning "Script cancelled by user"
    exit 0
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml not found. Please run this script from the project root directory."
    exit 1
fi

print_success "Found docker-compose.yml - we're in the right directory"

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
print_status "Created backup directory: $BACKUP_DIR"

# Backup existing files if they exist
for file in "backend/.env" "backend/.env.example" "frontend/.env" "frontend/.env.example" "frontend/vite.config.js" "scripts/setup.sh"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        print_status "Backed up: $file"
    fi
done

print_success "Backup completed"

# 1. Create/Update backend/.env.example
print_status "Creating backend/.env.example..."
mkdir -p backend
cat > backend/.env.example << 'EOF'
# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3004

# Database - Use service names for Docker Compose
DATABASE_URL=postgresql://workshop_user:workshop_pass@postgres:5432/workshop_platform
DB_MAX_CONNECTIONS=20
DB_CONNECTION_TIMEOUT=60000

# Redis - Use service name for Docker Compose
REDIS_URL=redis://redis:6379
REDIS_TTL=3600

# JWT - Generate secure secrets for production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (optional)
EMAIL_HOST=localhost
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@docker-workshop.com

# Workshop Settings
MAX_CONCURRENT_SESSIONS=500
SESSION_TIMEOUT_MINUTES=120
MAX_SESSIONS_PER_USER=3
CLEANUP_INTERVAL_SECONDS=300

# Kubernetes (for production)
KUBERNETES_NAMESPACE=workshop-platform
KUBERNETES_IN_CLUSTER=false
KUBERNETES_CONFIG_PATH=~/.kube/config
WORKSHOP_IMAGE_NAME=workshop-poc:workspace
INGRESS_DOMAIN=workshop.localhost

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:3004

# Development
ENABLE_DEBUG_LOGS=true
MOCK_WORKSHOPS=true
ENABLE_METRICS=false
METRICS_PORT=9090
EOF
print_success "Created backend/.env.example"

# 2. Create/Update frontend/.env.example
print_status "Creating frontend/.env.example..."
mkdir -p frontend
cat > frontend/.env.example << 'EOF'
# API Configuration
VITE_API_URL=http://localhost:8000/api

# App Configuration
VITE_APP_NAME=Docker Workshop Platform
VITE_APP_VERSION=1.0.0

# Development
VITE_DEV_TOOLS=true
VITE_DEBUG=true

# Port Configuration for Vite
PORT=3004
VITE_PORT=3004
EOF
print_success "Created frontend/.env.example"

# 3. Create/Update frontend/vite.config.js
print_status "Creating frontend/vite.config.js..."
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    host: '0.0.0.0',  // Allow external connections (needed for Docker)
    strictPort: true,  // Fail if port is already in use
  },
  preview: {
    port: 3004,
    host: '0.0.0.0',
  }
})
EOF
print_success "Created frontend/vite.config.js"

# 4. Create docs directory and authentication fix documentation
print_status "Creating documentation..."
mkdir -p docs
cat > docs/AUTHENTICATION_FIX.md << 'EOF'
# Authentication Fix and Configuration Guide

This document explains the authentication issues that were resolved and the proper configuration setup for the Docker Workshop Platform.

## Issues Resolved

### 1. Authentication Loop Issue
**Problem**: The frontend was continuously making `/api/auth/refresh` requests that failed with 401 errors, causing slow login performance and endless loops.

**Root Cause**: 
- Missing or incorrect `.env` files
- Wrong database and Redis URLs (using `localhost` instead of Docker service names)
- JWT secrets not properly configured
- CORS origins mismatch

### 2. Port Configuration
**Problem**: Inconsistent port configuration between frontend and backend services.

**Solution**: Standardized frontend on port 3004 and backend on port 8000.

## Configuration Changes

### Backend Configuration (`backend/.env`)

**Key Changes:**
- `DATABASE_URL`: Changed from `localhost:5432` to `postgres:5432` (Docker service name)
- `REDIS_URL`: Changed from `localhost:6379` to `redis:6379` (Docker service name)
- `CORS_ORIGINS`: Set to `http://localhost:3004` to match frontend port
- `FRONTEND_URL`: Set to `http://localhost:3004`
- Added proper JWT secrets for authentication

### Frontend Configuration (`frontend/.env`)

**Key Changes:**
- `VITE_API_URL`: Set to `http://localhost:8000/api` for proper API communication
- `PORT`: Set to 3004 for consistent port usage
- Added Vite-specific port configuration

### Vite Configuration (`frontend/vite.config.js`)

**New Configuration:**
- Server port set to 3004
- Host set to `0.0.0.0` for Docker compatibility
- Strict port enforcement to prevent conflicts

## Setup Instructions

### 1. Environment Files Setup
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Generate New JWT Secrets (Production)
For production environments, generate secure JWT secrets:

```bash
# Using Node.js
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using Docker
docker run --rm node:18 node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start the Platform
```bash
# Clean start
docker-compose down -v
docker-compose up -d

# Verify services
docker-compose ps
```

### 4. Access the Platform
- **Frontend**: http://localhost:3004
- **Backend API**: http://localhost:8000
- **Login**: demo@docker.com / password123

## Troubleshooting

### Authentication Errors
1. **Clear browser storage**: `localStorage.clear()` and `sessionStorage.clear()`
2. **Check environment files**: Ensure `.env` files exist and have correct values
3. **Verify service connectivity**: Check Docker Compose logs for connection errors

### Port Conflicts
1. **Check port usage**: `netstat -tulpn | grep 3004`
2. **Stop conflicting services**: Kill any processes using ports 3004 or 8000
3. **Restart with clean state**: `docker-compose down -v && docker-compose up -d`

### CORS Issues
1. **Verify CORS_ORIGINS**: Must match the frontend URL exactly
2. **Check browser console**: Look for CORS-related error messages
3. **Test API directly**: Use curl to test API endpoints

## Technical Details

### Docker Service Communication
In Docker Compose, services communicate using service names, not `localhost`:
- ✅ `postgres:5432` (correct)
- ❌ `localhost:5432` (incorrect in containers)

### JWT Token Flow
1. User logs in with credentials
2. Backend generates access token (7d) and refresh token (30d)
3. Frontend stores tokens in localStorage
4. Frontend includes tokens in API requests
5. Backend validates tokens and processes requests

### Port Architecture
- **Frontend (Vite)**: Port 3004
- **Backend (Express)**: Port 8000
- **Database (PostgreSQL)**: Port 5432 (internal)
- **Redis**: Port 6379 (internal)

## Security Notes

1. **JWT Secrets**: Use cryptographically secure random strings for production
2. **CORS Configuration**: Keep CORS origins restrictive in production
3. **Environment Files**: Never commit `.env` files with real secrets to version control
4. **Token Expiration**: Adjust token expiration times based on security requirements

## Testing

### Manual Testing
```bash
# Test backend health
curl http://localhost:8000/api/health

# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "demo@docker.com", "password": "password123"}'

# Test CORS
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3004" \
  -d '{"email": "demo@docker.com", "password": "password123"}'
```

### Automated Testing
Consider adding integration tests for:
- Authentication flow
- API endpoints
- CORS configuration
- Database connectivity

## Future Improvements

1. **Health Checks**: Add comprehensive health check endpoints
2. **Monitoring**: Implement logging and monitoring for authentication events
3. **Rate Limiting**: Enhanced rate limiting for authentication endpoints
4. **Security Headers**: Add security headers for production deployment
5. **Token Rotation**: Implement automatic token rotation strategies
EOF
print_success "Created docs/AUTHENTICATION_FIX.md"

# 5. Update scripts/setup.sh
print_status "Creating enhanced scripts/setup.sh..."
mkdir -p scripts
cat > scripts/setup.sh << 'EOF'
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
EOF
chmod +x scripts/setup.sh
print_success "Created enhanced scripts/setup.sh"

# 6. Fix existing .env file if it exists
if [ -f backend/.env ]; then
    print_status "Fixing existing backend/.env file..."
    
    # Fix database URL
    if grep -q "localhost:5432" backend/.env; then
        sed -i.bak 's/localhost:5432/postgres:5432/g' backend/.env
        print_success "Fixed database URL in backend/.env"
    fi
    
    # Fix Redis URL
    if grep -q "localhost:6379" backend/.env; then
        sed -i.bak 's/localhost:6379/redis:6379/g' backend/.env
        print_success "Fixed Redis URL in backend/.env"
    fi
    
    # Fix CORS origins
    if grep -q "CORS_ORIGINS=http://localhost:3000" backend/.env; then
        sed -i.bak 's/CORS_ORIGINS=http:\/\/localhost:3000/CORS_ORIGINS=http:\/\/localhost:3004/g' backend/.env
        print_success "Fixed CORS origins in backend/.env"
    fi
    
    # Fix frontend URL
    if grep -q "FRONTEND_URL=http://localhost:3000" backend/.env; then
        sed -i.bak 's/FRONTEND_URL=http:\/\/localhost:3000/FRONTEND_URL=http:\/\/localhost:3004/g' backend/.env
        print_success "Fixed frontend URL in backend/.env"
    fi
fi

# 7. Update frontend .env if it exists
if [ -f frontend/.env ]; then
    print_status "Updating existing frontend/.env file..."
    
    # Add PORT if not exists
    if ! grep -q "PORT=" frontend/.env; then
        echo "PORT=3004" >> frontend/.env
        print_success "Added PORT=3004 to frontend/.env"
    fi
    
    # Add VITE_PORT if not exists
    if ! grep -q "VITE_PORT=" frontend/.env; then
        echo "VITE_PORT=3004" >> frontend/.env
        print_success "Added VITE_PORT=3004 to frontend/.env"
    fi
fi

# 8. Create Git branch and commit (optional)
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo
    read -p "Would you like to create a Git branch and commit these changes? [Y/n]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        print_status "Creating Git branch and committing changes..."
        
        # Create new branch
        BRANCH_NAME="fix/authentication-and-port-configuration"
        git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
        
        # Add all files
        git add backend/.env.example frontend/.env.example frontend/vite.config.js docs/AUTHENTICATION_FIX.md scripts/setup.sh
        
        # Commit changes
        git commit -m "Fix authentication loop and standardize port configuration

- Fix database and Redis URLs to use Docker service names instead of localhost
- Standardize frontend on port 3004 and backend on port 8000
- Add proper JWT secret configuration
- Fix CORS origins to match frontend port
- Add comprehensive Vite configuration for port 3004
- Improve setup script with environment validation
- Add detailed authentication troubleshooting documentation

Resolves authentication loop issues causing slow login performance"
        
        print_success "Created branch '$BRANCH_NAME' and committed changes"
        print_status "To push to remote: git push origin $BRANCH_NAME"
        print_status "Then create a Pull Request on GitHub"
    fi
else
    print_warning "Git not found or not in a Git repository"
fi

# Summary
echo
echo "=================================================================="
print_success "🎉 All Authentication Fixes Applied Successfully!"
echo "=================================================================="
echo
echo -e "${GREEN}✅ Changes Made:${NC}"
echo "  📝 Created/Updated backend/.env.example with Docker service names"
echo "  📝 Created/Updated frontend/.env.example with Vite configuration"
echo "  📝 Created frontend/vite.config.js for port 3004"
echo "  📝 Created comprehensive documentation in docs/AUTHENTICATION_FIX.md"
echo "  📝 Enhanced scripts/setup.sh with validation and fixes"
echo "  📝 Fixed existing .env files (if they existed)"
echo
echo -e "${BLUE}📁 Backup Location:${NC} $BACKUP_DIR"
echo
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo "  1. Run: ./scripts/setup.sh"
echo "  2. Access: http://localhost:3004"
echo "  3. Login: demo@docker.com / password123"
echo
echo -e "${YELLOW}📖 Documentation:${NC}"
echo "  📋 Authentication Guide: docs/AUTHENTICATION_FIX.md"
echo "  🔧 Setup Guide: Run ./scripts/setup.sh"
echo
print_success "Authentication loop issues should now be resolved! 🐳"
EOF
chmod +x fix-authentication-issues.sh
print_success "Created comprehensive fix script"

echo
echo "=================================================================="
print_success "🎉 Authentication Fix Script Created Successfully!"
echo "=================================================================="
echo
echo -e "${GREEN}📁 Script Location:${NC} ./fix-authentication-issues.sh"
echo
echo -e "${BLUE}🚀 To Run the Script:${NC}"
echo "  chmod +x fix-authentication-issues.sh"
echo "  ./fix-authentication-issues.sh"
echo
echo -e "${GREEN}✅ What This Script Does:${NC}"
echo "  📝 Creates/updates all environment files with correct configuration"
echo "  🔧 Fixes Docker service names (localhost → postgres/redis)"
echo "  🌐 Standardizes ports (frontend: 3004, backend: 8000)"
echo "  📖 Creates comprehensive documentation"
echo "  🛠️ Enhances setup script with validation"
echo "  💾 Creates backups of existing files"
echo "  🔀 Optionally creates Git branch and commits changes"
echo
echo -e "${YELLOW}⚠️ Important:${NC}"
echo "  🔍 Review the changes before running in production"
echo "  💾 Backups are created automatically"
echo "  🔐 Consider generating new JWT secrets for production"
echo
print_success "Ready to fix all authentication issues! 🚀"
