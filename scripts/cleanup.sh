#!/bin/bash

# Docker Workshop Platform Cleanup Script
# This script cleans up all resources created by the platform

set -e

echo "🧹 Docker Workshop Platform Cleanup"
echo "==================================="

echo "⚠️  This will remove ALL platform data including:"
echo "   • All containers"
echo "   • All volumes (database data will be lost)"
echo "   • All networks"
echo "   • All images"
echo ""

read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo "🛑 Stopping containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

echo "🗑️  Removing images..."
docker-compose down --rmi all 2>/dev/null || true

echo "🧽 Removing volumes..."
docker volume rm workshop_postgres_data 2>/dev/null || true
docker volume rm workshop_redis_data 2>/dev/null || true
docker volume rm workshop_backend_node_modules 2>/dev/null || true
docker volume rm workshop_frontend_node_modules 2>/dev/null || true

echo "🌐 Removing networks..."
docker network rm workshop-network 2>/dev/null || true

echo "🧼 Cleaning up dangling resources..."
docker system prune -f

echo "✅ Cleanup complete!"
echo ""
echo "To start fresh, run:"
echo "   ./scripts/setup.sh"
echo "   # or"
echo "   docker-compose up -d"