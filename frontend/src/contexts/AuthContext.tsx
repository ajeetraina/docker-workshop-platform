import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

import { authApi } from '@/lib/api';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  
  // Check authentication status
  const {
    data: authData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['auth', 'check'],
    queryFn: authApi.checkAuth,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Update user state when auth data changes
  useEffect(() => {
    if (authData?.authenticated && authData.user) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, [authData]);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'check'], {
        authenticated: true,
        user: data.user,
      });
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'check'], {
        authenticated: true,
        user: data.user,
      });
      toast.success('Account created successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth', 'check'], {
        authenticated: false,
        user: null,
      });
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      setUser(null);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      queryClient.clear();
      toast.success('Logged out');
    },
  });
  
  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: authApi.refreshToken,
    onError: () => {
      // If refresh fails, logout user
      setUser(null);
      queryClient.setQueryData(['auth', 'check'], {
        authenticated: false,
        user: null,
      });
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    },
  });
  
  const login = async (data: LoginRequest) => {
    await loginMutation.mutateAsync(data);
  };
  
  const register = async (data: RegisterRequest) => {
    await registerMutation.mutateAsync(data);
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  const refreshToken = async () => {
    await refreshMutation.mutateAsync();
  };
  
  const value: AuthContextType = {
    user,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};