import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// User management routes will be implemented in Phase 2
router.get('/', asyncHandler(async (req, res) => {
  res.json({ message: 'User routes - coming soon' });
}));

export default router;