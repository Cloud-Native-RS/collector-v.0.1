import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { SupplierService } from '../supplier.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  supplier: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  purchaseOrder: {
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('SupplierService', () => {
  let service: SupplierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SupplierService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      name: 'Supplier Inc',
      email: 'supplier@example.com',
      phone: '+1234567890',
      address: '123 Supplier St',
      city: 'New York',
      country: 'USA',
      taxId: 'TAX123',
      status: 'ACTIVE',
      tenantId: 'test-tenant',
    };

    it('should create a supplier with valid data', async () => {
      const mockSupplier = {
        id: 'supplier-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.supplier.create as any).mockResolvedValue(mockSupplier);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('supplier-1');
      expect(result.name).toBe('Supplier Inc');
      expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
        data: validData,
      });
    });

    it('should create supplier with minimal required data', async () => {
      const minimalData = {
        name: 'Supplier Inc',
        status: 'ACTIVE',
        tenantId: 'test-tenant',
      };

      const mockSupplier = {
        id: 'supplier-1',
        ...minimalData,
        email: null,
        phone: null,
        address: null,
        city: null,
        country: null,
        taxId: null,
      };

      (mockPrisma.supplier.create as any).mockResolvedValue(mockSupplier);

      const result = await service.create(minimalData as any);

      expect(result).toBeDefined();
      expect(mockPrisma.supplier.create).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return supplier by id and tenant', async () => {
      const mockSupplier = {
        id: 'supplier-1',
        name: 'Supplier Inc',
        tenantId: 'test-tenant',
        purchaseOrders: [],
      };

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(mockSupplier);

      const result = await service.getById('supplier-1', 'test-tenant');

      expect(result).toEqual(mockSupplier);
      expect(mockPrisma.supplier.findFirst).toHaveBeenCalledWith({
        where: { id: 'supplier-1', tenantId: 'test-tenant' },
        include: {
          purchaseOrders: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });
    });

    it('should return null for non-existent supplier', async () => {
      (mockPrisma.supplier.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all suppliers for tenant', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-1',
          name: 'Supplier Inc',
          tenantId: 'test-tenant',
        },
        {
          id: 'supplier-2',
          name: 'Another Supplier',
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.supplier.findMany as any).mockResolvedValue(mockSuppliers);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockSuppliers);
      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        skip: 0,
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should support pagination', async () => {
      (mockPrisma.supplier.findMany as any).mockResolvedValue([]);

      await service.getAll('test-tenant', 10, 20);

      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 20,
        })
      );
    });
  });

  describe('update', () => {
    it('should update supplier successfully', async () => {
      const existingSupplier = {
        id: 'supplier-1',
        name: 'Supplier Inc',
        tenantId: 'test-tenant',
      };

      const updatedSupplier = {
        ...existingSupplier,
        name: 'Updated Supplier',
        email: 'newemail@example.com',
      };

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(existingSupplier);
      (mockPrisma.supplier.update as any).mockResolvedValue(updatedSupplier);

      const result = await service.update('supplier-1', 'test-tenant', {
        name: 'Updated Supplier',
        email: 'newemail@example.com',
      });

      expect(result.name).toBe('Updated Supplier');
      expect(mockPrisma.supplier.update).toHaveBeenCalled();
    });

    it('should throw error if supplier not found', async () => {
      (mockPrisma.supplier.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('delete', () => {
    it('should delete supplier successfully', async () => {
      const existingSupplier = {
        id: 'supplier-1',
        name: 'Supplier Inc',
        tenantId: 'test-tenant',
      };

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(existingSupplier);
      (mockPrisma.purchaseOrder.count as any).mockResolvedValue(0);
      (mockPrisma.supplier.delete as any).mockResolvedValue(existingSupplier);

      await service.delete('supplier-1', 'test-tenant');

      expect(mockPrisma.supplier.delete).toHaveBeenCalledWith({ where: { id: 'supplier-1' } });
    });

    it('should throw error if supplier not found', async () => {
      (mockPrisma.supplier.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Supplier not found');
    });

    it('should throw error if supplier has purchase orders', async () => {
      const existingSupplier = {
        id: 'supplier-1',
        name: 'Supplier Inc',
        tenantId: 'test-tenant',
      };

      (mockPrisma.supplier.findFirst as any).mockResolvedValue(existingSupplier);
      (mockPrisma.purchaseOrder.count as any).mockResolvedValue(5);

      await expect(service.delete('supplier-1', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('supplier-1', 'test-tenant')).rejects.toThrow('Cannot delete supplier with existing purchase orders');
    });
  });
});

