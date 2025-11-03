import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';

export class StockService {
  constructor(private prisma: PrismaClient) {}

  async adjust(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    transactionType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
    referenceId?: string;
    notes?: string;
    tenantId: string;
  }) {
    const { productId, warehouseId, quantity, transactionType, referenceId, notes, tenantId } = data;

    // Get or create stock record
    let stock = await this.prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!stock) {
      stock = await this.prisma.stock.create({
        data: {
          productId,
          warehouseId,
          quantityAvailable: 0,
          reservedQuantity: 0,
          tenantId,
        },
      });
    }

    if (stock.tenantId !== tenantId) {
      throw new AppError('Stock does not belong to this tenant', 403);
    }

    let newQuantity = stock.quantityAvailable;

    // Calculate new quantity based on transaction type
    switch (transactionType) {
      case 'IN':
        newQuantity += quantity;
        break;
      case 'OUT':
        newQuantity -= quantity;
        if (newQuantity < 0) {
          throw new AppError('Insufficient stock', 400);
        }
        break;
      case 'ADJUSTMENT':
        newQuantity = quantity;
        break;
      case 'TRANSFER':
        newQuantity -= quantity;
        if (newQuantity < 0) {
          throw new AppError('Insufficient stock for transfer', 400);
        }
        break;
    }

    // Update stock
    const updatedStock = await this.prisma.stock.update({
      where: { id: stock.id },
      data: {
        quantityAvailable: newQuantity,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Create transaction record
    await this.prisma.stockTransaction.create({
      data: {
        productId,
        warehouseId,
        transactionType,
        quantity,
        referenceId,
        notes,
        tenantId,
      },
    });

    return updatedStock;
  }

  async reserve(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    tenantId: string;
  }) {
    const { productId, warehouseId, quantity, tenantId } = data;

    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!stock) {
      throw new AppError('Stock record not found', 404);
    }

    if (stock.tenantId !== tenantId) {
      throw new AppError('Stock does not belong to this tenant', 403);
    }

    if (stock.quantityAvailable - stock.reservedQuantity < quantity) {
      throw new AppError('Insufficient available stock', 400);
    }

    const updatedStock = await this.prisma.stock.update({
      where: { id: stock.id },
      data: {
        reservedQuantity: {
          increment: quantity,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Create transaction record
    await this.prisma.stockTransaction.create({
      data: {
        productId,
        warehouseId,
        transactionType: 'RESERVED',
        quantity,
        notes: 'Stock reserved for order',
        tenantId,
      },
    });

    return updatedStock;
  }

  async unreserve(data: {
    productId: string;
    warehouseId: string;
    quantity: number;
    tenantId: string;
  }) {
    const { productId, warehouseId, quantity, tenantId } = data;

    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!stock) {
      throw new AppError('Stock record not found', 404);
    }

    if (stock.tenantId !== tenantId) {
      throw new AppError('Stock does not belong to this tenant', 403);
    }

    if (stock.reservedQuantity < quantity) {
      throw new AppError('Cannot unreserve more than reserved quantity', 400);
    }

    const updatedStock = await this.prisma.stock.update({
      where: { id: stock.id },
      data: {
        reservedQuantity: {
          decrement: quantity,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Create transaction record
    await this.prisma.stockTransaction.create({
      data: {
        productId,
        warehouseId,
        transactionType: 'UNRESERVED',
        quantity,
        notes: 'Stock reservation released',
        tenantId,
      },
    });

    return updatedStock;
  }

  async checkAvailability(productId: string, warehouseId: string, tenantId: string) {
    const stock = await this.prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    if (!stock || stock.tenantId !== tenantId) {
      return null;
    }

    return {
      product: stock.product,
      warehouse: stock.warehouse,
      quantityAvailable: stock.quantityAvailable,
      reservedQuantity: stock.reservedQuantity,
      availableForOrder: stock.quantityAvailable - stock.reservedQuantity,
      minimumThreshold: stock.minimumThreshold,
      reorderLevel: stock.reorderLevel,
    };
  }

  async getStockByProduct(productId: string, tenantId: string) {
    return this.prisma.stock.findMany({
      where: {
        productId,
        tenantId,
      },
      include: {
        warehouse: true,
        product: true,
      },
    });
  }

  async getStockByWarehouse(warehouseId: string, tenantId: string) {
    return this.prisma.stock.findMany({
      where: {
        warehouseId,
        tenantId,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });
  }

  async getLowStockItems(tenantId: string) {
    // Get all stocks and filter in memory, or use raw query
    const stocks = await this.prisma.stock.findMany({
      where: {
        tenantId,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Filter stocks where quantityAvailable <= minimumThreshold
    return stocks.filter(
      (stock) => stock.quantityAvailable <= stock.minimumThreshold
    );
  }
}

