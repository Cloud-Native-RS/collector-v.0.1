import { PrismaClient, DeliveryNoteSync } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { StockService } from './stock.service';

export class DeliverySyncService {
  private stockService: StockService;

  constructor(private prisma: PrismaClient) {
    this.stockService = new StockService(prisma);
  }

  async syncDeliveryNote(data: {
    deliveryNoteId: string;
    productId: string;
    quantity: number;
    warehouseId: string;
    transactionType: 'IN' | 'OUT';
    tenantId: string;
  }): Promise<DeliveryNoteSync> {
    const { deliveryNoteId, productId, quantity, warehouseId, transactionType, tenantId } = data;

    // Create delivery note sync record
    const sync = await this.prisma.deliveryNoteSync.create({
      data: {
        deliveryNoteId,
        productId,
        quantity,
        warehouseId,
        transactionType,
        tenantId,
      },
    });

    // Adjust stock based on transaction type
    await this.stockService.adjust({
      productId,
      warehouseId,
      quantity: transactionType === 'IN' ? quantity : -quantity,
      transactionType: transactionType === 'IN' ? 'IN' : 'OUT',
      referenceId: deliveryNoteId,
      notes: `Delivery ${transactionType} - DN: ${deliveryNoteId}`,
      tenantId,
    });

    return sync;
  }

  async getDeliverySyncByNoteId(deliveryNoteId: string, tenantId: string): Promise<DeliveryNoteSync[]> {
    return this.prisma.deliveryNoteSync.findMany({
      where: {
        deliveryNoteId,
        tenantId,
      },
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: {
        syncedAt: 'desc',
      },
    });
  }

  async getDeliverySyncsByProduct(productId: string, tenantId: string): Promise<DeliveryNoteSync[]> {
    return this.prisma.deliveryNoteSync.findMany({
      where: {
        productId,
        tenantId,
      },
      include: {
        warehouse: true,
      },
      orderBy: {
        syncedAt: 'desc',
      },
    });
  }

  async getDeliverySyncsByWarehouse(warehouseId: string, tenantId: string): Promise<DeliveryNoteSync[]> {
    return this.prisma.deliveryNoteSync.findMany({
      where: {
        warehouseId,
        tenantId,
      },
      include: {
        product: true,
      },
      orderBy: {
        syncedAt: 'desc',
      },
    });
  }
}

