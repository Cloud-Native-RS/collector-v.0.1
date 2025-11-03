import { PrismaClient, Deal, DealStage } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateDealNumber } from '../utils/number-generator';

export class DealService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    title: string;
    description?: string;
    value: number;
    probability: number;
    stage?: DealStage;
    expectedCloseDate?: Date;
    customerId?: string;
    leadId?: string;
    assignedTo?: string;
    tenantId: string;
  }): Promise<Deal> {
    // Validate lead if provided
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

    // Generate unique deal number
    let dealNumber = generateDealNumber();
    while (await this.prisma.deal.findUnique({ where: { dealNumber } })) {
      dealNumber = generateDealNumber();
    }

    const deal = await this.prisma.deal.create({
      data: {
        ...data,
        dealNumber,
        value: data.value || 0,
        probability: Math.max(0, Math.min(100, data.probability || 0)),
        stage: data.stage || DealStage.LEAD,
      },
      include: {
        lead: true,
        tasks: true,
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    return deal;
  }

  async getById(id: string, tenantId: string): Promise<Deal | null> {
    return this.prisma.deal.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lead: true,
        tasks: true,
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
      stage?: DealStage;
      assignedTo?: string;
      search?: string;
    } = {}
  ): Promise<{ deals: Deal[]; total: number }> {
    const { skip = 0, take = 20, stage, assignedTo, search } = options;

    const where: any = {
      tenantId,
    };

    if (stage) {
      where.stage = stage;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { dealNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          lead: true,
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return { deals, total };
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      title: string;
      description: string;
      value: number;
      probability: number;
      stage: DealStage;
      expectedCloseDate: Date;
      customerId: string;
      assignedTo: string;
    }>
  ): Promise<Deal> {
    const deal = await this.getById(id, tenantId);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    const updateData: any = { ...data };

    // Validate probability range
    if (data.probability !== undefined) {
      updateData.probability = Math.max(0, Math.min(100, data.probability));
    }

    // Handle stage changes
    if (data.stage) {
      if (data.stage === DealStage.CLOSED_WON && deal.stage !== DealStage.CLOSED_WON) {
        updateData.wonAt = new Date();
        updateData.actualCloseDate = new Date();
      } else if (data.stage === DealStage.CLOSED_LOST && deal.stage !== DealStage.CLOSED_LOST) {
        updateData.lostAt = new Date();
        updateData.actualCloseDate = new Date();
      }
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        lead: true,
        tasks: true,
      },
    });

    return updated;
  }

  async updateStage(
    id: string,
    tenantId: string,
    stage: DealStage,
    lostReason?: string
  ): Promise<Deal> {
    const updateData: any = { stage };

    if (lostReason) {
      updateData.lostReason = lostReason;
    }

    return this.update(id, tenantId, updateData);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deal = await this.getById(id, tenantId);

    if (!deal) {
      throw new AppError('Deal not found', 404);
    }

    await this.prisma.deal.delete({
      where: { id },
    });
  }

  async getPipelineStats(tenantId: string): Promise<{
    stages: Array<{
      stage: DealStage;
      count: number;
      value: number;
    }>;
    totalValue: number;
    weightedValue: number; // Sum of value * probability
  }> {
    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        stage: {
          not: DealStage.CLOSED_LOST,
        },
      },
      select: {
        stage: true,
        value: true,
        probability: true,
      },
    });

    const stageStats: Record<DealStage, { count: number; value: number }> = {
      LEAD: { count: 0, value: 0 },
      QUALIFIED: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      CLOSED_WON: { count: 0, value: 0 },
      CLOSED_LOST: { count: 0, value: 0 },
    };

    let totalValue = 0;
    let weightedValue = 0;

    deals.forEach((deal) => {
      stageStats[deal.stage].count++;
      stageStats[deal.stage].value += deal.value;
      totalValue += deal.value;
      weightedValue += deal.value * (deal.probability / 100);
    });

    const stages = Object.entries(stageStats)
      .filter(([stage]) => stage !== DealStage.CLOSED_LOST)
      .map(([stage, stats]) => ({
        stage: stage as DealStage,
        count: stats.count,
        value: stats.value,
      }));

    return {
      stages,
      totalValue,
      weightedValue,
    };
  }
}

