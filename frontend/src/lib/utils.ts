import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  return format(dateObj, 'MMM d, yyyy');
}

/**
 * Format date to readable format
 */
export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Calculate completion percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get difficulty color classes
 */
export function getDifficultyColor(difficulty: 'beginner' | 'intermediate' | 'advanced') {
  const colors = {
    beginner: 'text-green-700 bg-green-50 border-green-200',
    intermediate: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    advanced: 'text-red-700 bg-red-50 border-red-200',
  };
  
  return colors[difficulty];
}

/**
 * Get status color classes
 */
export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'not_started': 'text-gray-700 bg-gray-50 border-gray-200',
    'in_progress': 'text-blue-700 bg-blue-50 border-blue-200',
    'completed': 'text-green-700 bg-green-50 border-green-200',
    'failed': 'text-red-700 bg-red-50 border-red-200',
    'pending': 'text-yellow-700 bg-yellow-50 border-yellow-200',
    'active': 'text-green-700 bg-green-50 border-green-200',
    'expired': 'text-red-700 bg-red-50 border-red-200',
  };
  
  return colors[status] || colors['not_started'];
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Generate avatar URL or initials
 */
export function getAvatarUrl(user: { fullName: string; avatarUrl?: string }): string {
  if (user.avatarUrl) return user.avatarUrl;
  
  // Generate initials
  const initials = user.fullName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Use a service like UI Avatars or generate a data URL
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff&size=40`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}