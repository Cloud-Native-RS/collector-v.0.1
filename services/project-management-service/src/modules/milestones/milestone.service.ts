import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { eventEmitter } from '../../events/emitter';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';
import { CreateMilestoneSchema, UpdateMilestoneSchema } from '../../types';
import { z } from 'zod';

export class MilestoneService {
  async createMilestone(data: z.infer<typeof CreateMilestoneSchema>, tenantId: string) {
    // Verify project exists and belongs to tenant
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, tenantId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const milestone = await prisma.milestone.create({
      data: {
        ...data,
        tenantId,
        dueDate: new Date(data.dueDate),
      },
      include: {
        project: true,
        tasks: true,
      },
    });

    logger.info('Milestone created', { milestoneId: milestone.id, tenantId });
    return milestone;
  }

  async getMilestoneById(id: string, tenantId: string) {
    const milestone = await prisma.milestone.findFirst({
      where: { id, tenantId },
      include: {
        project: true,
        tasks: {
          include: {
            dependencies: {
              include: {
                dependencyTask: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    return milestone;
  }

  async getAllMilestones(tenantId: string, projectId?: string) {
    return prisma.milestone.findMany({
      where: {
        tenantId,
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async updateMilestone(
    id: string,
    data: z.infer<typeof UpdateMilestoneSchema>,
    tenantId: string
  ) {
    const existingMilestone = await prisma.milestone.findFirst({
      where: { id, tenantId },
    });

    if (!existingMilestone) {
      throw new Error('Milestone not found');
    }

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const milestone = await prisma.milestone.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        tasks: true,
      },
    });

    // Auto-update status based on tasks
    await this.updateMilestoneStatusAuto(id, tenantId);

    logger.info('Milestone updated', { milestoneId: id, tenantId });
    return milestone;
  }

  async deleteMilestone(id: string, tenantId: string) {
    const milestone = await prisma.milestone.findFirst({
      where: { id, tenantId },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    await prisma.milestone.delete({
      where: { id },
    });

    logger.info('Milestone deleted', { milestoneId: id, tenantId });
  }

  async updateMilestoneStatusAuto(milestoneId: string, tenantId: string) {
    const milestone = await prisma.milestone.findFirst({
      where: { id: milestoneId, tenantId },
      include: {
        tasks: true,
      },
    });

    if (!milestone) {
      return;
    }

    const tasks = milestone.tasks;
    const allTasksCompleted = tasks.every(t => t.status === 'COMPLETED');
    const hasTasks = tasks.length > 0;

    let newStatus: MilestoneStatus = milestone.status;

    if (hasTasks && allTasksCompleted && milestone.status !== MilestoneStatus.ACHIEVED) {
      newStatus = MilestoneStatus.ACHIEVED;
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: newStatus,
          achievedAt: new Date(),
        },
      });

      eventEmitter.emitMilestoneAchieved({
        milestoneId: milestone.id,
        projectId: milestone.projectId,
        achievedAt: new Date(),
        tenantId,
      });

      logger.info('Milestone auto-achieved', { milestoneId, tenantId });
    } else if (hasTasks && !allTasksCompleted && milestone.status === MilestoneStatus.ACHIEVED) {
      // If milestone was marked achieved but tasks are incomplete, revert
      newStatus = MilestoneStatus.PENDING;
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: newStatus,
          achievedAt: null,
        },
      });
    }

    // Check for delayed milestones
    if (milestone.status !== MilestoneStatus.ACHIEVED && 
        milestone.dueDate < new Date() && 
        milestone.status !== MilestoneStatus.DELAYED) {
      newStatus = MilestoneStatus.DELAYED;
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: newStatus },
      });

      eventEmitter.emitMilestoneDelayed(milestoneId, milestone.projectId, tenantId);
      logger.info('Milestone marked as delayed', { milestoneId, tenantId });
    }

    return newStatus;
  }
}

export const milestoneService = new MilestoneService();

