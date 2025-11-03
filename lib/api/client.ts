/**
 * Shared API client utility for all API calls
 * Provides consistent authentication and error handling
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get authentication headers
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage (client-side) or cookies (server-side)
  if (typeof window !== 'undefined') {
    // Use getValidAccessToken to auto-refresh if needed
    const { getValidAccessToken } = await import('./auth');
    const token = await getValidAccessToken();
    const tenantId = localStorage.getItem('tenantId') || 'default-tenant';

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}

/**
 * Fetch with authentication and error handling
 * Automatically handles token refresh on 401 errors
 */
export async function fetchWithAuth<T = any>(
  url: string,
  options: RequestInit = {},
  retryOn401 = true
): Promise<T> {
  const headers = {
    ...(await getAuthHeaders()),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryOn401 && typeof window !== 'undefined') {
      const { refreshAccessToken } = await import('./auth');
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry request with new token
        const retryHeaders = {
          ...(await getAuthHeaders()),
          ...options.headers,
        };
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        // Read response text once
        const retryText = await retryResponse.text();
        const retryContentType = retryResponse.headers.get('content-type');
        
        if (!retryContentType?.includes('application/json')) {
          if (!retryResponse.ok) {
            throw new ApiError(
              `HTTP error! status: ${retryResponse.status}${retryText.length > 0 ? ` - ${retryText.substring(0, 100)}` : ''}`,
              retryResponse.status
            );
          }
          return retryText as unknown as T;
        }

        let retryData: any;
        try {
          if (!retryText) {
            retryData = {};
          } else {
            retryData = JSON.parse(retryText);
          }
        } catch (parseError) {
          if (!retryResponse.ok) {
            throw new ApiError(
              `Invalid JSON response from server (status: ${retryResponse.status}). The service may not be running or is returning an error page.`,
              retryResponse.status
            );
          }
          throw new ApiError(
            'Invalid JSON response from server',
            retryResponse.status
          );
        }
        
        if (!retryResponse.ok) {
          throw new ApiError(
            retryData.error?.message || retryData.message || `HTTP error! status: ${retryResponse.status}`,
            retryResponse.status,
            retryData.error?.code
          );
        }

        if (retryData.success !== undefined && retryData.data !== undefined) {
          return retryData.data as T;
        }
        return retryData as T;
      } else {
        // Refresh failed - don't auto-redirect, let the calling code handle it
        // This prevents redirect loops and allows components to handle 401 gracefully
        throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED');
      }
    }

    // Read response text once for all processing
    const text = await response.text();
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}${text.length > 0 ? ` - ${text.substring(0, 100)}` : ''}`,
          response.status
        );
      }
      return text as unknown as T;
    }

    // Parse JSON with better error handling
    let data: any;
    try {
      if (!text) {
        data = {};
      } else {
        data = JSON.parse(text);
      }
    } catch (parseError) {
      // If JSON parsing fails, it might be HTML or other content
      if (!response.ok) {
        throw new ApiError(
          `Invalid JSON response from server (status: ${response.status}). The service may not be running or is returning an error page.`,
          response.status
        );
      }
      throw new ApiError(
        'Invalid JSON response from server',
        response.status
      );
    }

    if (!response.ok) {
      throw new ApiError(
        data.error?.message || data.message || `HTTP error! status: ${response.status}`,
        response.status,
        data.error?.code
      );
    }

    // Handle API response wrapper
    if (data.success !== undefined && data.data !== undefined) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new ApiError(error.message, 0, 'NETWORK_ERROR');
    }
    throw new ApiError('An unknown error occurred', 0, 'UNKNOWN_ERROR');
  }
}

/**
 * Create API client for a specific service
 */
export function createApiClient(baseUrl: string) {
  return {
    get: <T = any>(path: string, options?: RequestInit) =>
      fetchWithAuth<T>(`${baseUrl}${path}`, { ...options, method: 'GET' }),
    
    post: <T = any>(path: string, body?: any, options?: RequestInit) =>
      fetchWithAuth<T>(`${baseUrl}${path}`, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    
    put: <T = any>(path: string, body?: any, options?: RequestInit) =>
      fetchWithAuth<T>(`${baseUrl}${path}`, {
        ...options,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }),
    
    patch: <T = any>(path: string, body?: any, options?: RequestInit) =>
      fetchWithAuth<T>(`${baseUrl}${path}`, {
        ...options,
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),
    
    delete: <T = any>(path: string, options?: RequestInit) =>
      fetchWithAuth<T>(`${baseUrl}${path}`, { ...options, method: 'DELETE' }),
  };
}

