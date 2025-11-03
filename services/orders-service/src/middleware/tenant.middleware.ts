import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Tenant isolation middleware
 * Ensures all requests include a tenant ID
 * 
 * When using Kong Gateway with identity middleware, tenantId comes from req.user.tenantId
 * This middleware serves as a fallback for legacy direct requests or hybrid mode
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Prefer tenant ID from authenticated user (set by identity middleware)
  // Fall back to header or default
  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string || 'default-tenant';
  
  if (!tenantId) {
    return next(new AppError('Tenant ID is required', 400));
  }

  req.tenantId = tenantId;
  next();
};

