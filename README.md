# Docker Workshop Platform

A scalable platform for conducting Docker workshops with isolated browser-based environments. Features persistent authentication, comprehensive course catalog, and hands-on labs.

## ✨ Features

- 🔐 **Persistent Authentication** - Login once, works across restarts
- 📚 **Course Catalog** - 4 sample courses with 20+ hands-on labs
- 📊 **Progress Tracking** - Visual progress bars and completion stats
- 🛡️ **Secure by Default** - JWT authentication with refresh tokens
- 🐳 **Zero Setup** - One command deployment with Docker Compose
- 📱 **Responsive UI** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ajeetraina/docker-workshop-platform.git
cd docker-workshop-platform

# One-command setup
./setup.sh

# Access the platform
open http://localhost:3004
```

### Login Credentials
- **Email**: demo@docker.com
- **Password**: password123

## 🏗️ Architecture

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Frontend        │ │ Backend         │ │ Database        │
│ (React/Vite)    │◄──►│ (Node.js/Express)│◄──►│ (PostgreSQL)    │
│ Port: 3004      │ │ Port: 8000      │ │ Port: 5432      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 📁 Project Structure

```
docker-workshop-platform/
├── database/init/          # Auto-initialization scripts
│   ├── 01-schema.sql      # Database schema
│   ├── 02-demo-user.sql   # Demo user creation
│   └── 03-sample-data.sql # Sample courses & labs
├── backend/               # Node.js API server
├── frontend/              # React frontend
├── compose.yaml           # Docker Compose configuration
├── setup.sh              # One-command setup script
└── README.md
```

## 🔧 Development

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Local Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Environment Variables
All necessary environment variables are pre-configured in:
- `backend/.env.example` → `backend/.env`
- `frontend/.env.example` → `frontend/.env`

## 📊 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3004 | React application |
| Backend API | http://localhost:8000 | Node.js API server |
| Database UI | http://localhost:8080 | Adminer (postgres admin) |
| Redis UI | http://localhost:8081 | Redis Commander |

## 🧪 API Endpoints

- `GET /health` - Health check
- `POST /api/auth/login` - User authentication
- `GET /api/courses` - Course catalog
- `GET /api/progress` - User progress
- `POST /api/auth/refresh` - Token refresh

## 🔐 Authentication

The platform uses JWT-based authentication with:
- Access tokens (7 days)
- Refresh tokens (30 days)
- Secure bcrypt password hashing
- Persistent sessions across restarts

## 📚 Sample Content

- **Docker Fundamentals** (5 labs)
- **Docker Compose Deep Dive** (5 labs)
- **Introduction to Kubernetes** (Advanced)
- **Docker Security Best Practices**

## 🗄️ Database

PostgreSQL with automatic initialization:
- User management with roles
- Course and lab structure
- Progress tracking
- Session management

Data persists across container restarts using Docker volumes.

## 🔄 Updates

To update your platform:
```bash
git pull origin main
docker compose up --build -d
```

## 🐛 Troubleshooting

### Reset Everything
```bash
docker compose down -v
docker compose up --build -d
```

### Check Logs
```bash
docker compose logs backend
docker compose logs frontend
```

### Database Issues
```bash
# Access database directly
docker compose exec postgres psql -U workshop_user -d workshop_platform

# Check demo user
SELECT * FROM users WHERE email = 'demo@docker.com';
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./setup.sh`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built for the Docker community to provide hands-on learning experiences.
