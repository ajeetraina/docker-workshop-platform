import { Router, Request, Response } from 'express';
import { query } from '@/database/connection';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

/**
 * GET /api/progress
 * Get user's course progress
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const progressQuery = `
    SELECT 
      user_id, course_id, course_title, course_slug,
      total_labs, completed_labs, completion_percentage,
      enrolled_at, last_accessed_at, last_lab_activity
    FROM course_progress_summary
    WHERE user_id = $1
    ORDER BY last_accessed_at DESC NULLS LAST, enrolled_at DESC
  `;
  
  const progressResult = await query(progressQuery, [req.user.id]);
  
  res.json(
    progressResult.rows.map(progress => ({
      userId: progress.user_id,
      courseId: progress.course_id,
      courseTitle: progress.course_title,
      courseSlug: progress.course_slug,
      totalLabs: progress.total_labs,
      completedLabs: progress.completed_labs,
      completionPercentage: progress.completion_percentage,
      enrolledAt: progress.enrolled_at,
      lastAccessedAt: progress.last_accessed_at,
      lastLabActivity: progress.last_lab_activity,
    }))
  );
}));

/**
 * GET /api/progress/dashboard
 * Get dashboard statistics for the user
 */
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const statsQuery = `
    SELECT 
      enrolled_courses, completed_courses, completed_labs,
      active_sessions, earned_achievements
    FROM user_dashboard_stats
    WHERE user_id = $1
  `;
  
  const statsResult = await query(statsQuery, [req.user.id]);
  
  if (statsResult.rows.length === 0) {
    // Return default stats for new users
    return res.json({
      enrolledCourses: 0,
      completedCourses: 0,
      completedLabs: 0,
      activeSessions: 0,
      earnedAchievements: 0,
    });
  }
  
  const stats = statsResult.rows[0];
  
  res.json({
    enrolledCourses: parseInt(stats.enrolled_courses || '0', 10),
    completedCourses: parseInt(stats.completed_courses || '0', 10),
    completedLabs: parseInt(stats.completed_labs || '0', 10),
    activeSessions: parseInt(stats.active_sessions || '0', 10),
    earnedAchievements: parseInt(stats.earned_achievements || '0', 10),
  });
}));

export default router;