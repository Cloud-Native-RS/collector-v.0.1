import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { logger } from '../utils/logger';

export const tenantMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract tenant ID from JWT or query parameter (fallback for testing)
    const tenantId = req.user.tenantId || req.query.tenantId as string;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Validate tenant exists (optional, depending on your setup)
    // const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    // if (!tenant) {
    //   return res.status(404).json({ error: 'Tenant not found' });
    // }

    // Attach tenant ID to request for easy access
    req.user.tenantId = tenantId;
    
    next();
  } catch (error) {
    logger.error('Tenant middleware error', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const ensureTenantIsolation = (
  modelName: string,
  idField: string = 'tenantId'
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user?.tenantId;
      const resourceId = req.params.id;

      if (!tenantId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if resource belongs to the tenant
      // This is a generic approach - in production, use proper type-safe queries
      const resource = await (prisma as any)[modelName].findUnique({
        where: { id: resourceId },
        select: { [idField]: true },
      });

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource[idField] !== tenantId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      logger.error('Tenant isolation check failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

