import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserRole, JWTPayload } from '../types';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In development, allow requests without token
      if (process.env.NODE_ENV !== 'production') {
        req.user = {
          id: 'dev-user',
          tenantId: req.headers['x-tenant-id'] as string || 'default-tenant',
          role: 'PROJECT_MANAGER' as UserRole,
        };
        return next();
      }
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    // In development, be more lenient with token validation
    if (process.env.NODE_ENV !== 'production') {
      try {
        // Try to decode without verification first
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.tenantId) {
          req.user = {
            id: decoded.id || 'dev-user',
            tenantId: decoded.tenantId || req.headers['x-tenant-id'] as string || 'default-tenant',
            role: (decoded.role || 'PROJECT_MANAGER') as UserRole,
          };
          return next();
        }
      } catch (decodeError) {
        // If decode fails, try verification with multiple secrets
      }
      
      // Try verification with multiple possible secrets in development
      const devSecrets = [
        JWT_SECRET,
        'collector_dev_jwt_secret_change_in_production',
        'dev-secret-key',
        'your-secret-key',
      ];
      
      for (const secret of devSecrets) {
        try {
          const decoded = jwt.verify(token, secret) as JWTPayload;
          req.user = decoded;
          return next();
        } catch (verifyError) {
          // Try next secret
          continue;
        }
      }
      
      // If all secrets fail, but token structure looks valid, allow in dev
      if (token.split('.').length === 3) {
        const decoded = jwt.decode(token) as any;
        req.user = {
          id: decoded?.id || 'dev-user',
          tenantId: decoded?.tenantId || req.headers['x-tenant-id'] as string || 'default-tenant',
          role: (decoded?.role || 'PROJECT_MANAGER') as UserRole,
        };
        return next();
      }
    }
    
    // Production: strict verification
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication failed', error);
    
    // In development, allow expired tokens
    if (process.env.NODE_ENV !== 'production') {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const token = authHeader.substring(7);
          const decoded = jwt.decode(token) as any;
          if (decoded && decoded.tenantId) {
            req.user = {
              id: decoded.id || 'dev-user',
              tenantId: decoded.tenantId || req.headers['x-tenant-id'] as string || 'default-tenant',
              role: (decoded.role || 'PROJECT_MANAGER') as UserRole,
            };
            return next();
          }
        }
      } catch (devError) {
        // Fall through to error response
      }
    }
    
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireProjectManager = requireRole(UserRole.PROJECT_MANAGER);

