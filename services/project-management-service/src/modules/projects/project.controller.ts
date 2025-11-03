import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { projectService } from './project.service';
import { logger } from '../../utils/logger';

export class ProjectController {
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const project = await projectService.createProject(req.body, tenantId);
      
      res.status(201).json(project);
    } catch (error: any) {
      logger.error('Error creating project', error);
      res.status(400).json({ error: error.message || 'Failed to create project' });
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const project = await projectService.getProjectById(id, tenantId);
      res.json(project);
    } catch (error: any) {
      logger.error('Error fetching project', error);
      res.status(404).json({ error: error.message || 'Project not found' });
    }
  }

  async getAllProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const { status, clientId } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status;
      if (clientId) filters.clientId = clientId as string;

      const projects = await projectService.getAllProjects(tenantId, filters);
      res.json(projects);
    } catch (error: any) {
      logger.error('Error fetching projects', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const project = await projectService.updateProject(id, req.body, tenantId);
      res.json(project);
    } catch (error: any) {
      logger.error('Error updating project', error);
      res.status(400).json({ error: error.message || 'Failed to update project' });
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      await projectService.deleteProject(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('Error deleting project', error);
      res.status(404).json({ error: error.message || 'Project not found' });
    }
  }

  async getProjectProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      
      const progress = await projectService.getProjectProgress(id, tenantId);
      res.json(progress);
    } catch (error: any) {
      logger.error('Error fetching project progress', error);
      res.status(404).json({ error: error.message || 'Project not found' });
    }
  }
}

export const projectController = new ProjectController();

