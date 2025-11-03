import { PrismaClient, Supplier } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class SupplierService {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    status: string;
    tenantId: string;
  }): Promise<Supplier> {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        taxId: data.taxId,
        status: data.status,
        tenantId: data.tenantId,
      },
    });

    return supplier;
  }

  async getById(id: string, tenantId: string): Promise<Supplier | null> {
    return this.prisma.supplier.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        purchaseOrders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async getAll(tenantId: string, skip = 0, take = 50): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, tenantId: string, data: Partial<any>): Promise<Supplier> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        taxId: data.taxId,
        status: data.status,
      },
    });

    return supplier;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Supplier not found', 404);
    }

    // Check if supplier has purchase orders
    const poCount = await this.prisma.purchaseOrder.count({
      where: {
        supplierId: id,
        tenantId,
      },
    });

    if (poCount > 0) {
      throw new AppError('Cannot delete supplier with existing purchase orders', 400);
    }

    await this.prisma.supplier.delete({
      where: { id },
    });
  }
}

