import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ProductCategory, UnitOfMeasure } from '@prisma/client';
import { ProductService } from '../product.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  product: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProductService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      sku: 'SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      unitOfMeasure: UnitOfMeasure.PIECE,
      price: 99.99,
      taxPercent: 20,
      category: ProductCategory.ELECTRONICS,
      tenantId: 'test-tenant',
    };

    it('should create a product with valid data', async () => {
      const mockProduct = {
        id: 'prod-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.product.findUnique as any).mockResolvedValue(null);
      (mockPrisma.product.create as any).mockResolvedValue(mockProduct);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('prod-1');
      expect(mockPrisma.product.create).toHaveBeenCalled();
    });

    it('should reject duplicate SKU', async () => {
      const existingProduct = {
        id: 'prod-existing',
        sku: validData.sku,
      };

      (mockPrisma.product.findUnique as any).mockResolvedValue(existingProduct);

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('SKU already exists');
    });
  });

  describe('getById', () => {
    it('should return product by id and tenant', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        tenantId: 'test-tenant',
        stock: [],
      };

      (mockPrisma.product.findFirst as any).mockResolvedValue(mockProduct);

      const result = await service.getById('prod-1', 'test-tenant');

      expect(result).toEqual(mockProduct);
    });
  });

  describe('getBySku', () => {
    it('should return product by SKU and tenant', async () => {
      const mockProduct = {
        id: 'prod-1',
        sku: 'SKU-001',
        tenantId: 'test-tenant',
        stock: [],
      };

      (mockPrisma.product.findFirst as any).mockResolvedValue(mockProduct);

      const result = await service.getBySku('SKU-001', 'test-tenant');

      expect(result).toEqual(mockProduct);
    });
  });
});

