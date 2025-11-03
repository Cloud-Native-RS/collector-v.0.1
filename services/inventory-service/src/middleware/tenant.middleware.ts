import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // In production, extract tenant ID from JWT token or header
  const tenantId = req.headers['x-tenant-id'] as string || 'default-tenant';
  
  if (!tenantId) {
    return next(new AppError('Tenant ID is required', 400));
  }

  req.tenantId = tenantId;
  next();
};

