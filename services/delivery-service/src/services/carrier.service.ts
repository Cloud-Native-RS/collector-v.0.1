import { PrismaClient, Carrier } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class CarrierService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    apiEndpoint: string;
    trackingUrlTemplate: string;
    apiKey?: string;
    apiSecret?: string;
    tenantId: string;
  }): Promise<Carrier> {
    return this.prisma.carrier.create({
      data: {
        name: data.name,
        apiEndpoint: data.apiEndpoint,
        trackingUrlTemplate: data.trackingUrlTemplate,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        active: true,
        tenantId: data.tenantId,
      },
    });
  }

  async getById(id: string, tenantId: string): Promise<Carrier | null> {
    return this.prisma.carrier.findFirst({
      where: {
        id,
        tenantId,
      },
    });
  }

  async getAll(tenantId: string, activeOnly = false): Promise<Carrier[]> {
    const where: any = { tenantId };
    if (activeOnly) {
      where.active = true;
    }

    return this.prisma.carrier.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      apiEndpoint: string;
      trackingUrlTemplate: string;
      apiKey: string;
      apiSecret: string;
      active: boolean;
    }>
  ): Promise<Carrier> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Carrier not found', 404);
    }

    return this.prisma.carrier.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Carrier not found', 404);
    }

    await this.prisma.carrier.delete({
      where: { id },
    });
  }

  getTrackingUrl(carrier: Carrier, trackingNumber: string): string {
    return carrier.trackingUrlTemplate.replace('{trackingNumber}', trackingNumber);
  }
}

