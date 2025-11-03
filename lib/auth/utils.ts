/**
 * Authentication utility functions
 * Re-exports from API client for backward compatibility
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  urls?: string[];
  dateOfBirth?: string | Date;
  language?: string;
  tenantId?: string;
  primaryTenantId?: string;
  isActive?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: Date;
}

// Re-export from API client
export { login, signup, getCurrentUser, isAuthenticated, getAuthToken } from '@/lib/api/auth';
export { logout } from '@/lib/api/auth';

/**
 * Validate password requirements
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

