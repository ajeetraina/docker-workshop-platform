import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { query } from '@/database/connection';
import { 
  generateTokens, 
  setAuthCookies, 
  clearAuthCookies,
  verifyRefreshToken 
} from '@/middleware/auth';
import { 
  ValidationError, 
  UnauthorizedError, 
  ConflictError,
  asyncHandler 
} from '@/middleware/errorHandler';
import { config } from '@/config/env';
import { logger, logAudit } from '@/utils/logger';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  fullName: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0]?.message || 'Invalid input');
  }

  const { email, username, fullName, password } = value;

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('User with this email or username already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

  // Create user
  const newUser = await query(
    `INSERT INTO users (email, username, full_name, password_hash, role)
     VALUES ($1, $2, $3, $4, 'student')
     RETURNING id, email, username, full_name, role, created_at`,
    [email, username, fullName, passwordHash]
  );

  const user = newUser.rows[0];

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Log registration
  logAudit('USER_REGISTERED', user.id, 'user', user.id, {
    email: user.email,
    username: user.username,
    ip: req.ip,
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
    },
    accessToken,
  });
}));

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0]?.message || 'Invalid input');
  }

  const { email, password } = value;

  // Find user by email
  const userResult = await query(
    `SELECT id, email, username, full_name, password_hash, role, is_active, last_login_at
     FROM users 
     WHERE email = $1`,
    [email]
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  await query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  // Set cookies
  setAuthCookies(res, accessToken, refreshToken);

  // Log login
  logAudit('USER_LOGIN', user.id, 'user', user.id, {
    email: user.email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      lastLoginAt: user.last_login_at,
    },
    accessToken,
  });
}));

/**
 * POST /api/auth/logout
 * Logout user by clearing tokens
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // Clear auth cookies
  clearAuthCookies(res);

  // Log logout if user is authenticated
  if (req.user) {
    logAudit('USER_LOGOUT', req.user.id, 'user', req.user.id, {
      email: req.user.email,
      ip: req.ip,
    });

    logger.info(`User logged out: ${req.user.email}`);
  }

  res.json({
    message: 'Logout successful',
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not provided');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Get user from database
  const userResult = await query(
    `SELECT id, email, username, full_name, role, is_active
     FROM users 
     WHERE id = $1`,
    [decoded.id]
  );

  const user = userResult.rows[0];

  if (!user || !user.is_active) {
    throw new UnauthorizedError('User not found or inactive');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });

  // Set new cookies
  setAuthCookies(res, accessToken, newRefreshToken);

  logger.debug(`Token refreshed for user: ${user.email}`);

  res.json({
    message: 'Token refreshed successfully',
    accessToken,
  });
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Get fresh user data from database
  const userResult = await query(
    `SELECT id, email, username, full_name, role, avatar_url, 
            email_verified, created_at, last_login_at
     FROM users 
     WHERE id = $1 AND is_active = true`,
    [req.user.id]
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    },
  });
}));

/**
 * GET /api/auth/check
 * Check if user is authenticated (lightweight endpoint)
 */
router.get('/check', (req: Request, res: Response) => {
  res.json({
    authenticated: !!req.user,
    user: req.user || null,
  });
});

export default router;
