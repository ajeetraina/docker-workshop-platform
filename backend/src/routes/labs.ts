import { Router, Request, Response } from 'express';
import { query } from '@/database/connection';
import { asyncHandler, NotFoundError } from '@/middleware/errorHandler';
import { optionalAuth } from '@/middleware/auth';

const router = Router();

// Apply optional auth to all lab routes
router.use(optionalAuth);

/**
 * GET /api/courses/:courseId/labs
 * Get all labs for a course
 */
router.get('/courses/:courseId/labs', asyncHandler(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  
  // Verify course exists
  const courseResult = await query(
    'SELECT id FROM courses WHERE id = $1 AND is_published = true',
    [courseId]
  );
  
  if (courseResult.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }
  
  // Get labs for the course
  const labsQuery = `
    SELECT 
      id, course_id, order_number, slug, title, description,
      estimated_duration_minutes, content_repo_url, is_published,
      created_at, updated_at
    FROM labs
    WHERE course_id = $1 AND is_published = true
    ORDER BY order_number ASC
  `;
  
  const labsResult = await query(labsQuery, [courseId]);
  
  res.json(
    labsResult.rows.map(lab => ({
      id: lab.id,
      courseId: lab.course_id,
      orderNumber: lab.order_number,
      slug: lab.slug,
      title: lab.title,
      description: lab.description,
      estimatedDurationMinutes: lab.estimated_duration_minutes,
      contentRepoUrl: lab.content_repo_url,
      isPublished: lab.is_published,
      createdAt: lab.created_at,
      updatedAt: lab.updated_at,
    }))
  );
}));

/**
 * GET /api/labs/:id
 * Get a single lab by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const labQuery = `
    SELECT 
      id, course_id, order_number, slug, title, description,
      estimated_duration_minutes, content_repo_url, validation_script,
      is_published, created_at, updated_at
    FROM labs
    WHERE id = $1 AND is_published = true
  `;
  
  const labResult = await query(labQuery, [id]);
  
  if (labResult.rows.length === 0) {
    throw new NotFoundError('Lab not found');
  }
  
  const lab = labResult.rows[0];
  
  res.json({
    id: lab.id,
    courseId: lab.course_id,
    orderNumber: lab.order_number,
    slug: lab.slug,
    title: lab.title,
    description: lab.description,
    estimatedDurationMinutes: lab.estimated_duration_minutes,
    contentRepoUrl: lab.content_repo_url,
    validationScript: lab.validation_script,
    isPublished: lab.is_published,
    createdAt: lab.created_at,
    updatedAt: lab.updated_at,
  });
}));

export default router;