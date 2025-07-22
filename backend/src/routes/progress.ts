import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Progress tracking routes will be implemented in Phase 2
router.get('/', asyncHandler(async (req, res) => {
  res.json({ message: 'Progress tracking - coming soon' });
}));

export default router;