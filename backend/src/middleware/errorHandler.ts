import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Custom error class for application errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    
    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create common error types
 */
export class ValidationError extends CustomError {
  constructor(message: string, field?: string) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, true, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'TOO_MANY_REQUESTS');
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Handle different types of errors and convert them to standardized format
 */
const handleDatabaseError = (error: any): AppError => {
  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists');
      case '23503': // Foreign key violation
        return new ValidationError('Referenced resource does not exist');
      case '23502': // Not null violation
        return new ValidationError('Required field is missing');
      case '22001': // String data too long
        return new ValidationError('Data is too long');
      case '42P01': // Undefined table
        return new CustomError('Database configuration error', 500, false);
      default:
        return new CustomError('Database error', 500, true, error.code);
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  // Validation errors (Joi, etc.)
  if (error.name === 'ValidationError' && error.details) {
    const message = error.details.map((detail: any) => detail.message).join(', ');
    return new ValidationError(message);
  }

  // Default to generic error
  return new CustomError(
    error.message || 'Internal server error',
    error.statusCode || 500,
    error.isOperational || false
  );
};

/**
 * Send error response to client
 */
const sendErrorResponse = (error: AppError, req: Request, res: Response): void => {
  const { statusCode = 500, message, code } = error;
  
  const errorResponse: any = {
    error: getErrorName(statusCode),
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add error code if available
  if (code) {
    errorResponse.code = code;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  // Include stack trace in development
  if (config.env === 'development' && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Add validation details for validation errors
  if (error.name === 'ValidationError' && (error as any).details) {
    errorResponse.details = (error as any).details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Get human-readable error name from status code
 */
const getErrorName = (statusCode: number): string => {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorNames[statusCode] || 'Unknown Error';
};

/**
 * Log error with appropriate level
 */
const logError = (error: AppError, req: Request): void => {
  const logData = {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
    stack: error.stack,
  };

  // Log operational errors as warnings, programming errors as errors
  if (error.isOperational) {
    logger.warn('Operational error:', logData);
  } else {
    logger.error('Programming error:', logData);
  }
};

/**
 * Main error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert error to standardized format
  const appError = error instanceof CustomError ? error : handleDatabaseError(error);
  
  // Log the error
  logError(appError, req);
  
  // Send error response
  sendErrorResponse(appError, req, res);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Handle uncaught exceptions and unhandled rejections
 */
export const setupGlobalErrorHandlers = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack,
    });
    
    // Exit the process in production
    if (config.env === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise,
    });
    
    // Exit the process in production
    if (config.env === 'production') {
      process.exit(1);
    }
  });
};
