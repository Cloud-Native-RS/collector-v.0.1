import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

interface JwtPayload {
  id?: string;
  userId?: string;
  tenantId: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        tenantId: string;
        role?: string;
        email?: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError('JWT secret not configured', 500));
    }

    // In development, be more lenient with token validation
    let decoded: JwtPayload | null = null;
    if (process.env.NODE_ENV !== 'production') {
      // In development, decode token without strict verification
      // This allows expired tokens and tokens signed with different secrets
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString()) as JwtPayload;
          // Validate payload structure - just check it has required fields
          // Allow expired tokens in development by checking structure only
          if ((payload.id || payload.userId) && payload.tenantId) {
            decoded = payload;
            // Normalize id field
            if (decoded.userId && !decoded.id) {
              decoded.id = decoded.userId;
            }
          }
        }
      } catch (parseError) {
        // If decode fails, try verification with multiple secrets as fallback
        const secrets = [jwtSecret, 'collector_dev_jwt_secret_change_in_production', 'dev-secret', 'dev-jwt-secret-change-in-production'];
        for (const secret of secrets) {
          try {
            decoded = jwt.verify(token, secret, { ignoreExpiration: true }) as JwtPayload;
            // Normalize id field
            if (decoded.userId && !decoded.id) {
              decoded.id = decoded.userId;
            }
            break;
          } catch {
            // Continue to next secret
          }
        }
      }
      
      // If still no decoded token, throw error with more details
      if (!decoded) {
        console.warn('Token decode failed in development mode', { 
          tokenLength: token.length,
          hasSecret: !!jwtSecret 
        });
        throw new AppError('Invalid token', 401);
      }
    } else {
      // Production: strict validation
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      // Normalize id field
      if (decoded.userId && !decoded.id) {
        decoded.id = decoded.userId;
      }
    }
    
    // Extract userId and tenantId (support both id and userId fields)
    const userId = decoded.id || decoded.userId;
    const tenantId = decoded.tenantId;

    if (!userId || !tenantId) {
      return next(new AppError('Invalid token: missing required fields', 401));
    }

    req.userId = userId;
    req.user = {
      id: userId,
      tenantId: tenantId,
      ...(decoded.role ? { role: decoded.role } : { role: 'user' }),
      ...(decoded.email ? { email: decoded.email } : {}),
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired token', 401));
  }
};

