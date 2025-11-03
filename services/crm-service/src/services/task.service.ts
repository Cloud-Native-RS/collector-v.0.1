import { PrismaClient, Task, TaskStatus, TaskType, TaskPriority } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    title: string;
    description?: string;
    type: TaskType;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date;
    assignedTo?: string;
    leadId?: string;
    dealId?: string;
    tenantId: string;
  }): Promise<Task> {
    // Validate that either leadId or dealId is provided
    if (!data.leadId && !data.dealId) {
      throw new AppError('Task must be associated with either a lead or a deal', 400);
    }

    // Validate lead/deal exists and belongs to tenant
    if (data.leadId) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          id: data.leadId,
          tenantId: data.tenantId,
        },
      });

      if (!lead) {
        throw new AppError('Lead not found', 404);
      }
    }

    if (data.dealId) {
      const deal = await this.prisma.deal.findFirst({
        where: {
          id: data.dealId,
          tenantId: data.tenantId,
        },
      });

      if (!deal) {
        throw new AppError('Deal not found', 404);
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status || TaskStatus.PENDING,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: data.dueDate,
        assignedTo: data.assignedTo,
        leadId: data.leadId,
        dealId: data.dealId,
        tenantId: data.tenantId,
      },
      include: {
        lead: true,
        deal: true,
      },
    });

    return task;
  }

  async getById(id: string, tenantId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lead: true,
        deal: true,
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async getAll(
    tenantId: string,
    options: {
      skip?: number;
      take?: number;
      status?: TaskStatus;
      priority?: TaskPriority;
      leadId?: string;
      dealId?: string;
      assignedTo?: string;
    } = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    const { skip = 0, take = 20, status, priority, leadId, dealId, assignedTo } = options;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (dealId) {
      where.dealId = dealId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: {
          dueDate: 'asc',
        },
        include: {
          lead: true,
          deal: true,
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { tasks, total };
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      title: string;
      description: string;
      type: TaskType;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate: Date;
      assignedTo: string;
    }>
  ): Promise<Task> {
    const task = await this.getById(id, tenantId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    const updateData: any = { ...data };

    // If marking as completed, set completedAt
    if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    // If unmarking completed, clear completedAt
    if (data.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
      updateData.completedAt = null;
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        lead: true,
        deal: true,
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const task = await this.getById(id, tenantId);

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    await this.prisma.task.delete({
      where: { id },
    });
  }

  async complete(id: string, tenantId: string): Promise<Task> {
    return this.update(id, tenantId, {
      status: TaskStatus.COMPLETED,
    });
  }
}

