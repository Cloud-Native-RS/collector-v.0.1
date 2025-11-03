import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email?: string;
      };
    }
  }
}

/**
 * JWT Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'collector_dev_jwt_secret_change_in_production';

    // Allow mock tokens in development
    if (token === 'mock-token' && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: 'mock-user-id',
        tenantId: req.headers['x-tenant-id'] as string || 'default-tenant',
        email: 'dev@example.com',
      };
      return next();
    }

    // In development, be more lenient with token validation
    let decoded: any;
    if (process.env.NODE_ENV !== 'production') {
      // In development, decode token without strict verification
      // This allows expired tokens and tokens signed with different secrets
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
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
            decoded = jwt.verify(token, secret, { ignoreExpiration: true }) as any;
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
      decoded = jwt.verify(token, jwtSecret) as any;
    }
    
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      ...(decoded.email ? { email: decoded.email } : {}),
    };

    // Ensure tenant ID matches between token and header
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId && decoded.tenantId !== headerTenantId) {
      throw new AppError('Tenant ID mismatch', 403);
    }

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }
    return next(new AppError('Invalid or expired token', 401));
  }
};

