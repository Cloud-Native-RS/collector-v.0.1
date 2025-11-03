import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DeliverySyncService } from '../delivery-sync.service';

const mockPrisma = {
  deliveryNoteSync: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

const mockStockService = {
  adjust: vi.fn(),
};

vi.mock('../stock.service', () => ({
  StockService: vi.fn().mockImplementation(() => mockStockService),
}));

describe('DeliverySyncService', () => {
  let service: DeliverySyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeliverySyncService(mockPrisma);
    (service as any).stockService = mockStockService;
  });

  describe('syncDeliveryNote', () => {
    const validData = {
      deliveryNoteId: 'delivery-1',
      productId: 'product-1',
      quantity: 50,
      warehouseId: 'warehouse-1',
      transactionType: 'OUT' as const,
      tenantId: 'test-tenant',
    };

    it('should sync delivery note and adjust stock for OUT transaction', async () => {
      const mockSync = {
        id: 'sync-1',
        ...validData,
        syncedAt: new Date(),
      };

      (mockPrisma.deliveryNoteSync.create as any).mockResolvedValue(mockSync);
      (mockStockService.adjust as any).mockResolvedValue({});

      const result = await service.syncDeliveryNote(validData);

      expect(result).toEqual(mockSync);
      expect(mockPrisma.deliveryNoteSync.create).toHaveBeenCalledWith({
        data: validData,
      });
      expect(mockStockService.adjust).toHaveBeenCalledWith({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: -50,
        transactionType: 'OUT',
        referenceId: 'delivery-1',
        notes: 'Delivery OUT - DN: delivery-1',
        tenantId: 'test-tenant',
      });
    });

    it('should sync delivery note and adjust stock for IN transaction', async () => {
      const inData = {
        ...validData,
        transactionType: 'IN' as const,
      };

      const mockSync = {
        id: 'sync-1',
        ...inData,
        syncedAt: new Date(),
      };

      (mockPrisma.deliveryNoteSync.create as any).mockResolvedValue(mockSync);
      (mockStockService.adjust as any).mockResolvedValue({});

      await service.syncDeliveryNote(inData);

      expect(mockStockService.adjust).toHaveBeenCalledWith({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 50,
        transactionType: 'IN',
        referenceId: 'delivery-1',
        notes: 'Delivery IN - DN: delivery-1',
        tenantId: 'test-tenant',
      });
    });
  });

  describe('getDeliverySyncByNoteId', () => {
    it('should return syncs for a specific delivery note', async () => {
      const mockSyncs = [
        {
          id: 'sync-1',
          deliveryNoteId: 'delivery-1',
          product: { id: 'product-1', name: 'Product 1' },
          warehouse: { id: 'warehouse-1', name: 'Warehouse 1' },
        },
      ];

      (mockPrisma.deliveryNoteSync.findMany as any).mockResolvedValue(mockSyncs);

      const result = await service.getDeliverySyncByNoteId('delivery-1', 'test-tenant');

      expect(result).toEqual(mockSyncs);
      expect(mockPrisma.deliveryNoteSync.findMany).toHaveBeenCalledWith({
        where: {
          deliveryNoteId: 'delivery-1',
          tenantId: 'test-tenant',
        },
        include: {
          product: true,
          warehouse: true,
        },
        orderBy: {
          syncedAt: 'desc',
        },
      });
    });
  });

  describe('getDeliverySyncsByProduct', () => {
    it('should return syncs for a specific product', async () => {
      const mockSyncs = [
        {
          id: 'sync-1',
          productId: 'product-1',
          warehouse: { id: 'warehouse-1', name: 'Warehouse 1' },
        },
      ];

      (mockPrisma.deliveryNoteSync.findMany as any).mockResolvedValue(mockSyncs);

      const result = await service.getDeliverySyncsByProduct('product-1', 'test-tenant');

      expect(result).toEqual(mockSyncs);
      expect(mockPrisma.deliveryNoteSync.findMany).toHaveBeenCalledWith({
        where: {
          productId: 'product-1',
          tenantId: 'test-tenant',
        },
        include: {
          warehouse: true,
        },
        orderBy: {
          syncedAt: 'desc',
        },
      });
    });
  });

  describe('getDeliverySyncsByWarehouse', () => {
    it('should return syncs for a specific warehouse', async () => {
      const mockSyncs = [
        {
          id: 'sync-1',
          warehouseId: 'warehouse-1',
          product: { id: 'product-1', name: 'Product 1' },
        },
      ];

      (mockPrisma.deliveryNoteSync.findMany as any).mockResolvedValue(mockSyncs);

      const result = await service.getDeliverySyncsByWarehouse('warehouse-1', 'test-tenant');

      expect(result).toEqual(mockSyncs);
      expect(mockPrisma.deliveryNoteSync.findMany).toHaveBeenCalledWith({
        where: {
          warehouseId: 'warehouse-1',
          tenantId: 'test-tenant',
        },
        include: {
          product: true,
        },
        orderBy: {
          syncedAt: 'desc',
        },
      });
    });
  });
});

