import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
] as const;

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Environment configuration
export const config = {
  // Application
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  appName: 'Docker Workshop Platform',
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3004',
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000', 10),
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL!,
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10), // 1 hour default
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  // Email
  email: {
    host: process.env.EMAIL_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@docker-workshop.com',
  },
  
  // Workshop settings
  workshop: {
    maxConcurrentSessions: parseInt(process.env.MAX_CONCURRENT_SESSIONS || '500', 10),
    sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '120', 10),
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '3', 10),
    cleanupIntervalSeconds: parseInt(process.env.CLEANUP_INTERVAL_SECONDS || '300', 10),
  },
  
  // Kubernetes
  kubernetes: {
    namespace: process.env.KUBERNETES_NAMESPACE || 'workshop-platform',
    inCluster: process.env.KUBERNETES_IN_CLUSTER === 'true',
    configPath: process.env.KUBERNETES_CONFIG_PATH,
    workshopImageName: process.env.WORKSHOP_IMAGE_NAME || 'workshop-poc:workspace',
    ingressDomain: process.env.INGRESS_DOMAIN || 'workshop.localhost',
  },
  
  // Monitoring
  monitoring: {
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3004'],
  },
  
  // Development
  development: {
    enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    mockWorkshops: process.env.MOCK_WORKSHOPS === 'true',
  },
} as const;

// Export environment types for TypeScript
export type Config = typeof config;

// Validate configuration
export const validateConfig = (): void => {
  // Validate port range
  if (config.port < 1024 || config.port > 65535) {
    throw new Error('PORT must be between 1024 and 65535');
  }
  
  // Validate database configuration
  if (!config.database.url.startsWith('postgres://') && !config.database.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Validate Redis configuration
  if (!config.redis.url.startsWith('redis://') && !config.redis.url.startsWith('rediss://') && !config.redis.url.startsWith('redis:')) {
    throw new Error('REDIS_URL must be a valid Redis connection string');
  }
  
  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate workshop limits
  if (config.workshop.maxConcurrentSessions < 1) {
    throw new Error('MAX_CONCURRENT_SESSIONS must be at least 1');
  }
  
  if (config.workshop.maxSessionsPerUser < 1) {
    throw new Error('MAX_SESSIONS_PER_USER must be at least 1');
  }
  
  console.log('✅ Configuration validated successfully');
};

// Validate configuration on import
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}
