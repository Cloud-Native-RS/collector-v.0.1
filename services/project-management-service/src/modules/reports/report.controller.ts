import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { reportService } from './report.service';
import { logger } from '../../utils/logger';

export class ReportController {
  async getProjectSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { projectId } = req.query;
      
      const summary = await reportService.getProjectSummary(
        tenantId,
        projectId as string | undefined
      );
      res.json(summary);
    } catch (error: any) {
      logger.error('Error generating project summary', error);
      res.status(500).json({ error: 'Failed to generate project summary' });
    }
  }

  async getTasksByStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;
      
      const report = await reportService.getTasksByStatus(
        tenantId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(report);
    } catch (error: any) {
      logger.error('Error generating tasks report', error);
      res.status(500).json({ error: 'Failed to generate tasks report' });
    }
  }

  async getResourceUtilization(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { resourceId } = req.query;
      
      const report = await reportService.getResourceUtilization(
        tenantId,
        resourceId as string | undefined
      );
      res.json(report);
    } catch (error: any) {
      logger.error('Error generating resource utilization report', error);
      res.status(500).json({ error: 'Failed to generate resource utilization report' });
    }
  }

  async getOverdueTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      
      const tasks = await reportService.getOverdueTasks(tenantId);
      res.json(tasks);
    } catch (error: any) {
      logger.error('Error fetching overdue tasks', error);
      res.status(500).json({ error: 'Failed to fetch overdue tasks' });
    }
  }

  async getDelayedMilestones(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      
      const milestones = await reportService.getDelayedMilestones(tenantId);
      res.json(milestones);
    } catch (error: any) {
      logger.error('Error fetching delayed milestones', error);
      res.status(500).json({ error: 'Failed to fetch delayed milestones' });
    }
  }

  async getTeamWorkload(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      
      const workload = await reportService.getTeamWorkload(tenantId);
      res.json(workload);
    } catch (error: any) {
      logger.error('Error generating team workload report', error);
      res.status(500).json({ error: 'Failed to generate team workload report' });
    }
  }
}

export const reportController = new ReportController();

