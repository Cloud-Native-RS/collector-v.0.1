import { PrismaClient, Activity, ActivityType } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    type: ActivityType;
    title: string;
    description?: string;
    notes?: string;
    duration?: number;
    leadId?: string;
    dealId?: string;
    taskId?: string;
    userId?: string;
    tenantId: string;
  }): Promise<Activity> {
    // Validate that at least one relation is provided
    if (!data.leadId && !data.dealId && !data.taskId) {
      throw new AppError('Activity must be associated with a lead, deal, or task', 400);
    }

    // Validate relations exist and belong to tenant
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

    if (data.taskId) {
      const task = await this.prisma.task.findFirst({
        where: {
          id: data.taskId,
          tenantId: data.tenantId,
        },
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }
    }

    const activity = await this.prisma.activity.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        notes: data.notes,
        duration: data.duration,
        leadId: data.leadId,
        dealId: data.dealId,
        taskId: data.taskId,
        userId: data.userId,
        tenantId: data.tenantId,
      },
      include: {
        lead: true,
        deal: true,
        task: true,
      },
    });

    return activity;
  }

  async getById(id: string, tenantId: string): Promise<Activity | null> {
    return this.prisma.activity.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lead: true,
        deal: true,
        task: true,
      },
    });
  }

  async getAll(
    tenantId: string,
    options: {
      skip?: number;
      take?: number;
      leadId?: string;
      dealId?: string;
      taskId?: string;
      type?: ActivityType;
    } = {}
  ): Promise<{ activities: Activity[]; total: number }> {
    const { skip = 0, take = 20, leadId, dealId, taskId, type } = options;

    const where: any = {
      tenantId,
    };

    if (leadId) {
      where.leadId = leadId;
    }

    if (dealId) {
      where.dealId = dealId;
    }

    if (taskId) {
      where.taskId = taskId;
    }

    if (type) {
      where.type = type;
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          lead: true,
          deal: true,
          task: true,
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { activities, total };
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      type: ActivityType;
      title: string;
      description: string;
      notes: string;
      duration: number;
    }>
  ): Promise<Activity> {
    const activity = await this.getById(id, tenantId);

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data,
      include: {
        lead: true,
        deal: true,
        task: true,
      },
    });

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const activity = await this.getById(id, tenantId);

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    await this.prisma.activity.delete({
      where: { id },
    });
  }
}

