import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

/**
 * Trusted identity information from Kong Gateway
 * Kong injects these headers after successful JWT/OIDC verification
 */
export interface TrustedIdentity {
  userId: string;
  tenantId: string;
  email?: string;
  roles?: string[];
  scopes?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email?: string;
      };
      tenantId?: string;
    }
  }
}

/**
 * Configuration for identity middleware
 */
export interface IdentityMiddlewareConfig {
  /**
   * If true, requires all identity headers to be present
   * If false, only requires userId and tenantId
   * @default false
   */
  strict?: boolean;

  /**
   * Feature toggle: if false, middleware is no-op
   * Useful for gradual rollout
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom header names (defaults to Kong standard)
   */
  headers?: {
    userId?: string;
    tenantId?: string;
    email?: string;
    roles?: string;
    scopes?: string;
  };
}

const DEFAULT_HEADERS = {
  userId: 'X-User-Id',
  tenantId: 'X-Tenant-Id',
  email: 'X-User-Email',
  roles: 'X-User-Roles',
  scopes: 'X-User-Scopes',
};

/**
 * Identity middleware that trusts headers from Kong Gateway
 * 
 * Kong Gateway verifies JWT/OIDC tokens and injects identity information
 * as trusted headers. This middleware extracts that information and attaches
 * it to the Express request object.
 * 
 * IMPORTANT: This middleware assumes requests come through Kong Gateway.
 * Direct requests to services will not have these headers and will be rejected.
 * 
 * @param config - Configuration options
 * @returns Express middleware function
 */
export const identityMiddleware = (config: IdentityMiddlewareConfig = {}) => {
  const {
    strict = false,
    enabled = true,
    headers = DEFAULT_HEADERS,
  } = config;

  // Merge custom headers with defaults
  const headerNames = { ...DEFAULT_HEADERS, ...headers };

  return (req: Request, res: Response, next: NextFunction): void => {
    // If disabled, skip middleware (for gradual rollout)
    if (!enabled) {
      return next();
    }

    try {
      // Extract required identity headers
      const userId = req.headers[headerNames.userId.toLowerCase()] as string;
      const tenantId = req.headers[headerNames.tenantId.toLowerCase()] as string;

      // In strict mode, require all headers
      if (strict) {
        const email = req.headers[headerNames.email.toLowerCase()] as string;
        if (!userId || !tenantId || !email) {
          throw new AppError(
            'Missing required identity headers. Request must come through Kong Gateway.',
            401
          );
        }
      } else {
        // In non-strict mode, only require userId and tenantId
        if (!userId || !tenantId) {
          throw new AppError(
            'Missing required identity headers (X-User-Id, X-Tenant-Id). Request must come through Kong Gateway.',
            401
          );
        }
      }

      // Extract optional headers
      const email = req.headers[headerNames.email.toLowerCase()] as string | undefined;
      const rolesHeader = req.headers[headerNames.roles.toLowerCase()] as string | undefined;
      const scopesHeader = req.headers[headerNames.scopes.toLowerCase()] as string | undefined;

      // Parse roles (comma-separated or JSON array)
      let roles: string[] | undefined;
      if (rolesHeader) {
        try {
          roles = JSON.parse(rolesHeader);
        } catch {
          roles = rolesHeader.split(',').map(r => r.trim()).filter(Boolean);
        }
      }

      // Parse scopes (space or comma-separated)
      let scopes: string[] | undefined;
      if (scopesHeader) {
        scopes = scopesHeader.split(/[\s,]+/).filter(Boolean);
      }

      // Attach identity to request (with backward compatibility)
      req.user = {
        id: userId,
        tenantId,
        ...(email ? { email } : {}),
      };

      // Also attach tenantId directly for compatibility with existing code
      req.tenantId = tenantId;

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(
        'Failed to process identity information',
        500
      ));
    }
  };
};

/**
 * Feature toggle helper - returns identity middleware conditionally
 * Useful for gradual service migration
 */
export const conditionalIdentityMiddleware = (
  featureEnabled: boolean | (() => boolean),
  config?: IdentityMiddlewareConfig
) => {
  const enabled = typeof featureEnabled === 'function' ? featureEnabled() : featureEnabled;
  return identityMiddleware({ ...config, enabled });
};

/**
 * Fallback middleware that allows both old JWT-based auth and new header-based auth
 * Used during migration period
 */
export const hybridIdentityMiddleware = (
  jwtAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void,
  headerConfig?: IdentityMiddlewareConfig
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if Kong headers are present
    const hasKongHeaders = 
      req.headers['x-user-id'] && 
      req.headers['x-tenant-id'];

    if (hasKongHeaders) {
      // Use header-based identity (from Kong)
      return identityMiddleware({ ...headerConfig, enabled: true })(req, res, next);
    } else {
      // Fall back to JWT verification (old method)
      return jwtAuthMiddleware(req, res, next);
    }
  };
};

