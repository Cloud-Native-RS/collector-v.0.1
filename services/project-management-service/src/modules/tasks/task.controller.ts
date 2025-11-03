import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { taskService } from './task.service';
import { logger } from '../../utils/logger';

export class TaskController {
  async createTask(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const task = await taskService.createTask(req.body, tenantId);
      
      res.status(201).json(task);
    } catch (error: any) {
      logger.error('Error creating task', error);
      res.status(400).json({ error: error.message || 'Failed to create task' });
    }
  }

  async getTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const task = await taskService.getTaskById(id, tenantId);
      res.json(task);
    } catch (error: any) {
      logger.error('Error fetching task', error);
      res.status(404).json({ error: error.message || 'Task not found' });
    }
  }

  async getAllTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { projectId, milestoneId, assignedTo, status, priority } = req.query;
      
      const filters: any = {};
      if (projectId) filters.projectId = projectId as string;
      if (milestoneId) filters.milestoneId = milestoneId as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;

      const tasks = await taskService.getAllTasks(tenantId, filters);
      res.json(tasks);
    } catch (error: any) {
      logger.error('Error fetching tasks', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const task = await taskService.updateTask(id, req.body, tenantId);
      res.json(task);
    } catch (error: any) {
      logger.error('Error updating task', error);
      res.status(400).json({ error: error.message || 'Failed to update task' });
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      await taskService.deleteTask(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting task', error);
      res.status(404).json({ error: error.message || 'Task not found' });
    }
  }
}

export const taskController = new TaskController();

