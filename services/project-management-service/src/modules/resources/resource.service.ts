import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';
import { ResourceType } from '@prisma/client';
import { CreateResourceSchema, AllocateResourceSchema } from '../../types';
import { z } from 'zod';

export class ResourceService {
  async createResource(data: z.infer<typeof CreateResourceSchema>, tenantId: string) {
    const resource = await prisma.resource.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        taskResources: {
          include: {
            task: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    logger.info('Resource created', { resourceId: resource.id, tenantId });
    return resource;
  }

  async getResourceById(id: string, tenantId: string) {
    const resource = await prisma.resource.findFirst({
      where: { id, tenantId },
      include: {
        taskResources: {
          include: {
            task: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }

  async getAllResources(tenantId: string, filters?: {
    type?: ResourceType;
    userId?: string;
  }) {
    return prisma.resource.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        taskResources: {
          include: {
            task: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateResource(
    id: string,
    data: Partial<z.infer<typeof CreateResourceSchema>>,
    tenantId: string
  ) {
    const resource = await prisma.resource.findFirst({
      where: { id, tenantId },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    const updatedResource = await prisma.resource.update({
      where: { id },
      data,
      include: {
        taskResources: {
          include: {
            task: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    logger.info('Resource updated', { resourceId: id, tenantId });
    return updatedResource;
  }

  async deleteResource(id: string, tenantId: string) {
    const resource = await prisma.resource.findFirst({
      where: { id, tenantId },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    await prisma.resource.delete({
      where: { id },
    });

    logger.info('Resource deleted', { resourceId: id, tenantId });
  }

  async allocateResourceToTask(data: z.infer<typeof AllocateResourceSchema>, tenantId: string) {
    // Verify task exists
    const task = await prisma.task.findFirst({
      where: { id: data.taskId, tenantId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Verify resource exists
    const resource = await prisma.resource.findFirst({
      where: { id: data.resourceId, tenantId },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if resource is already allocated to this task
    const existingAllocation = await prisma.taskResource.findFirst({
      where: {
        taskId: data.taskId,
        resourceId: data.resourceId,
        tenantId,
      },
    });

    if (existingAllocation) {
      throw new Error('Resource is already allocated to this task');
    }

    const allocation = await prisma.taskResource.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        resource: true,
      },
    });

    logger.info('Resource allocated to task', {
      resourceId: data.resourceId,
      taskId: data.taskId,
      tenantId,
    });

    return allocation;
  }

  async deallocateResourceFromTask(taskId: string, resourceId: string, tenantId: string) {
    const allocation = await prisma.taskResource.findFirst({
      where: {
        taskId,
        resourceId,
        tenantId,
      },
    });

    if (!allocation) {
      throw new Error('Resource allocation not found');
    }

    await prisma.taskResource.delete({
      where: {
        taskId_resourceId: {
          taskId,
          resourceId,
        },
      },
    });

    logger.info('Resource deallocated from task', {
      resourceId,
      taskId,
      tenantId,
    });
  }

  async getResourceAvailability(resourceId: string, startDate: Date, endDate: Date, tenantId: string) {
    const resource = await prisma.resource.findFirst({
      where: { id: resourceId, tenantId },
      include: {
        taskResources: {
          where: {
            task: {
              OR: [
                { status: 'PENDING' },
                { status: 'IN_PROGRESS' },
              ],
            },
          },
          include: {
            task: {
              select: {
                id: true,
                name: true,
                startDate: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    // Calculate allocated hours for the period
    const allocationsInPeriod = resource.taskResources.filter(tr => {
      const task = tr.task;
      if (!task.startDate || !task.dueDate) return false;
      
      // Check if task overlaps with the requested period
      return (
        (task.startDate <= endDate && task.dueDate >= startDate)
      );
    });

    const totalAllocatedHours = allocationsInPeriod.reduce(
      (sum, tr) => sum + tr.allocatedHours,
      0
    );

    return {
      resource,
      allocationsInPeriod: allocationsInPeriod.length,
      totalAllocatedHours,
      period: { startDate, endDate },
    };
  }
}

export const resourceService = new ResourceService();

