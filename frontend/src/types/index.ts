// User types
export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

// Course types
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationMinutes: number;
  prerequisites: string[];
  learningObjectives: string[];
  imageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  labCount?: number;
  enrollmentCount?: number;
  completionRate?: number;
}

// Lab types
export interface Lab {
  id: string;
  courseId: string;
  orderNumber: number;
  slug: string;
  title: string;
  description: string;
  estimatedDurationMinutes: number;
  contentRepoUrl: string;
  validationScript?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Progress types
export interface UserLabProgress {
  id: string;
  userId: string;
  labId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  workspaceData?: Record<string, any>;
  validationResults?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  totalLabs: number;
  completedLabs: number;
  completionPercentage: number;
  enrolledAt: string;
  lastAccessedAt?: string;
  lastLabActivity?: string;
}

// Workshop session types
export interface WorkshopSession {
  id: string;
  userId: string;
  labId: string;
  instanceId: string;
  workspaceUrl: string;
  status: 'pending' | 'active' | 'completed' | 'expired' | 'failed';
  containerIds?: Record<string, any>;
  allocatedPorts?: Record<string, any>;
  kubernetesNamespace?: string;
  expiresAt: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  path?: string;
  method?: string;
  code?: string;
  requestId?: string;
  details?: any;
}

// Dashboard types
export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  completedLabs: number;
  activeSessions: number;
  earnedAchievements: number;
}

// Achievement types
export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl?: string;
  criteria: Record<string, any>;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  earnedAt: string;
}

// Form types
export interface FormErrors {
  [key: string]: string | undefined;
}

// UI state types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
}