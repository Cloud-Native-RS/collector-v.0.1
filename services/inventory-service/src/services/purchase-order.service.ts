import {
  PrismaClient,
  PurchaseOrder,
  PurchaseOrderStatus,
  Supplier,
  Product,
  PurchaseOrderLineItem,
  Prisma
} from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { generatePONumber } from '../utils/number-generator';
import { StockService } from './stock.service';

type PurchaseOrderLineItemWithProduct = PurchaseOrderLineItem & {
  product?: Product;
};

type PurchaseOrderWithRelations = PurchaseOrder & {
  supplier: Supplier;
  lineItems: PurchaseOrderLineItemWithProduct[];
};

export class PurchaseOrderService {
  private stockService: StockService;

  constructor(private prisma: PrismaClient) {
    this.stockService = new StockService(prisma);
  }

  async create(data: {
    supplierId: string;
    status: PurchaseOrderStatus;
    expectedDate?: Date;
    notes?: string;
    lineItems: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
    }>;
    tenantId: string;
  }): Promise<PurchaseOrderWithRelations> {
    // Generate PO number
    let poNumber = generatePONumber();
    while (await this.prisma.purchaseOrder.findUnique({ where: { poNumber } })) {
      poNumber = generatePONumber();
    }

    // Create purchase order with line items
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        status: data.status,
        expectedDate: data.expectedDate,
        notes: data.notes,
        tenantId: data.tenantId,
        lineItems: {
          create: data.lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            receivedQuantity: 0,
            tenantId: data.tenantId,
          })),
        },
      },
      include: {
        supplier: true,
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    });

    return purchaseOrder;
  }

  async getById(id: string, tenantId: string): Promise<PurchaseOrderWithRelations | null> {
    return this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        supplier: true,
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    }) as Promise<PurchaseOrderWithRelations | null>;
  }

  async getAll(tenantId: string, skip = 0, take = 50, filters?: {
    supplierId?: string;
    status?: PurchaseOrderStatus;
  }): Promise<PurchaseOrderWithRelations[]> {
    const where: Prisma.PurchaseOrderWhereInput = { tenantId };

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      skip,
      take,
      include: {
        supplier: true,
        lineItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }) as Promise<PurchaseOrderWithRelations[]>;
  }

  async update(id: string, tenantId: string, data: Prisma.PurchaseOrderUpdateInput): Promise<PurchaseOrderWithRelations> {
    const existing = await this.getById(id, tenantId);
    if (!existing) {
      throw new AppError('Purchase order not found', 404);
    }

    if (existing.status !== 'DRAFT') {
      throw new AppError('Can only update draft purchase orders', 400);
    }

    const purchaseOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: data.status,
        expectedDate: data.expectedDate,
        notes: data.notes,
      },
      include: {
        supplier: true,
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    }) as unknown as PurchaseOrderWithRelations;

    return purchaseOrder;
  }

  async receive(id: string, tenantId: string, data: {
    lineItems: Array<{
      id: string;
      receivedQuantity: number;
    }>;
  }): Promise<PurchaseOrderWithRelations> {
    const po = await this.getById(id, tenantId);
    if (!po) {
      throw new AppError('Purchase order not found', 404);
    }

    if (po.status === 'RECEIVED' || po.status === 'CANCELED') {
      throw new AppError('Cannot receive a canceled or already received purchase order', 400);
    }

    // Update line items and adjust stock
    for (const item of data.lineItems) {
      const lineItem = po.lineItems.find((li: { id: string }) => li.id === item.id);
      if (!lineItem) {
        throw new AppError(`Line item ${item.id} not found`, 404);
      }

      // Update received quantity
      await this.prisma.purchaseOrderLineItem.update({
        where: { id: item.id },
        data: {
          receivedQuantity: item.receivedQuantity,
        },
      });

      // Adjust stock (assuming default warehouse, in production you'd specify warehouse)
      if (item.receivedQuantity > 0) {
        // Get product to find warehouse
        const product = await this.prisma.product.findUnique({
          where: { id: lineItem.productId },
        });

        if (!product) continue;

        // Find warehouse or use first one
        const warehouse = await this.prisma.warehouse.findFirst({
          where: { tenantId },
        });

        if (warehouse) {
          await this.stockService.adjust({
            productId: lineItem.productId,
            warehouseId: warehouse.id,
            quantity: item.receivedQuantity,
            transactionType: 'IN',
            referenceId: po.id,
            notes: `Received from PO ${po.poNumber}`,
            tenantId,
          });
        }
      }
    }

    // Check if all items are fully received
    const updatedPo = await this.getById(id, tenantId);
    if (!updatedPo) {
      throw new AppError('Failed to retrieve updated purchase order', 500);
    }

    const allReceived = updatedPo.lineItems.every(
      (item: { receivedQuantity: number; quantity: number }) => item.receivedQuantity >= item.quantity
    );

    const newStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: newStatus },
    });

    return (await this.getById(id, tenantId))!;
  }

  async cancel(id: string, tenantId: string): Promise<PurchaseOrderWithRelations> {
    const po = await this.getById(id, tenantId);
    if (!po) {
      throw new AppError('Purchase order not found', 404);
    }

    if (po.status === 'RECEIVED' || po.status === 'CANCELED') {
      throw new AppError('Cannot cancel an already received or canceled purchase order', 400);
    }

    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    return (await this.getById(id, tenantId))!;
  }
}

