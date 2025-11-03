import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { StockService } from '../stock.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  stock: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  stockTransaction: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

describe('StockService', () => {
  let service: StockService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StockService(mockPrisma);
  });

  describe('adjust', () => {
    const validData = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 100,
      transactionType: 'IN' as const,
      tenantId: 'test-tenant',
    };

    it('should create stock record if it does not exist', async () => {
      const newStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 0,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(null);
      (mockPrisma.stock.create as any).mockResolvedValue(newStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...newStock,
        product: {},
        warehouse: {},
      });
      (mockPrisma.stockTransaction.create as any).mockResolvedValue({});

      await service.adjust(validData);

      expect(mockPrisma.stock.create).toHaveBeenCalled();
      expect(mockPrisma.stock.update).toHaveBeenCalled();
      expect(mockPrisma.stockTransaction.create).toHaveBeenCalled();
    });

    it('should increase stock for IN transaction', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 50,
        reservedQuantity: 0,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...existingStock,
        quantityAvailable: 150,
        product: {},
        warehouse: {},
      });
      (mockPrisma.stockTransaction.create as any).mockResolvedValue({});

      const result = await service.adjust({
        ...validData,
        quantity: 100,
        transactionType: 'IN',
      });

      expect(mockPrisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantityAvailable: 150,
          }),
        })
      );
    });

    it('should decrease stock for OUT transaction', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 0,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...existingStock,
        quantityAvailable: 50,
        product: {},
        warehouse: {},
      });
      (mockPrisma.stockTransaction.create as any).mockResolvedValue({});

      await service.adjust({
        ...validData,
        quantity: 50,
        transactionType: 'OUT',
      });

      expect(mockPrisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantityAvailable: 50,
          }),
        })
      );
    });

    it('should throw error for insufficient stock on OUT transaction', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 50,
        reservedQuantity: 0,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);

      await expect(
        service.adjust({
          ...validData,
          quantity: 100,
          transactionType: 'OUT',
        })
      ).rejects.toThrow(AppError);
      await expect(
        service.adjust({
          ...validData,
          quantity: 100,
          transactionType: 'OUT',
        })
      ).rejects.toThrow('Insufficient stock');
    });

    it('should set stock to specific quantity for ADJUSTMENT transaction', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 50,
        reservedQuantity: 0,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...existingStock,
        quantityAvailable: 200,
        product: {},
        warehouse: {},
      });
      (mockPrisma.stockTransaction.create as any).mockResolvedValue({});

      await service.adjust({
        ...validData,
        quantity: 200,
        transactionType: 'ADJUSTMENT',
      });

      expect(mockPrisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantityAvailable: 200,
          }),
        })
      );
    });

    it('should throw error if tenant does not match', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 50,
        reservedQuantity: 0,
        tenantId: 'other-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);

      await expect(service.adjust(validData)).rejects.toThrow(AppError);
      await expect(service.adjust(validData)).rejects.toThrow('does not belong to this tenant');
    });
  });

  describe('reserve', () => {
    it('should reserve stock successfully', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 10,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...existingStock,
        reservedQuantity: 30,
        product: {},
        warehouse: {},
      });

      const result = await service.reserve({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 20,
        tenantId: 'test-tenant',
      });

      expect(mockPrisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservedQuantity: 30,
          }),
        })
      );
    });

    it('should throw error if insufficient stock for reservation', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 50,
        reservedQuantity: 40,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);

      await expect(
        service.reserve({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 20,
          tenantId: 'test-tenant',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('unreserve', () => {
    it('should unreserve stock successfully', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 50,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);
      (mockPrisma.stock.update as any).mockResolvedValue({
        ...existingStock,
        reservedQuantity: 30,
        product: {},
        warehouse: {},
      });

      await service.unreserve({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 20,
        tenantId: 'test-tenant',
      });

      expect(mockPrisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservedQuantity: 30,
          }),
        })
      );
    });

    it('should throw error if trying to unreserve more than reserved', async () => {
      const existingStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 10,
        tenantId: 'test-tenant',
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(existingStock);

      await expect(
        service.unreserve({
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 20,
          tenantId: 'test-tenant',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('checkAvailability', () => {
    it('should return stock availability', async () => {
      const mockStock = {
        id: 'stock-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantityAvailable: 100,
        reservedQuantity: 20,
        minimumThreshold: 10,
        reorderLevel: 15,
        product: { id: 'product-1', name: 'Product 1' },
        warehouse: { id: 'warehouse-1', name: 'Warehouse 1' },
      };

      (mockPrisma.stock.findUnique as any).mockResolvedValue(mockStock);

      const result = await service.checkAvailability('product-1', 'warehouse-1', 'test-tenant');

      expect(result).toBeDefined();
      expect(result.quantityAvailable).toBe(100);
      expect(result.availableForOrder).toBe(80);
    });

    it('should return null if stock does not exist', async () => {
      (mockPrisma.stock.findUnique as any).mockResolvedValue(null);

      const result = await service.checkAvailability('product-1', 'warehouse-1', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getLowStockItems', () => {
    it('should return items below threshold', async () => {
      const mockLowStock = [
        {
          id: 'stock-1',
          quantityAvailable: 5,
          minimumThreshold: 10,
          product: { name: 'Product 1' },
          warehouse: { name: 'Warehouse 1' },
        },
      ];

      (mockPrisma.stock.findMany as any).mockResolvedValue(mockLowStock);

      const result = await service.getLowStockItems('test-tenant');

      expect(result).toEqual(mockLowStock);
      expect(mockPrisma.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'test-tenant',
          }),
        })
      );
    });
  });
});

