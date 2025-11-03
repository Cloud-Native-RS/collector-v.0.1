import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { eventEmitter } from '../../events/emitter';
import { milestoneService } from '../milestones/milestone.service';
import { TaskStatus } from '@prisma/client';
import { CreateTaskSchema, UpdateTaskSchema } from '../../types';
import { z } from 'zod';

export class TaskService {
  async createTask(data: z.infer<typeof CreateTaskSchema>, tenantId: string) {
    // Verify project exists and belongs to tenant
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, tenantId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify milestone if provided
    if (data.milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: { id: data.milestoneId, projectId: data.projectId, tenantId },
      });

      if (!milestone) {
        throw new Error('Milestone not found or does not belong to this project');
      }
    }

    // Create task without dependencies first
    const { dependencies, ...taskData } = data;
    const task = await prisma.task.create({
      data: {
        ...taskData,
        tenantId,
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      },
      include: {
        project: true,
        milestone: true,
        dependsOn: {
          include: {
            dependencyTask: true,
          },
        },
      },
    });

    // Create dependencies if provided
    if (dependencies && dependencies.length > 0) {
      await this.createDependencies(task.id, dependencies, tenantId);
    }

    logger.info('Task created', { taskId: task.id, tenantId });
    return task;
  }

  async getTaskById(id: string, tenantId: string) {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        milestone: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        dependsOn: {
          include: {
            dependencyTask: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        dependencies: {
          include: {
            dependentTask: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async getAllTasks(tenantId: string, filters?: {
    projectId?: string;
    milestoneId?: string;
    assignedTo?: string;
    status?: TaskStatus;
    priority?: string;
  }) {
    return prisma.task.findMany({
      where: {
        tenantId,
        ...(filters?.projectId && { projectId: filters.projectId }),
        ...(filters?.milestoneId && { milestoneId: filters.milestoneId }),
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority as any }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        milestone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async updateTask(
    id: string,
    data: z.infer<typeof UpdateTaskSchema>,
    tenantId: string
  ) {
    const existingTask = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      throw new Error('Task not found');
    }

    const { dependencies, ...updateData } = data;
    const update: any = { ...updateData };
    
    if (updateData.startDate) update.startDate = new Date(updateData.startDate);
    if (updateData.dueDate) update.dueDate = new Date(updateData.dueDate);

    // Mark completed
    if (updateData.status === TaskStatus.COMPLETED && existingTask.status !== TaskStatus.COMPLETED) {
      update.completedAt = new Date();
      
      // Check if dependencies are completed
      await this.validateTaskCompletion(id, tenantId);
    }

    const task = await prisma.task.update({
      where: { id },
      data: update,
      include: {
        project: true,
        milestone: true,
        dependsOn: {
          include: {
            dependencyTask: true,
          },
        },
      },
    });

    // Update dependencies if provided
    if (dependencies !== undefined) {
      await this.updateDependencies(id, dependencies, tenantId);
    }

    // Emit events
    if (updateData.status) {
      if (task.status === TaskStatus.COMPLETED) {
        eventEmitter.emitTaskCompleted({
          taskId: task.id,
          projectId: task.projectId,
          assignedTo: task.assignedTo || '',
          completedAt: task.completedAt!,
          tenantId,
        });

        // Auto-update milestone status
        if (task.milestoneId) {
          await milestoneService.updateMilestoneStatusAuto(task.milestoneId, tenantId);
        }
      } else if (task.status === TaskStatus.BLOCKED) {
        eventEmitter.emitTaskBlocked(task.id, tenantId);
      }
    }

    logger.info('Task updated', { taskId: id, tenantId });
    return task;
  }

  async deleteTask(id: string, tenantId: string) {
    const task = await prisma.task.findFirst({
      where: { id, tenantId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Delete dependencies
    await prisma.taskDependency.deleteMany({
      where: {
        OR: [
          { dependentTaskId: id },
          { dependencyTaskId: id },
        ],
      },
    });

    await prisma.task.delete({
      where: { id },
    });

    logger.info('Task deleted', { taskId: id, tenantId });
  }

  private async createDependencies(
    taskId: string,
    dependencyIds: string[],
    tenantId: string
  ) {
    const dependencies = dependencyIds.map(dependencyId => ({
      dependentTaskId: taskId,
      dependencyTaskId: dependencyId,
      tenantId,
    }));

    await prisma.taskDependency.createMany({
      data: dependencies,
      skipDuplicates: true,
    });
  }

  private async updateDependencies(
    taskId: string,
    dependencyIds: string[],
    tenantId: string
  ) {
    // Delete existing dependencies
    await prisma.taskDependency.deleteMany({
      where: { dependentTaskId: taskId },
    });

    // Create new dependencies
    if (dependencyIds.length > 0) {
      await this.createDependencies(taskId, dependencyIds, tenantId);
    }
  }

  private async validateTaskCompletion(taskId: string, tenantId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, tenantId },
      include: {
        dependsOn: {
          include: {
            dependencyTask: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if all dependencies are completed
    const incompleteDependencies = task.dependsOn.filter(
      dep => dep.dependencyTask.status !== TaskStatus.COMPLETED
    );

    if (incompleteDependencies.length > 0) {
      const dependencyNames = incompleteDependencies
        .map(dep => dep.dependencyTask.name)
        .join(', ');
      
      throw new Error(
        `Cannot complete task. Dependencies must be completed first: ${dependencyNames}`
      );
    }
  }
}

export const taskService = new TaskService();

