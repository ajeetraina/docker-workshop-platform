# Docker Workshop Platform 🐳

A scalable platform for conducting Docker workshops with isolated browser-based environments. Built on the foundation of [workshop-poc-infra](https://github.com/ajeetraina/workshop-poc-infra) to provide seamless hands-on Docker learning experiences.

## 🎯 Vision

Create a Netflix-like experience for Docker learning where users login, browse courses, and immediately start hands-on labs without any setup required.

## ✨ Features

- **Zero Setup Learning**: Access Docker environments through any web browser
- **Isolated Workspaces**: Each user gets their own secure Docker environment
- **Real Docker Experience**: Actual Docker commands, not simulations
- **Progressive Learning**: From basics to advanced topics
- **Auto-validation**: Automated checking of lab completion
- **Persistent Progress**: Resume where you left off
- **Scalable Architecture**: Supports hundreds of concurrent users

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Orchestrator   │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (Kubernetes)   │
│                 │    │                 │    │                 │
│ • Course Browse │    │ • User Auth     │    │ • Workshop      │
│ • Lab Interface │    │ • Progress API  │    │   Instances     │
│ • Progress      │    │ • Session Mgmt  │    │ • Auto-cleanup  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │   (PostgreSQL)  │
                    │                 │
                    │ • Users         │
                    │ • Courses       │
                    │ • Progress      │
                    │ • Sessions      │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15+
- Kubernetes cluster (for production)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/ajeetraina/docker-workshop-platform.git
cd docker-workshop-platform
```

2. **Start the development environment**
```bash
# Start all services
docker-compose up -d

# Initialize database
npm run db:migrate

# Start frontend development server
cd frontend && npm run dev

# Start backend API server
cd backend && npm run dev
```

3. **Access the platform**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- Database: localhost:5432

## 📚 Project Structure

```
docker-workshop-platform/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   └── middleware/     # Express middleware
│   └── package.json
├── orchestrator/           # Workshop instance manager
│   ├── src/
│   │   ├── managers/       # Workshop lifecycle management
│   │   ├── templates/      # Kubernetes templates
│   │   └── utils/          # Helper utilities
│   └── package.json
├── database/               # Database schemas and migrations
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── content/               # Course content repositories
│   ├── docker-fundamentals/
│   ├── docker-compose/
│   └── kubernetes-basics/
├── infra/                # Infrastructure as code
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
└── docs/                 # Documentation
    ├── api/
    ├── deployment/
    └── development/
```

## 🔄 Implementation Phases

### ✅ Phase 1: MVP Foundation (Weeks 1-4)
- [x] Project structure and documentation
- [x] Database schema design
- [x] Basic authentication system
- [x] Simple course catalog
- [x] Workshop orchestration foundation
- [ ] Basic frontend interface
- [ ] Workshop instance management
- [ ] Simple progress tracking

### 🔄 Phase 2: Core Features (Weeks 5-8)
- [ ] Enhanced lab interface
- [ ] Auto-validation system
- [ ] Progress persistence
- [ ] Multi-user testing
- [ ] Performance optimization
- [ ] Security hardening

### ⏳ Phase 3: Production Ready (Weeks 9-12)
- [ ] Kubernetes deployment
- [ ] Monitoring & logging
- [ ] Load testing
- [ ] Documentation completion
- [ ] Production deployment
- [ ] User acceptance testing

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication tokens

### Infrastructure
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **NGINX** - Load balancing and reverse proxy
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 📊 Performance Targets

- **Workshop Startup Time**: < 30 seconds
- **Concurrent Users**: 500+ without degradation
- **System Uptime**: 99.9%
- **API Response Time**: < 200ms (95th percentile)
- **Course Completion Rate**: > 70%

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the foundation of [workshop-poc-infra](https://github.com/ajeetraina/workshop-poc-infra)
- Inspired by the Docker community's need for better hands-on learning
- Thanks to all contributors and testers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ajeetraina/docker-workshop-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ajeetraina/docker-workshop-platform/discussions)
- **Documentation**: [docs/](./docs/)

---

**🚀 Ready to transform Docker education? Let's build the future of hands-on learning!**
