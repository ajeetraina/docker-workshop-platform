import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  TrendingUp,
  Users,
  Play,
  Award,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { progressApi, coursesApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDuration, formatRelativeTime, getDifficultyColor } from '@/lib/utils';

export const Dashboard = () => {
  const { user } = useAuth();
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: progressApi.getDashboardStats,
  });
  
  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['progress', user?.id],
    queryFn: () => progressApi.getUserProgress(),
  });
  
  // Fetch recent courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: () => coursesApi.getCourses({ limit: 3 }),
  });
  
  if (statsLoading || progressLoading || coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  const statCards = [
    {
      title: 'Courses Enrolled',
      value: stats?.enrolledCourses || 0,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Labs Completed',
      value: stats?.completedLabs || 0,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Sessions',
      value: stats?.activeSessions || 0,
      icon: Play,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Achievements',
      value: stats?.earnedAchievements || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];
  
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Continue your Docker learning journey or explore new courses.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Progress
              </h3>
              <Link
                to="/courses"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {progress && progress.length > 0 ? (
              <div className="space-y-4">
                {progress.slice(0, 3).map((courseProgress) => (
                  <div key={courseProgress.courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {courseProgress.courseTitle}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {courseProgress.completedLabs}/{courseProgress.totalLabs} labs
                      </span>
                    </div>
                    <ProgressBar
                      value={courseProgress.completionPercentage}
                      showLabel
                    />
                    <p className="text-xs text-gray-500">
                      Last activity: {formatRelativeTime(courseProgress.lastLabActivity || courseProgress.enrolledAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  You haven't enrolled in any courses yet.
                </p>
                <Button asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Featured Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Featured Courses
              </h3>
              <Link
                to="/courses"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {coursesData?.data && coursesData.data.length > 0 ? (
              <div className="space-y-4">
                {coursesData.data.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {course.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {course.shortDescription || course.description.slice(0, 100) + '...'}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="default"
                            className={getDifficultyColor(course.difficulty)}
                          >
                            {course.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDuration(course.estimatedDurationMinutes)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No courses available at the moment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Quick Actions
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="secondary" asChild className="h-auto p-4">
              <Link to="/courses" className="flex flex-col items-center text-center">
                <BookOpen className="w-8 h-8 mb-2" />
                <span className="font-medium">Browse Courses</span>
                <span className="text-sm text-gray-600">Discover new learning paths</span>
              </Link>
            </Button>
            
            <Button variant="secondary" asChild className="h-auto p-4">
              <a href="#" className="flex flex-col items-center text-center">
                <Play className="w-8 h-8 mb-2" />
                <span className="font-medium">Resume Lab</span>
                <span className="text-sm text-gray-600">Continue where you left off</span>
              </a>
            </Button>
            
            <Button variant="secondary" asChild className="h-auto p-4">
              <Link to="/profile" className="flex flex-col items-center text-center">
                <Award className="w-8 h-8 mb-2" />
                <span className="font-medium">View Achievements</span>
                <span className="text-sm text-gray-600">See your progress</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};