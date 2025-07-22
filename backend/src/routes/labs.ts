import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

// Apply optional auth to all lab routes
router.use(optionalAuth);

// Lab routes will be implemented in Phase 2
router.get('/', asyncHandler(async (req, res) => {
  res.json({ message: 'Lab routes - coming soon' });
}));

export default router;