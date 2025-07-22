import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  Settings,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { progressApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  formatDate,
  formatRelativeTime,
  getAvatarUrl,
  getDifficultyColor,
  capitalize,
} from '@/lib/utils';

export const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'achievements'>('overview');
  
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
  
  if (!user) {
    return <div>User not found</div>;
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];
  
  const isLoading = statsLoading || progressLoading;
  
  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-6">
              <img
                src={getAvatarUrl(user)}
                alt={user.fullName}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.fullName}
                </h1>
                <p className="text-gray-600">@{user.username}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 lg:mt-0">
              <Button variant="secondary">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Courses Enrolled</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.enrolledCourses}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Labs Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedLabs}</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Courses Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Achievements</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.earnedAchievements}</p>
                </div>
                <Award className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Profile Information</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="mt-1 text-gray-900">{user.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Username</label>
                      <p className="mt-1 text-gray-900">@{user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="mt-1 text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role</label>
                      <p className="mt-1">
                        <Badge variant="info">{capitalize(user.role)}</Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Member Since</label>
                      <p className="mt-1 text-gray-900">{formatDate(user.createdAt)}</p>
                    </div>
                    {user.lastLoginAt && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Login</label>
                        <p className="mt-1 text-gray-900">
                          {formatRelativeTime(user.lastLoginAt)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Account Settings</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Email Verified</p>
                        <p className="text-sm text-gray-600">
                          {user.emailVerified ? 'Your email is verified' : 'Please verify your email'}
                        </p>
                      </div>
                      <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                    
                    <hr />
                    
                    <div className="space-y-2">
                      <Button variant="secondary" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Button>
                      <Button variant="secondary" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Privacy Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div className="space-y-6">
                {progress && progress.length > 0 ? (
                  progress.map((courseProgress) => (
                    <Card key={courseProgress.courseId}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {courseProgress.courseTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Enrolled {formatRelativeTime(courseProgress.enrolledAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {courseProgress.completedLabs}/{courseProgress.totalLabs} labs
                            </p>
                            <p className="text-sm text-gray-600">
                              {courseProgress.completionPercentage}% complete
                            </p>
                          </div>
                        </div>
                        
                        <ProgressBar
                          value={courseProgress.completionPercentage}
                          className="mb-3"
                        />
                        
                        {courseProgress.lastLabActivity && (
                          <p className="text-xs text-gray-500">
                            Last activity: {formatRelativeTime(courseProgress.lastLabActivity)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No progress yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start learning by enrolling in a course.
                    </p>
                    <Button asChild>
                      <a href="/courses">Browse Courses</a>
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'achievements' && (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No achievements yet
                </h3>
                <p className="text-gray-600">
                  Complete labs and courses to earn achievements!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};