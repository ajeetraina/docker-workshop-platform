# Quick Start Guide

This guide will get you up and running with the Docker Workshop Platform in under 5 minutes.

## Prerequisites

- Docker and Docker Compose
- Git
- Port 3000, 5432, 6379, 8000, 8080, 8081 available

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ajeetraina/docker-workshop-platform.git
cd docker-workshop-platform
```

### 2. Set Up Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit environment variables if needed
nano backend/.env
```

### 3. Start the Platform

```bash
# Start all services
docker-compose up -d

# Watch logs (optional)
docker-compose logs -f backend
```

### 4. Verify Installation

```bash
# Check API health
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2025-07-22T07:30:00.000Z",
#   "uptime": 10.5,
#   "environment": "development",
#   "version": "1.0.0"
# }
```

## 🎯 Testing the API

### Register a New User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "fullName": "Test User",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Browse Courses

```bash
curl http://localhost:8000/api/courses
```

## 🛠️ Development Tools

- **API**: http://localhost:8000
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)
- **Frontend**: http://localhost:3000 (Coming in Phase 2)

## 📊 Database Access

### Using Adminer (Web Interface)
1. Go to http://localhost:8080
2. Login with:
   - **System**: PostgreSQL
   - **Server**: postgres
   - **Username**: workshop_user
   - **Password**: workshop_pass
   - **Database**: workshop_platform

### Using psql (Command Line)
```bash
# Connect to database
docker exec -it workshop-postgres psql -U workshop_user -d workshop_platform

# List tables
\dt

# View users
SELECT * FROM users;
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check which ports are in use
   sudo lsof -i :8000
   sudo lsof -i :5432
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **Database connection issues**
   ```bash
   # Check if postgres is healthy
   docker-compose ps postgres
   
   # View postgres logs
   docker-compose logs postgres
   ```

3. **Backend not starting**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Rebuild backend
   docker-compose build backend
   docker-compose up -d backend
   ```

### Reset Everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## 📝 Next Steps

1. **Explore the API**: Use the endpoints documented above
2. **Check the database**: Browse tables using Adminer
3. **Read the code**: Explore the backend source code in `backend/src/`
4. **Wait for Phase 2**: Frontend and workshop orchestration coming soon!

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/ajeetraina/docker-workshop-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ajeetraina/docker-workshop-platform/discussions)
- **Documentation**: [docs/](../docs/)

---

**🎉 Congratulations! You now have a running Docker Workshop Platform!**