/**
 * Authentication API Client
 * Handles login, signup, and token management
 */

import { createApiClient } from './client';
import type { User, AuthSession } from '@/lib/auth/utils';

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

/**
 * Login user and store token
 */
export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  try {
    // Use Next.js API route
    const apiUrl = '/api/auth/login';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const text = await response.text();
    
    if (!isJson || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. Please check your API configuration.');
    }

    const data = JSON.parse(text);

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Login failed');
    }

    // Extract response data
    const authData = data.data || data;
    const user = authData.user;
    const accessToken = authData.accessToken;
    const expiresIn = authData.expiresIn || 7 * 24 * 60 * 60;

    // Validate that we have required data
    if (!accessToken) {
      console.error('Login response missing accessToken:', data);
      throw new Error('Invalid login response: missing access token');
    }

    if (!user) {
      console.error('Login response missing user:', data);
      throw new Error('Invalid login response: missing user data');
    }

    // Store token in BOTH localStorage AND sessionStorage for reliability
    if (typeof window !== 'undefined') {
      try {
        const { logAuth, logAuthError } = await import('@/lib/auth/debug');
        logAuth('[Auth.login] Storing token in localStorage and sessionStorage...', {
          tokenLength: accessToken.length,
          hasUser: !!user
        });
        
        // Set token in both storages
        localStorage.setItem('token', accessToken);
        sessionStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tenantId', user.tenantId || user.primaryTenantId || 'default-tenant');
        
        // Store tenants array if available (for tenant switcher)
        if (authData.tenants && Array.isArray(authData.tenants)) {
          localStorage.setItem('userTenants', JSON.stringify(authData.tenants));
          logAuth('[Auth.login] Stored tenants', { count: authData.tenants.length });
        }
        
        if (authData.refreshToken) {
          localStorage.setItem('refreshToken', authData.refreshToken);
        }
        
        // CRITICAL: Verify immediately and throw if failed
        const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        logAuth('[Auth.login] Token verification', {
          saved: !!savedToken,
          matches: savedToken === accessToken,
          length: savedToken?.length || 0,
          localStorage: !!localStorage.getItem('token'),
          sessionStorage: !!sessionStorage.getItem('token')
        });
        
        if (!savedToken || savedToken !== accessToken) {
          logAuthError('[Auth.login] Token verification FAILED', {
            savedToken: !!savedToken,
            expectedLength: accessToken.length,
            actualLength: savedToken?.length || 0
          });
          throw new Error('Failed to save authentication token');
        }
        
        logAuth('[Auth.login] Token successfully stored and verified');
      } catch (storageError) {
        const { logAuthError } = await import('@/lib/auth/debug');
        logAuthError('[Auth.login] Storage error', storageError);
        // If storage is full or blocked, throw error
        if (storageError instanceof Error && (storageError.name === 'QuotaExceededError' || (storageError as any).code === 22)) {
          throw new Error('Storage quota exceeded. Please clear some space.');
        }
        throw new Error('Failed to save authentication data');
      }
    }

    return {
      user,
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to login. Please check your credentials.');
  }
}

/**
 * Signup new user
 */
export async function signup(credentials: SignupCredentials): Promise<AuthSession> {
  try {
    // Use Next.js API route
    const apiUrl = '/api/auth/signup';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const text = await response.text();
    
    if (!isJson || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. Please check your API configuration.');
    }

    const data = JSON.parse(text);

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Signup failed');
    }

    // Extract response data
    const authData = data.data || data;
    const user = authData.user;
    const accessToken = authData.accessToken;
    const expiresIn = authData.expiresIn || 7 * 24 * 60 * 60;

    // Store token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tenantId', user.tenantId || 'default-tenant');
      if (authData.refreshToken) {
        localStorage.setItem('refreshToken', authData.refreshToken);
      }
    }

    return {
      user,
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  } catch (error) {
    console.error('Signup error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to signup. Please try again.');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  try {
    const useRealAuth = process.env.NEXT_PUBLIC_USE_REAL_AUTH === 'true';
    const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_REGISTRY_SERVICE_URL || 'http://localhost:3001';
    
    if (useRealAuth && AUTH_API_URL) {
      const authClient = createApiClient(AUTH_API_URL);
      const response = await authClient.post<AuthResponse>('/api/auth/refresh', {
        refreshToken,
      });

      // Update tokens
      localStorage.setItem('token', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }

      return response.accessToken;
    }
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Don't auto-logout on refresh failure - let the calling code decide
    // This prevents accidental logouts during login flow
    return null;
  }

  return null;
}

/**
 * Decode base64 string (browser-compatible)
 */
function decodeBase64(base64: string): string {
  try {
    // Browser-compatible base64 decode
    if (typeof window !== 'undefined') {
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      // Node.js environment
      return Buffer.from(base64, 'base64').toString('utf-8');
    }
  } catch {
    return '';
  }
}

/**
 * Check if token is expired or about to expire (within 5 minutes)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token || token === 'mock-token') {
    return false; // Mock tokens don't expire
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payloadJson = decodeBase64(parts[1]);
    if (!payloadJson) return true;

    const payload = JSON.parse(payloadJson) as { exp?: number };

    if (!payload.exp) return false; // No expiration, assume valid

    // Check if expired or expires within 5 minutes
    const expiresAt = payload.exp * 1000;
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return expiresAt < fiveMinutesFromNow;
  } catch {
    return true; // Invalid token
  }
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  let token = getAuthToken();
  if (!token) return null;

  // Check if token is expired or about to expire
  if (isTokenExpired(token)) {
    // Try to refresh
    token = await refreshAccessToken();
  }

  return token;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Call logout API endpoint (optional - for future token blacklisting)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Continue with local cleanup even if API call fails
      console.warn('Logout API call failed, continuing with local cleanup:', error);
    }

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('auth_session');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear local storage even if there's an error
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('auth_session');
    }
  }
}

/**
 * Get current user from storage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  // Check both localStorage and sessionStorage
  return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Try localStorage first, then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Tenant interface for API responses
 */
export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  role?: string;
  isPrimary?: boolean;
}

/**
 * Get all tenants for current user
 */
export async function getUserTenants(): Promise<Tenant[]> {
  try {
    const token = getAuthToken();
    if (!token) {
      return [];
    }

    const response = await fetch('/api/auth/tenants', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const text = await response.text();
    
    // If response is not JSON, return cached tenants or empty array
    if (!isJson || text.trim().startsWith('<!DOCTYPE')) {
      const cachedTenants = localStorage.getItem('userTenants');
      if (cachedTenants) {
        try {
          return JSON.parse(cachedTenants);
        } catch {
          return [];
        }
      }
      return [];
    }

    const data = JSON.parse(text);

    if (!response.ok || !data.success) {
      // Fallback to cached tenants if API fails
      const cachedTenants = localStorage.getItem('userTenants');
      if (cachedTenants) {
        try {
          return JSON.parse(cachedTenants);
        } catch {
          return [];
        }
      }
      return [];
    }

    const tenants = data.data || [];
    
    // Cache tenants for offline use
    if (typeof window !== 'undefined') {
      localStorage.setItem('userTenants', JSON.stringify(tenants));
    }

    return tenants;
  } catch (error) {
    console.error('Failed to get user tenants:', error);
    // Fallback to cached tenants
    const cachedTenants = localStorage.getItem('userTenants');
    if (cachedTenants) {
      try {
        return JSON.parse(cachedTenants);
      } catch {
        return [];
      }
    }
    return [];
  }
}

/**
 * Switch to a different tenant
 */
export async function switchTenant(tenantId: string): Promise<string> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/auth/switch-tenant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tenantId }),
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const text = await response.text();
    
    if (!isJson || text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. Please check your API configuration.');
    }

    const data = JSON.parse(text);

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to switch tenant');
    }

    const authData = data.data || data;
    const newAccessToken = authData.accessToken;

    if (!newAccessToken) {
      throw new Error('New access token not provided');
    }

    // Update token in both storages
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newAccessToken);
      sessionStorage.setItem('token', newAccessToken);
      localStorage.setItem('tenantId', tenantId);
      
      // Update cached user data with new tenant
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.tenantId = tenantId;
          user.primaryTenantId = tenantId;
          localStorage.setItem('user', JSON.stringify(user));
        } catch {
          // Ignore parse errors
        }
      }
    }

    return newAccessToken;
  } catch (error) {
    console.error('Failed to switch tenant:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to switch tenant');
  }
}

/**
 * Create a new tenant (company)
 */
export async function createTenant(data: { displayName: string; name?: string }): Promise<Tenant> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('[createTenant] Creating tenant with data:', data);

    const response = await fetch('/api/auth/create-tenant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    console.log('[createTenant] Response status:', response.status, response.statusText);
    console.log('[createTenant] Response ok:', response.ok);

    // Check content type before parsing
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const text = await response.text();
    
    if (!isJson || text.trim().startsWith('<!DOCTYPE')) {
      console.error('[createTenant] Response text:', text);
      throw new Error('Server returned HTML instead of JSON. Please check your API configuration.');
    }

    let result;
    try {
      result = JSON.parse(text);
      console.log('[createTenant] Full response data:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.error('[createTenant] Failed to parse JSON response:', parseError);
      throw new Error(`Server returned invalid JSON: ${text.substring(0, 200)}`);
    }

    // Log detailed error information
    if (!response.ok || !result.success) {
      console.error('[createTenant] Error details:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        resultSuccess: result?.success,
        resultError: result?.error,
        resultMessage: result?.message,
        fullResult: result
      });
    }

    if (!response.ok) {
      const errorMessage = result?.error?.message || result?.error || result?.message || `Server error: ${response.status} ${response.statusText}`;
      console.error('[createTenant] HTTP Error response:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!result.success) {
      const errorMessage = result?.error?.message || result?.error || result?.message || 'Failed to create company';
      console.error('[createTenant] Business logic error:', errorMessage);
      throw new Error(errorMessage);
    }

    if (!result.data) {
      console.error('[createTenant] Missing data in response:', result);
      throw new Error('Invalid response: missing tenant data');
    }

    return result.data;
  } catch (error) {
    console.error('[createTenant] Exception caught:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create company');
  }
}

