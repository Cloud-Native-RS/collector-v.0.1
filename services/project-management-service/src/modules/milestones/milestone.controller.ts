import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { milestoneService } from './milestone.service';
import { logger } from '../../utils/logger';

export class MilestoneController {
  async createMilestone(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const milestone = await milestoneService.createMilestone(req.body, tenantId);
      
      res.status(201).json(milestone);
    } catch (error: any) {
      logger.error('Error creating milestone', error);
      res.status(400).json({ error: error.message || 'Failed to create milestone' });
    }
  }

  async getMilestone(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const milestone = await milestoneService.getMilestoneById(id, tenantId);
      res.json(milestone);
    } catch (error: any) {
      logger.error('Error fetching milestone', error);
      res.status(404).json({ error: error.message || 'Milestone not found' });
    }
  }

  async getAllMilestones(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { projectId } = req.query;
      
      const milestones = await milestoneService.getAllMilestones(
        tenantId,
        projectId as string | undefined
      );
      res.json(milestones);
    } catch (error: any) {
      logger.error('Error fetching milestones', error);
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  }

  async updateMilestone(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const milestone = await milestoneService.updateMilestone(id, req.body, tenantId);
      res.json(milestone);
    } catch (error: any) {
      logger.error('Error updating milestone', error);
      res.status(400).json({ error: error.message || 'Failed to update milestone' });
    }
  }

  async deleteMilestone(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      await milestoneService.deleteMilestone(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting milestone', error);
      res.status(404).json({ error: error.message || 'Milestone not found' });
    }
  }
}

export const milestoneController = new MilestoneController();

