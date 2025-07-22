import axios, { AxiosError, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Course,
  Lab,
  UserLabProgress,
  CourseProgress,
  WorkshopSession,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  DashboardStats,
} from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const { response } = error;
    
    if (!response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    const { status, data } = response;
    
    // Handle specific error cases
    switch (status) {
      case 401:
        // Unauthorized - try to refresh token
        if (data?.code !== 'REFRESH_TOKEN_INVALID') {
          try {
            await authApi.refreshToken();
            // Retry the original request
            return api.request(error.config!);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        } else {
          // Refresh token is invalid, redirect to login
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/login';
        }
        break;
        
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
        
      case 404:
        toast.error(data?.message || 'Resource not found.');
        break;
        
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
        
      case 500:
        toast.error('Server error. Please try again later.');
        break;
        
      default:
        if (data?.message) {
          toast.error(data.message);
        } else {
          toast.error('An unexpected error occurred.');
        }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
  
  async logout(): Promise<void> {
    await api.post('/auth/logout');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  },
  
  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    return response.data;
  },
  
  async getMe(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
  
  async checkAuth(): Promise<{ authenticated: boolean; user: User | null }> {
    const response = await api.get<{ authenticated: boolean; user: User | null }>('/auth/check');
    return response.data;
  },
};

// Courses API
export const coursesApi = {
  async getCourses(params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    search?: string;
  }): Promise<PaginatedResponse<Course>> {
    const response = await api.get<PaginatedResponse<Course>>('/courses', { params });
    return response.data;
  },
  
  async getCourse(id: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },
  
  async enrollInCourse(courseId: string): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>(`/courses/${courseId}/enroll`);
    return response.data;
  },
};

// Labs API
export const labsApi = {
  async getCourseLabs(courseId: string): Promise<Lab[]> {
    const response = await api.get<Lab[]>(`/courses/${courseId}/labs`);
    return response.data;
  },
  
  async getLab(labId: string): Promise<Lab> {
    const response = await api.get<Lab>(`/labs/${labId}`);
    return response.data;
  },
};

// Progress API
export const progressApi = {
  async getUserProgress(userId?: string): Promise<CourseProgress[]> {
    const url = userId ? `/progress/user/${userId}` : '/progress';
    const response = await api.get<CourseProgress[]>(url);
    return response.data;
  },
  
  async getLabProgress(labId: string): Promise<UserLabProgress> {
    const response = await api.get<UserLabProgress>(`/progress/lab/${labId}`);
    return response.data;
  },
  
  async updateLabProgress(
    labId: string,
    data: Partial<UserLabProgress>
  ): Promise<UserLabProgress> {
    const response = await api.patch<UserLabProgress>(`/progress/lab/${labId}`, data);
    return response.data;
  },
  
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/progress/dashboard');
    return response.data;
  },
};

// Workshop sessions API
export const workshopApi = {
  async createSession(labId: string): Promise<WorkshopSession> {
    const response = await api.post<WorkshopSession>('/workshops/sessions', { labId });
    return response.data;
  },
  
  async getSession(sessionId: string): Promise<WorkshopSession> {
    const response = await api.get<WorkshopSession>(`/workshops/sessions/${sessionId}`);
    return response.data;
  },
  
  async getSessions(): Promise<WorkshopSession[]> {
    const response = await api.get<WorkshopSession[]>('/workshops/sessions');
    return response.data;
  },
  
  async extendSession(sessionId: string, minutes: number): Promise<WorkshopSession> {
    const response = await api.patch<WorkshopSession>(`/workshops/sessions/${sessionId}/extend`, {
      minutes,
    });
    return response.data;
  },
  
  async terminateSession(sessionId: string): Promise<void> {
    await api.delete(`/workshops/sessions/${sessionId}`);
  },
  
  async saveWorkspace(
    sessionId: string,
    data: {
      files?: Record<string, string>;
      progress?: Record<string, any>;
    }
  ): Promise<void> {
    await api.post(`/workshops/sessions/${sessionId}/save`, data);
  },
};

// Health check
export const healthApi = {
  async check(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
  }> {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;