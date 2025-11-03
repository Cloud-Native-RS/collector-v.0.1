/**
 * Server-side authentication utilities for Next.js middleware
 */

import { type NextRequest } from "next/server";

export interface AuthTokenPayload {
  id: string;
  tenantId: string;
  email: string;
  exp?: number;
  iat?: number;
}

/**
 * Verify JWT token (server-side)
 * Note: In production, this should verify against the same secret as backend
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    // Simple JWT decode without verification (for middleware performance)
    // In production, you might want to use a proper JWT library
    // For now, we'll just check if token exists and has basic structure
    if (!token || token === 'mock-token') {
      return null;
    }

    // Basic validation - check if it's a JWT format
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // In development, accept mock tokens
    if (process.env.NODE_ENV === 'development' && token.startsWith('mock-')) {
      return {
        id: 'user-1',
        tenantId: 'default-tenant',
        email: 'dev@example.com',
      };
    }

    // For real tokens, decode base64 payload
    try {
      // Edge runtime compatible base64 decode
      const padded = parts[1] + '='.repeat((4 - (parts[1].length % 4)) % 4);
      
      // Use atob which is available in Edge runtime
      const decoded = atob(padded);
      const payloadJson = decodeURIComponent(
        decoded
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(payloadJson) as AuthTokenPayload;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Get token from request (checks cookies and headers)
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first (preferred for httpOnly cookies)
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Check Authorization header (for API requests)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;

  const payload = verifyToken(token);
  return payload !== null;
}

/**
 * Get authenticated user from request
 */
export function getAuthenticatedUser(
  request: NextRequest
): AuthTokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  return verifyToken(token);
}

