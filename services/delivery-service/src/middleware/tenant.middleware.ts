import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export const tenantMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tenantId = req.headers['x-tenant-id'] as string || req.headers['tenant-id'] as string;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant ID is required',
        statusCode: 401,
      },
    });
  }

  req.tenantId = tenantId;
  next();
};

