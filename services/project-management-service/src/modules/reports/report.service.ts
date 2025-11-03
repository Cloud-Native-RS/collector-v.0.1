import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';

export class ReportService {
  async getProjectSummary(tenantId: string, projectId?: string) {
    const projects = await prisma.project.findMany({
      where: {
        tenantId,
        ...(projectId && { id: projectId }),
      },
      include: {
        milestones: true,
        tasks: true,
      },
    });

    return projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
      const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const blockedTasks = project.tasks.filter(t => t.status === 'BLOCKED').length;

      return {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        totalMilestones: project.milestones.length,
        achievedMilestones: project.milestones.filter(m => m.status === 'ACHIEVED').length,
        progressPercentage: totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0,
      };
    });
  }

  async getTasksByStatus(tenantId: string, startDate?: Date, endDate?: Date) {
    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        }),
      },
      select: {
        status: true,
        priority: true,
        completedAt: true,
      },
    });

    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks: tasks.length,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
    };
  }

  async getResourceUtilization(tenantId: string, resourceId?: string) {
    const whereClause = resourceId 
      ? { tenantId, resourceId }
      : { tenantId };

    const allocations = await prisma.taskResource.findMany({
      where: whereClause,
      include: {
        resource: true,
        task: {
          select: {
            id: true,
            name: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const resourceGroups = allocations.reduce((acc, alloc) => {
      const resourceId = alloc.resourceId;
      if (!acc[resourceId]) {
        acc[resourceId] = {
          resource: alloc.resource,
          totalAllocatedHours: 0,
          activeTasks: 0,
          tasks: [],
        };
      }
      acc[resourceId].totalAllocatedHours += alloc.allocatedHours;
      if (alloc.task.status !== 'COMPLETED') {
        acc[resourceId].activeTasks++;
      }
      acc[resourceId].tasks.push(alloc.task);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(resourceGroups);
  }

  async getOverdueTasks(tenantId: string) {
    const now = new Date();
    
    const overdueTasks = await prisma.task.findMany({
      where: {
        tenantId,
        dueDate: {
          lt: now,
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
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
      orderBy: { dueDate: 'asc' },
    });

    return overdueTasks;
  }

  async getDelayedMilestones(tenantId: string) {
    const now = new Date();
    
    const delayedMilestones = await prisma.milestone.findMany({
      where: {
        tenantId,
        dueDate: {
          lt: now,
        },
        status: {
          not: 'ACHIEVED',
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          where: {
            status: {
              not: 'COMPLETED',
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return delayedMilestones;
  }

  async getTeamWorkload(tenantId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        assignedTo: {
          not: null,
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      select: {
        assignedTo: true,
        estimatedHours: true,
        actualHours: true,
        priority: true,
      },
    });

    const workload = tasks.reduce((acc, task) => {
      if (!task.assignedTo) return acc;
      
      if (!acc[task.assignedTo]) {
        acc[task.assignedTo] = {
          userId: task.assignedTo,
          totalTasks: 0,
          totalEstimatedHours: 0,
          totalActualHours: 0,
          highPriorityTasks: 0,
        };
      }

      acc[task.assignedTo].totalTasks++;
      acc[task.assignedTo].totalEstimatedHours += task.estimatedHours || 0;
      acc[task.assignedTo].totalActualHours += task.actualHours || 0;
      
      if (task.priority === 'HIGH' || task.priority === 'URGENT') {
        acc[task.assignedTo].highPriorityTasks++;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(workload);
  }
}

export const reportService = new ReportService();

