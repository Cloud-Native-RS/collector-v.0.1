import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new AppError('JWT secret not configured', 500));
    }

    const decoded = jwt.verify(token, secret) as { userId: string; tenantId: string; role: string };

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

