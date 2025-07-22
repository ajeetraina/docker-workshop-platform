import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

// Apply optional auth to all course routes
router.use(optionalAuth);

// Course catalog routes will be implemented in Phase 2
router.get('/', asyncHandler(async (req, res) => {
  res.json({ 
    message: 'Course catalog',
    courses: [
      {
        id: '1',
        title: 'Docker Fundamentals',
        description: 'Learn the basics of Docker containers',
        difficulty: 'beginner',
        estimatedDuration: 120,
        labs: 8
      }
    ]
  });
}));

export default router;