import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Clock,
  Users,
  BookOpen,
  Play,
  CheckCircle,
  Circle,
  Star,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { coursesApi, labsApi, progressApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  formatDuration,
  getDifficultyColor,
  getStatusColor,
  capitalize,
} from '@/lib/utils';

export const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'labs' | 'progress'>('overview');
  const queryClient = useQueryClient();
  
  if (!courseId) {
    return <div>Course not found</div>;
  }
  
  // Fetch course details
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.getCourse(courseId),
  });
  
  // Fetch course labs
  const { data: labs, isLoading: labsLoading } = useQuery({
    queryKey: ['course', courseId, 'labs'],
    queryFn: () => labsApi.getCourseLabs(courseId),
    enabled: !!course,
  });
  
  // Fetch user progress
  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressApi.getUserProgress(),
  });
  
  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: () => coursesApi.enrollInCourse(courseId),
    onSuccess: () => {
      toast.success('Successfully enrolled in course!');
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    },
  });
  
  const courseProgress = progress?.find(p => p.courseId === courseId);
  const isEnrolled = !!courseProgress;
  
  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (courseError || !course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Course not found
        </h3>
        <p className="text-gray-600 mb-4">
          The course you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link to="/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
      </div>
    );
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'labs', label: 'Labs', icon: Play },
    ...(isEnrolled ? [{ id: 'progress', label: 'Progress', icon: Award }] : []),
  ];
  
  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link to="/courses" className="hover:text-gray-900">
          Courses
        </Link>
        <span>/</span>
        <span className="text-gray-900">{course.title}</span>
      </nav>
      
      {/* Course Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white">
        <div className="max-w-4xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-primary-100 mb-6 text-lg">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Badge 
                  variant="default" 
                  className="bg-white/20 text-white border-white/20"
                >
                  {capitalize(course.difficulty)}
                </Badge>
                <div className="flex items-center space-x-1 text-primary-100">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(course.estimatedDurationMinutes)}</span>
                </div>
                <div className="flex items-center space-x-1 text-primary-100">
                  <Users className="w-4 h-4" />
                  <span>{labs?.length || 0} labs</span>
                </div>
              </div>
              
              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Your Progress</span>
                      <span className="text-white">
                        {courseProgress.completedLabs}/{courseProgress.totalLabs} labs completed
                      </span>
                    </div>
                    <ProgressBar
                      value={courseProgress.completionPercentage}
                      className="bg-white/20"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="bg-white text-primary-600 hover:bg-gray-50"
                  >
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => enrollMutation.mutate()}
                  isLoading={enrollMutation.isPending}
                  className="bg-white text-primary-600 hover:bg-gray-50"
                >
                  Enroll in Course
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Course Description</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
              
              {course.learningObjectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Learning Objectives</h3>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {course.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Course Info</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Difficulty</span>
                    <div className="mt-1">
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {capitalize(course.difficulty)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Duration</span>
                    <p className="mt-1 text-gray-900">
                      {formatDuration(course.estimatedDurationMinutes)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Labs</span>
                    <p className="mt-1 text-gray-900">{labs?.length || 0} hands-on labs</p>
                  </div>
                  {course.prerequisites.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Prerequisites</span>
                      <ul className="mt-1 text-gray-900 text-sm space-y-1">
                        {course.prerequisites.map((prereq, index) => (
                          <li key={index}>• {prereq}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'labs' && (
          <div className="space-y-4">
            {labsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : labs && labs.length > 0 ? (
              labs.map((lab, index) => {
                const labProgress = null; // TODO: Get lab-specific progress
                const status = labProgress?.status || 'not_started';
                
                return (
                  <Card key={lab.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {status === 'completed' ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <Circle className="w-8 h-8 text-gray-300" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900 mb-1">
                                {index + 1}. {lab.title}
                              </h4>
                              <p className="text-gray-600 mb-3">{lab.description}</p>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatDuration(lab.estimatedDurationMinutes)}</span>
                                </div>
                                <Badge 
                                  variant="default" 
                                  className={getStatusColor(status)}
                                >
                                  {capitalize(status.replace('_', ' '))}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              {isEnrolled && (
                                <Button
                                  size="sm"
                                  disabled={!isEnrolled}
                                >
                                  {status === 'completed' ? 'Review' : 'Start Lab'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No labs available
                </h3>
                <p className="text-gray-600">
                  Labs for this course are being prepared.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'progress' && isEnrolled && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Overall Progress</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-medium">
                      {courseProgress.completedLabs}/{courseProgress.totalLabs} labs completed
                    </span>
                  </div>
                  <ProgressBar
                    value={courseProgress.completionPercentage}
                    showLabel
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* TODO: Add detailed lab progress */}
          </div>
        )}
      </div>
    </div>
  );
};