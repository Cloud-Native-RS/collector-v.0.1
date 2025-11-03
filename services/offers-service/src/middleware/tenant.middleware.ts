import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

/**
 * Tenant context validation middleware
 * Ensures tenantId is present in request context
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Tenant ID should come from authenticated user or header (for internal services)
  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return next(new AppError('Tenant context required', 400));
  }

  // Attach tenantId to request for use in services
  req.tenantId = tenantId;
  next();
};

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

