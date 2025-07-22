import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Workshop instance management routes will be implemented in Phase 2
router.post('/sessions', asyncHandler(async (req, res) => {
  res.json({ 
    message: 'Workshop session creation - coming soon',
    mockSessionUrl: 'https://workshop-demo.docker-learn.com'
  });
}));

export default router;