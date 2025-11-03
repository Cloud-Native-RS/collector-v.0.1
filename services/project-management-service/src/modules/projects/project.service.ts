import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { eventEmitter } from '../../events/emitter';
import { ProjectStatus } from '@prisma/client';
import { CreateProjectSchema, UpdateProjectSchema } from '../../types';
import { z } from 'zod';

export class ProjectService {
  async createProject(data: z.infer<typeof CreateProjectSchema>, tenantId: string) {
    const project = await prisma.project.create({
      data: {
        ...data,
        tenantId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: {
        milestones: true,
        tasks: {
          include: {
            milestone: true,
          },
        },
      },
    });

    logger.info('Project created', { projectId: project.id, tenantId });
    return project;
  }

  async getProjectById(id: string, tenantId: string) {
    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        tasks: {
          include: {
            milestone: true,
            dependencies: {
              include: {
                dependencyTask: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  async getAllProjects(tenantId: string, filters?: {
    status?: ProjectStatus;
    clientId?: string;
  }) {
    return prisma.project.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        milestones: {
          orderBy: { dueDate: 'asc' },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProject(
    id: string,
    data: z.infer<typeof UpdateProjectSchema>,
    tenantId: string
  ) {
    const existingProject = await prisma.project.findFirst({
      where: { id, tenantId },
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        milestones: true,
        tasks: true,
      },
    });

    // Emit event if status changed
    if (data.status && existingProject.status !== data.status) {
      eventEmitter.emitProjectStatusChanged({
        projectId: id,
        oldStatus: existingProject.status,
        newStatus: data.status,
        tenantId,
      });

      if (data.status === ProjectStatus.COMPLETED) {
        eventEmitter.emitProjectCompleted(id, tenantId);
      }
    }

    logger.info('Project updated', { projectId: id, tenantId });
    return project;
  }

  async deleteProject(id: string, tenantId: string) {
    const project = await prisma.project.findFirst({
      where: { id, tenantId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await prisma.project.delete({
      where: { id },
    });

    logger.info('Project deleted', { projectId: id, tenantId });
  }

  async getProjectProgress(id: string, tenantId: string) {
    const project = await this.getProjectById(id, tenantId);

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const blockedTasks = project.tasks.filter(t => t.status === 'BLOCKED').length;

    const progressPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    const totalEstimatedHours = project.tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    const totalActualHours = project.tasks.reduce(
      (sum, task) => sum + (task.actualHours || 0),
      0
    );

    // Save progress snapshot
    await prisma.projectProgress.create({
      data: {
        projectId: id,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        progressPercentage,
        totalEstimatedHours,
        totalActualHours,
        tenantId,
      },
    });

    return {
      projectId: id,
      projectName: project.name,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      progressPercentage,
      totalEstimatedHours,
      totalActualHours,
      milestones: project.milestones.map(m => ({
        id: m.id,
        name: m.name,
        status: m.status,
        dueDate: m.dueDate,
      })),
    };
  }
}

export const projectService = new ProjectService();

