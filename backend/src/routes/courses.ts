import { Router, Request, Response } from 'express';
import { query } from '@/database/connection';
import { asyncHandler, NotFoundError } from '@/middleware/errorHandler';
import { optionalAuth } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const router = Router();

// Apply optional auth to all course routes
router.use(optionalAuth);

/**
 * GET /api/courses
 * Get all courses with filtering and pagination
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 12,
    difficulty,
    search,
  } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);
  
  // Build WHERE clause
  const conditions: string[] = ['is_published = true'];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (difficulty && typeof difficulty === 'string') {
    conditions.push(`difficulty = $${paramIndex++}`);
    params.push(difficulty);
  }
  
  if (search && typeof search === 'string') {
    conditions.push(`(title ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`);
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM courses
    ${whereClause}
  `;
  
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0]?.total || '0', 10);
  
  // Get courses
  const coursesQuery = `
    SELECT 
      id, slug, title, description, short_description,
      difficulty, estimated_duration_minutes, prerequisites,
      learning_objectives, image_url, created_at, updated_at,
      (
        SELECT COUNT(*) 
        FROM labs l 
        WHERE l.course_id = courses.id AND l.is_published = true
      ) as lab_count
    FROM courses
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  
  params.push(Number(limit), offset);
  
  const coursesResult = await query(coursesQuery, params);
  
  const totalPages = Math.ceil(total / Number(limit));
  const currentPage = Number(page);
  
  res.json({
    data: coursesResult.rows.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      shortDescription: course.short_description,
      difficulty: course.difficulty,
      estimatedDurationMinutes: course.estimated_duration_minutes,
      prerequisites: course.prerequisites || [],
      learningObjectives: course.learning_objectives || [],
      imageUrl: course.image_url,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      labCount: parseInt(course.lab_count || '0', 10),
    })),
    total,
    page: currentPage,
    limit: Number(limit),
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  });
}));

/**
 * GET /api/courses/:id
 * Get a single course by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const courseQuery = `
    SELECT 
      id, slug, title, description, short_description,
      difficulty, estimated_duration_minutes, prerequisites,
      learning_objectives, image_url, is_published,
      created_by, created_at, updated_at
    FROM courses
    WHERE id = $1 AND is_published = true
  `;
  
  const courseResult = await query(courseQuery, [id]);
  
  if (courseResult.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }
  
  const course = courseResult.rows[0];
  
  res.json({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    shortDescription: course.short_description,
    difficulty: course.difficulty,
    estimatedDurationMinutes: course.estimated_duration_minutes,
    prerequisites: course.prerequisites || [],
    learningObjectives: course.learning_objectives || [],
    imageUrl: course.image_url,
    isPublished: course.is_published,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  });
}));

/**
 * POST /api/courses/:id/enroll
 * Enroll user in a course
 */
router.post('/:id/enroll', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const { id: courseId } = req.params;
  const userId = req.user.id;
  
  // Check if course exists
  const courseResult = await query(
    'SELECT id FROM courses WHERE id = $1 AND is_published = true',
    [courseId]
  );
  
  if (courseResult.rows.length === 0) {
    throw new NotFoundError('Course not found');
  }
  
  // Check if already enrolled
  const enrollmentResult = await query(
    'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
    [userId, courseId]
  );
  
  if (enrollmentResult.rows.length > 0) {
    return res.status(409).json({ error: 'Already enrolled in this course' });
  }
  
  // Create enrollment
  await query(
    `INSERT INTO enrollments (user_id, course_id, enrolled_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [userId, courseId]
  );
  
  logger.info(`User ${userId} enrolled in course ${courseId}`);
  
  res.status(201).json({ message: 'Successfully enrolled in course' });
}));

export default router;