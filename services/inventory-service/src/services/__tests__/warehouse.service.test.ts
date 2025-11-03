import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, WarehouseStatus } from '@prisma/client';
import { WarehouseService } from '../warehouse.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  warehouse: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  stock: {
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('WarehouseService', () => {
  let service: WarehouseService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WarehouseService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      name: 'Main Warehouse',
      location: '123 Industrial Blvd, New York, NY',
      capacity: 10000,
      status: WarehouseStatus.ACTIVE,
      tenantId: 'test-tenant',
    };

    it('should create a warehouse with valid data', async () => {
      const mockWarehouse = {
        id: 'warehouse-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.warehouse.create as any).mockResolvedValue(mockWarehouse);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('warehouse-1');
      expect(result.name).toBe('Main Warehouse');
      expect(mockPrisma.warehouse.create).toHaveBeenCalledWith({
        data: validData,
      });
    });

    it('should create warehouse without capacity', async () => {
      const dataWithoutCapacity = { ...validData };
      delete (dataWithoutCapacity as any).capacity;

      const mockWarehouse = {
        id: 'warehouse-1',
        ...dataWithoutCapacity,
        capacity: null,
      };

      (mockPrisma.warehouse.create as any).mockResolvedValue(mockWarehouse);

      const result = await service.create(dataWithoutCapacity);

      expect(result).toBeDefined();
      expect(mockPrisma.warehouse.create).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return warehouse by id and tenant', async () => {
      const mockWarehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        tenantId: 'test-tenant',
        stock: [],
      };

      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(mockWarehouse);

      const result = await service.getById('warehouse-1', 'test-tenant');

      expect(result).toEqual(mockWarehouse);
      expect(mockPrisma.warehouse.findFirst).toHaveBeenCalledWith({
        where: { id: 'warehouse-1', tenantId: 'test-tenant' },
        include: {
          stock: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent warehouse', async () => {
      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all warehouses for tenant', async () => {
      const mockWarehouses = [
        {
          id: 'warehouse-1',
          name: 'Main Warehouse',
          tenantId: 'test-tenant',
        },
        {
          id: 'warehouse-2',
          name: 'Secondary Warehouse',
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.warehouse.findMany as any).mockResolvedValue(mockWarehouses);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockWarehouses);
      expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        skip: 0,
        take: 50,
        include: {},
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should include stock when requested', async () => {
      const mockWarehouses = [
        {
          id: 'warehouse-1',
          name: 'Main Warehouse',
          stock: [],
        },
      ];

      (mockPrisma.warehouse.findMany as any).mockResolvedValue(mockWarehouses);

      const result = await service.getAll('test-tenant', 0, 50, true);

      expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            stock: {
              include: {
                product: true,
              },
            },
          },
        })
      );
    });

    it('should support pagination', async () => {
      (mockPrisma.warehouse.findMany as any).mockResolvedValue([]);

      await service.getAll('test-tenant', 10, 20);

      expect(mockPrisma.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('update', () => {
    it('should update warehouse successfully', async () => {
      const existingWarehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        tenantId: 'test-tenant',
      };

      const updatedWarehouse = {
        ...existingWarehouse,
        name: 'Updated Warehouse',
        location: 'New Location',
      };

      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(existingWarehouse);
      (mockPrisma.warehouse.update as any).mockResolvedValue(updatedWarehouse);

      const result = await service.update('warehouse-1', 'test-tenant', {
        name: 'Updated Warehouse',
        location: 'New Location',
      });

      expect(result.name).toBe('Updated Warehouse');
      expect(mockPrisma.warehouse.update).toHaveBeenCalled();
    });

    it('should throw error if warehouse not found', async () => {
      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow('Warehouse not found');
    });
  });

  describe('delete', () => {
    it('should delete warehouse successfully', async () => {
      const existingWarehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        tenantId: 'test-tenant',
      };

      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(existingWarehouse);
      (mockPrisma.stock.count as any).mockResolvedValue(0);
      (mockPrisma.warehouse.delete as any).mockResolvedValue(existingWarehouse);

      await service.delete('warehouse-1', 'test-tenant');

      expect(mockPrisma.warehouse.delete).toHaveBeenCalledWith({ where: { id: 'warehouse-1' } });
    });

    it('should throw error if warehouse not found', async () => {
      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Warehouse not found');
    });

    it('should throw error if warehouse has stock', async () => {
      const existingWarehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        tenantId: 'test-tenant',
      };

      (mockPrisma.warehouse.findFirst as any).mockResolvedValue(existingWarehouse);
      (mockPrisma.stock.count as any).mockResolvedValue(5);

      await expect(service.delete('warehouse-1', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('warehouse-1', 'test-tenant')).rejects.toThrow('Cannot delete warehouse with existing stock');
    });
  });
});

