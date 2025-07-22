import { Router, Request, Response } from 'express';
import { query } from '@/database/connection';
import { asyncHandler, NotFoundError, ValidationError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * POST /api/workshops/sessions
 * Create a new workshop session
 */
router.post('/sessions', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { labId } = req.body;
  
  if (!labId) {
    throw new ValidationError('Lab ID is required');
  }
  
  // Verify lab exists
  const labResult = await query(
    'SELECT id, title FROM labs WHERE id = $1 AND is_published = true',
    [labId]
  );
  
  if (labResult.rows.length === 0) {
    throw new NotFoundError('Lab not found');
  }
  
  // Check active session limit
  const activeSessionsResult = await query(
    `SELECT COUNT(*) as count 
     FROM workshop_sessions 
     WHERE user_id = $1 AND status = 'active'`,
    [req.user.id]
  );
  
  const activeSessionCount = parseInt(activeSessionsResult.rows[0]?.count || '0', 10);
  const maxSessions = 3; // From config
  
  if (activeSessionCount >= maxSessions) {
    return res.status(409).json({
      error: 'Maximum active sessions reached',
      message: `You can have at most ${maxSessions} active sessions. Please terminate an existing session first.`,
    });
  }
  
  // Generate unique instance ID
  const instanceId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Set expiration time (2 hours from now)
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  
  // For MVP, use a mock workspace URL
  const workspaceUrl = `https://workshop-demo.docker-learn.com/?session=${instanceId}`;
  
  // Create session record
  const sessionResult = await query(
    `INSERT INTO workshop_sessions (
      user_id, lab_id, instance_id, workspace_url, status,
      expires_at, started_at, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, 'active', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, instance_id, workspace_url, status, expires_at, started_at, created_at`,
    [req.user.id, labId, instanceId, workspaceUrl, expiresAt]
  );
  
  const session = sessionResult.rows[0];
  
  logger.info(`Created workshop session ${session.id} for user ${req.user.id} and lab ${labId}`);
  
  res.status(201).json({
    id: session.id,
    userId: req.user.id,
    labId,
    instanceId: session.instance_id,
    workspaceUrl: session.workspace_url,
    status: session.status,
    expiresAt: session.expires_at,
    startedAt: session.started_at,
    createdAt: session.created_at,
  });
}));

/**
 * GET /api/workshops/sessions/:id
 * Get workshop session details
 */
router.get('/sessions/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { id } = req.params;
  
  const sessionResult = await query(
    `SELECT 
      id, user_id, lab_id, instance_id, workspace_url, status,
      expires_at, started_at, ended_at, created_at, updated_at
    FROM workshop_sessions
    WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  
  if (sessionResult.rows.length === 0) {
    throw new NotFoundError('Workshop session not found');
  }
  
  const session = sessionResult.rows[0];
  
  // Check if session has expired
  const now = new Date();
  const expiresAt = new Date(session.expires_at);
  
  if (now > expiresAt && session.status === 'active') {
    // Mark session as expired
    await query(
      `UPDATE workshop_sessions 
       SET status = 'expired', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [session.id]
    );
    
    session.status = 'expired';
    session.ended_at = now;
  }
  
  res.json({
    id: session.id,
    userId: session.user_id,
    labId: session.lab_id,
    instanceId: session.instance_id,
    workspaceUrl: session.workspace_url,
    status: session.status,
    expiresAt: session.expires_at,
    startedAt: session.started_at,
    endedAt: session.ended_at,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  });
}));

/**
 * GET /api/workshops/sessions
 * Get user's workshop sessions
 */
router.get('/sessions', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const sessionsResult = await query(
    `SELECT 
      ws.id, ws.user_id, ws.lab_id, ws.instance_id, ws.workspace_url, ws.status,
      ws.expires_at, ws.started_at, ws.ended_at, ws.created_at, ws.updated_at,
      l.title as lab_title
    FROM workshop_sessions ws
    JOIN labs l ON ws.lab_id = l.id
    WHERE ws.user_id = $1
    ORDER BY ws.created_at DESC
    LIMIT 20`,
    [req.user.id]
  );
  
  res.json(
    sessionsResult.rows.map(session => ({
      id: session.id,
      userId: session.user_id,
      labId: session.lab_id,
      labTitle: session.lab_title,
      instanceId: session.instance_id,
      workspaceUrl: session.workspace_url,
      status: session.status,
      expiresAt: session.expires_at,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }))
  );
}));

/**
 * DELETE /api/workshops/sessions/:id
 * Terminate a workshop session
 */
router.delete('/sessions/:id', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { id } = req.params;
  
  const result = await query(
    `UPDATE workshop_sessions 
     SET status = 'completed', ended_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2 AND status = 'active'
     RETURNING id`,
    [id, req.user.id]
  );
  
  if (result.rows.length === 0) {
    throw new NotFoundError('Active workshop session not found');
  }
  
  logger.info(`Terminated workshop session ${id} for user ${req.user.id}`);
  
  res.json({ message: 'Workshop session terminated successfully' });
}));

export default router;