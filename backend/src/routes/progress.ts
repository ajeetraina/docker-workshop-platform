import { Router } from 'express';
import authenticateToken from '../middleware/auth';

const router = Router();

// Apply authentication middleware
router.use(authenticateToken);

// Get user progress overview
router.get('/', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    // Mock progress data - replace with actual database queries
    const progressData = {
      totalCourses: 4,
      enrolledCourses: 2,
      completedCourses: 0,
      totalLabs: 20,
      completedLabs: 5,
      overallProgress: 25,
      recentActivity: [
        {
          id: '1',
          type: 'lab_completed',
          title: 'Getting Started with Docker',
          courseName: 'Docker Fundamentals',
          completedAt: new Date().toISOString()
        }
      ],
      courseProgress: [
        {
          courseId: '550e8400-e29b-41d4-a716-446655440001',
          courseName: 'Docker Fundamentals',
          progress: 60,
          completedLabs: 3,
          totalLabs: 5,
          lastAccessed: new Date().toISOString()
        },
        {
          courseId: '550e8400-e29b-41d4-a716-446655440002',
          courseName: 'Docker Compose Deep Dive',
          progress: 20,
          completedLabs: 1,
          totalLabs: 5,
          lastAccessed: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    };

    res.json(progressData);
  } catch (error) {
    console.error('Progress API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch progress data'
    });
  }
});

// Get progress for specific course
router.get('/course/:courseId', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { courseId } = req.params;
    
    // Mock course progress - replace with actual database queries
    const courseProgress = {
      courseId,
      progress: 60,
      completedLabs: 3,
      totalLabs: 5,
      labs: [
        { id: '1', title: 'Getting Started', completed: true, progress: 100 },
        { id: '2', title: 'Working with Images', completed: true, progress: 100 },
        { id: '3', title: 'Dockerfile Basics', completed: true, progress: 100 },
        { id: '4', title: 'Container Networking', completed: false, progress: 0 },
        { id: '5', title: 'Docker Volumes', completed: false, progress: 0 }
      ]
    };

    res.json(courseProgress);
  } catch (error) {
    console.error('Course progress API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch course progress'
    });
  }
});

export default router;
