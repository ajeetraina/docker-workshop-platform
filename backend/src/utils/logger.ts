import winston from 'winston';
import { config } from '@/config/env';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define log format for production (JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define which logs to print based on environment
const level = () => {
  const env = config.env || 'development';
  const isDevelopment = env === 'development';
  
  if (isDevelopment || config.development.enableDebugLogs) {
    return 'debug';
  }
  
  return 'info';
};

// Define transports
const transports = [];

// Console transport
if (config.env !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: level(),
      format: format,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      level: level(),
      format: productionFormat,
    })
  );
}

// File transports for production
if (config.env === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
    })
  );
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: config.env === 'production' ? productionFormat : format,
  transports,
  exitOnError: false,
});

// Extend logger with custom methods
export interface CustomLogger extends winston.Logger {
  request: (message: string, meta?: any) => void;
  security: (message: string, meta?: any) => void;
  workshop: (message: string, meta?: any) => void;
  database: (message: string, meta?: any) => void;
  auth: (message: string, meta?: any) => void;
}

// Add custom log methods
(logger as CustomLogger).request = (message: string, meta?: any) => {
  logger.http(`[REQUEST] ${message}`, meta);
};

(logger as CustomLogger).security = (message: string, meta?: any) => {
  logger.warn(`[SECURITY] ${message}`, meta);
};

(logger as CustomLogger).workshop = (message: string, meta?: any) => {
  logger.info(`[WORKSHOP] ${message}`, meta);
};

(logger as CustomLogger).database = (message: string, meta?: any) => {
  logger.debug(`[DATABASE] ${message}`, meta);
};

(logger as CustomLogger).auth = (message: string, meta?: any) => {
  logger.info(`[AUTH] ${message}`, meta);
};

// Export typed logger
export default logger as CustomLogger;

// Utility function to create child loggers with context
export const createChildLogger = (context: string, metadata: any = {}) => {
  return logger.child({
    context,
    ...metadata,
  });
};

// Log uncaught exceptions and unhandled rejections
if (config.env === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: productionFormat,
    })
  );
  
  logger.rejections.handle(
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: productionFormat,
    })
  );
}

// Stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.substring(0, message.lastIndexOf('\n')));
  },
};

// Performance logging utilities
export const logPerformance = (operation: string, startTime: number, metadata?: any) => {
  const duration = Date.now() - startTime;
  logger.debug(`[PERFORMANCE] ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
};

// Audit logging for security-sensitive operations
export const logAudit = (
  action: string,
  userId?: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: any
) => {
  logger.info(`[AUDIT] ${action}`, {
    action,
    userId,
    resourceType,
    resourceId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Workshop-specific logging
export const logWorkshopEvent = (
  event: string,
  sessionId: string,
  userId: string,
  metadata?: any
) => {
  (logger as CustomLogger).workshop(`${event} - Session: ${sessionId}`, {
    event,
    sessionId,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Database query logging (only in development)
export const logDatabaseQuery = (query: string, params?: any[], duration?: number) => {
  if (config.env === 'development' && config.development.enableDebugLogs) {
    (logger as CustomLogger).database(`Query executed${duration ? ` in ${duration}ms` : ''}`, {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration,
    });
  }
};

// Error logging with context
export const logError = (
  error: Error,
  context: string,
  metadata?: any
) => {
  logger.error(`${context}: ${error.message}`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    ...metadata,
  });
};

// Rate limiting logging
export const logRateLimit = (ip: string, route: string, attempts: number) => {
  (logger as CustomLogger).security(`Rate limit exceeded for IP ${ip} on ${route}`, {
    ip,
    route,
    attempts,
    timestamp: new Date().toISOString(),
  });
};
