import { PrismaClient, Lead, LeadStatus, LeadSource } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generateLeadNumber } from '../utils/number-generator';

export class LeadService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    companyType?: string;
    tradingName?: string;
    companyWebsite?: string;
    companyIndustry?: string;
    companySize?: string;
    companyAddress?: string;
    companyTaxId?: string;
    companyRegistrationNumber?: string;
    legalRepName?: string;
    legalRepTitle?: string;
    legalRepEmail?: string;
    legalRepPhone?: string;
    source: LeadSource;
    status: LeadStatus;
    value?: number;
    assignedTo?: string;
    notes?: string;
    tenantId: string;
  }): Promise<Lead> {
    // Check for duplicate email
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        email: data.email,
        tenantId: data.tenantId,
      },
    });

    if (existingLead) {
      throw new AppError('Lead with this email already exists', 400);
    }

    // Generate unique lead number
    let leadNumber = generateLeadNumber();
    while (await this.prisma.lead.findUnique({ where: { leadNumber } })) {
      leadNumber = generateLeadNumber();
    }

    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        leadNumber,
        value: data.value || 0,
      },
    });

    return lead;
  }

  async getById(id: string, tenantId: string): Promise<Lead | null> {
    return this.prisma.lead.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        tasks: true,
        deals: true,
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async getAll(
    tenantId: string,
    options: {
      skip?: number;
      take?: number;
      status?: LeadStatus;
      source?: LeadSource;
      assignedTo?: string;
      search?: string;
    } = {}
  ): Promise<{ leads: Lead[]; total: number }> {
    const { skip = 0, take = 20, status, source, assignedTo, search } = options;

    const where: any = {
      tenantId,
      convertedToCustomerId: null, // Exclude converted leads
    };

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { leads, total };
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      company: string;
      companyType: string;
      tradingName: string;
      companyWebsite: string;
      companyIndustry: string;
      companySize: string;
      companyAddress: string;
      companyTaxId: string;
      companyRegistrationNumber: string;
      legalRepName: string;
      legalRepTitle: string;
      legalRepEmail: string;
      legalRepPhone: string;
      source: LeadSource;
      status: LeadStatus;
      value: number;
      assignedTo: string;
      notes: string;
    }>
  ): Promise<Lead> {
    const lead = await this.getById(id, tenantId);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== lead.email) {
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          email: data.email,
          tenantId,
          id: { not: id },
        },
      });

      if (existingLead) {
        throw new AppError('Lead with this email already exists', 400);
      }
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data,
    });

    return updated;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const lead = await this.getById(id, tenantId);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    await this.prisma.lead.delete({
      where: { id },
    });
  }

  async markAsConverted(id: string, tenantId: string, customerId: string): Promise<Lead> {
    const lead = await this.getById(id, tenantId);

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    if (lead.convertedToCustomerId) {
      throw new AppError('Lead already converted to customer', 400);
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.WON,
        convertedToCustomerId: customerId,
        convertedAt: new Date(),
      },
    });

    return updated;
  }

  async getStats(tenantId: string): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    totalValue: number;
  }> {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId },
      select: {
        status: true,
        source: true,
        value: true,
      },
    });

    const total = leads.length;
    const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);

    const byStatus: Record<LeadStatus, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      PROPOSAL_SENT: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0,
    };

    const bySource: Record<LeadSource, number> = {
      WEBSITE: 0,
      SOCIAL: 0,
      EMAIL: 0,
      CALL: 0,
      REFERRAL: 0,
      OTHER: 0,
    };

    leads.forEach((lead) => {
      byStatus[lead.status]++;
      bySource[lead.source]++;
    });

    return {
      total,
      byStatus,
      bySource,
      totalValue,
    };
  }
}

