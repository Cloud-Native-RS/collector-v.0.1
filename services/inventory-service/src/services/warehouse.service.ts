import { PrismaClient, Warehouse, WarehouseStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class WarehouseService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    location: string;
    capacity?: number;
    status: WarehouseStatus;
    tenantId: string;
  }): Promise<Warehouse> {
    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location,
        capacity: data.capacity,
        status: data.status,
        tenantId: data.tenantId,
      },
    });

    return warehouse;
  }

  async getById(id: string, tenantId: string): Promise<Warehouse | null> {
    return this.prisma.warehouse.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        stock: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async getAll(tenantId: string, skip = 0, take = 50, includeStock = false): Promise<Warehouse[]> {
    const include: any = {};
    if (includeStock) {
      include.stock = {
        include: {
          product: true,
        },
      };
    }

    return this.prisma.warehouse.findMany({
      where: { tenantId },
      skip,
      take,
      include,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, tenantId: string, data: Partial<any>): Promise<Warehouse> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Warehouse not found', 404);
    }

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        location: data.location,
        capacity: data.capacity,
        status: data.status,
      },
    });

    return warehouse;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Warehouse not found', 404);
    }

    // Check if warehouse has stock
    const stockCount = await this.prisma.stock.count({
      where: {
        warehouseId: id,
        tenantId,
        quantityAvailable: { gt: 0 },
      },
    });

    if (stockCount > 0) {
      throw new AppError('Cannot delete warehouse with existing stock', 400);
    }

    await this.prisma.warehouse.delete({
      where: { id },
    });
  }
}

