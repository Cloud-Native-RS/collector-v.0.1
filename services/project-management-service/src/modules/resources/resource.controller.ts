import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { resourceService } from './resource.service';
import { logger } from '../../utils/logger';

export class ResourceController {
  async createResource(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const resource = await resourceService.createResource(req.body, tenantId);
      
      res.status(201).json(resource);
    } catch (error: any) {
      logger.error('Error creating resource', error);
      res.status(400).json({ error: error.message || 'Failed to create resource' });
    }
  }

  async getResource(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const resource = await resourceService.getResourceById(id, tenantId);
      res.json(resource);
    } catch (error: any) {
      logger.error('Error fetching resource', error);
      res.status(404).json({ error: error.message || 'Resource not found' });
    }
  }

  async getAllResources(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { type, userId } = req.query;
      
      const filters: any = {};
      if (type) filters.type = type;
      if (userId) filters.userId = userId as string;

      const resources = await resourceService.getAllResources(tenantId, filters);
      res.json(resources);
    } catch (error: any) {
      logger.error('Error fetching resources', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  }

  async updateResource(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const resource = await resourceService.updateResource(id, req.body, tenantId);
      res.json(resource);
    } catch (error: any) {
      logger.error('Error updating resource', error);
      res.status(400).json({ error: error.message || 'Failed to update resource' });
    }
  }

  async deleteResource(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      await resourceService.deleteResource(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting resource', error);
      res.status(404).json({ error: error.message || 'Resource not found' });
    }
  }

  async allocateResource(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const allocation = await resourceService.allocateResourceToTask(req.body, tenantId);
      
      res.status(201).json(allocation);
    } catch (error: any) {
      logger.error('Error allocating resource', error);
      res.status(400).json({ error: error.message || 'Failed to allocate resource' });
    }
  }

  async deallocateResource(req: AuthenticatedRequest, res: Response) {
    try {
      const { taskId, resourceId } = req.body;
      const tenantId = req.user!.tenantId;
      
      await resourceService.deallocateResourceFromTask(taskId, resourceId, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deallocating resource', error);
      res.status(400).json({ error: error.message || 'Failed to deallocate resource' });
    }
  }

  async getResourceAvailability(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const tenantId = req.user!.tenantId;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const availability = await resourceService.getResourceAvailability(
        id,
        new Date(startDate as string),
        new Date(endDate as string),
        tenantId
      );
      
      res.json(availability);
    } catch (error: any) {
      logger.error('Error fetching resource availability', error);
      res.status(400).json({ error: error.message || 'Failed to fetch resource availability' });
    }
  }
}

export const resourceController = new ResourceController();

