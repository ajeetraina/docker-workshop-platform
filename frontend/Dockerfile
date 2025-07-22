# Multi-stage Dockerfile for React Frontend

# Base stage with common dependencies
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl ca-certificates

# Copy package files
COPY package*.json ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Install all dependencies (including dev dependencies)
# Use npm install since we might not have package-lock.json initially
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Default command for development (with hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production dependencies stage
FROM base AS production-deps
ENV NODE_ENV=production

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Build stage
FROM base AS build
ENV NODE_ENV=production

# Install all dependencies for building
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production
ENV NODE_ENV=production

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
    && adduser -S frontend -u 1001 -G nodejs

# Change ownership of nginx files
RUN chown -R frontend:nodejs /var/cache/nginx \
    && chown -R frontend:nodejs /var/log/nginx \
    && chown -R frontend:nodejs /etc/nginx/conf.d \
    && chown -R frontend:nodejs /usr/share/nginx/html

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost || exit 1

# Production command
CMD ["nginx", "-g", "daemon off;"]

# Default target is development
FROM development
