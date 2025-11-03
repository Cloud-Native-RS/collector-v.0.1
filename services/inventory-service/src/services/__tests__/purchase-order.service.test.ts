import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, PurchaseOrderStatus } from '@prisma/client';
import { PurchaseOrderService } from '../purchase-order.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  purchaseOrder: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  purchaseOrderLineItem: {
    update: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

const mockStockService = {
  adjust: vi.fn(),
};

vi.mock('../stock.service', () => ({
  StockService: vi.fn().mockImplementation(() => mockStockService),
}));

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PurchaseOrderService(mockPrisma);
    (service as any).stockService = mockStockService;
  });

  describe('create', () => {
    const validData = {
      supplierId: 'supplier-1',
      status: PurchaseOrderStatus.PENDING,
      expectedDate: new Date('2024-12-31'),
      notes: 'Initial order',
      lineItems: [
        {
          productId: 'product-1',
          quantity: 100,
          unitPrice: 10.50,
        },
        {
          productId: 'product-2',
          quantity: 50,
          unitPrice: 25.00,
        },
      ],
      tenantId: 'test-tenant',
    };

    it('should create a purchase order with valid data', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-ABC123',
        ...validData,
        supplier: { id: 'supplier-1', name: 'Supplier Inc' },
        lineItems: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 100,
            receivedQuantity: 0,
            unitPrice: { toNumber: () => 10.50 },
            product: { id: 'product-1', name: 'Product 1' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.purchaseOrder.findUnique as any).mockResolvedValue(null);
      (mockPrisma.purchaseOrder.create as any).mockResolvedValue(mockPO);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('po-1');
      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalled();
    });

    it('should generate unique PO number', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-ABC123',
        ...validData,
        supplier: {},
        lineItems: [],
      };

      (mockPrisma.purchaseOrder.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (mockPrisma.purchaseOrder.create as any).mockResolvedValue(mockPO);

      await service.create(validData);

      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            poNumber: expect.stringMatching(/^PO-/),
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return purchase order by id and tenant', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-ABC123',
        supplierId: 'supplier-1',
        tenantId: 'test-tenant',
        supplier: { id: 'supplier-1', name: 'Supplier Inc' },
        lineItems: [],
      };

      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(mockPO);

      const result = await service.getById('po-1', 'test-tenant');

      expect(result).toEqual(mockPO);
      expect(mockPrisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: { id: 'po-1', tenantId: 'test-tenant' },
        include: {
          supplier: true,
          lineItems: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('should return null for non-existent purchase order', async () => {
      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all purchase orders for tenant', async () => {
      const mockPOs = [
        {
          id: 'po-1',
          poNumber: 'PO-001',
          tenantId: 'test-tenant',
          supplier: {},
          lineItems: [],
        },
        {
          id: 'po-2',
          poNumber: 'PO-002',
          tenantId: 'test-tenant',
          supplier: {},
          lineItems: [],
        },
      ];

      (mockPrisma.purchaseOrder.findMany as any).mockResolvedValue(mockPOs);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockPOs);
      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'test-tenant' },
        })
      );
    });

    it('should filter by supplier', async () => {
      (mockPrisma.purchaseOrder.findMany as any).mockResolvedValue([]);

      await service.getAll('test-tenant', 0, 50, { supplierId: 'supplier-1' });

      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supplierId: 'supplier-1',
          }),
        })
      );
    });

    it('should filter by status', async () => {
      (mockPrisma.purchaseOrder.findMany as any).mockResolvedValue([]);

      await service.getAll('test-tenant', 0, 50, { status: PurchaseOrderStatus.RECEIVED });

      expect(mockPrisma.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PurchaseOrderStatus.RECEIVED,
          }),
        })
      );
    });
  });

  describe('receive', () => {
    it('should receive partial quantity', async () => {
      const mockPO = {
        id: 'po-1',
        poNumber: 'PO-ABC123',
        status: PurchaseOrderStatus.PENDING,
        tenantId: 'test-tenant',
        supplier: {},
        lineItems: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 100,
            receivedQuantity: 0,
            unitPrice: { toNumber: () => 10.50 },
            product: { id: 'product-1', name: 'Product 1' },
          },
        ],
      };

      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(mockPO);
      (mockPrisma.purchaseOrderLineItem.findMany as any).mockResolvedValue(mockPO.lineItems);
      (mockPrisma.purchaseOrderLineItem.update as any).mockResolvedValue({
        ...mockPO.lineItems[0],
        receivedQuantity: 50,
      });
      (mockPrisma.purchaseOrder.update as any).mockResolvedValue({
        ...mockPO,
        status: PurchaseOrderStatus.PARTIALLY_RECEIVED,
      });
      (mockStockService.adjust as any).mockResolvedValue({});

      await service.receive('po-1', 'test-tenant', [
        { lineItemId: 'line-1', quantity: 50, warehouseId: 'warehouse-1' },
      ]);

      expect(mockPrisma.purchaseOrderLineItem.update).toHaveBeenCalled();
      expect(mockStockService.adjust).toHaveBeenCalled();
    });

    it('should throw error if purchase order not found', async () => {
      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

      await expect(
        service.receive('non-existent', 'test-tenant', [])
      ).rejects.toThrow(AppError);
    });

    it('should throw error if receiving more than ordered', async () => {
      const mockPO = {
        id: 'po-1',
        status: PurchaseOrderStatus.PENDING,
        tenantId: 'test-tenant',
        supplier: {},
        lineItems: [
          {
            id: 'line-1',
            productId: 'product-1',
            quantity: 100,
            receivedQuantity: 0,
            unitPrice: { toNumber: () => 10.50 },
          },
        ],
      };

      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(mockPO);
      (mockPrisma.purchaseOrderLineItem.findMany as any).mockResolvedValue(mockPO.lineItems);

      await expect(
        service.receive('po-1', 'test-tenant', [
          { lineItemId: 'line-1', quantity: 150, warehouseId: 'warehouse-1' },
        ])
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancel', () => {
    it('should cancel purchase order', async () => {
      const mockPO = {
        id: 'po-1',
        status: PurchaseOrderStatus.PENDING,
        tenantId: 'test-tenant',
        supplier: {},
        lineItems: [],
      };

      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(mockPO);
      (mockPrisma.purchaseOrder.update as any).mockResolvedValue({
        ...mockPO,
        status: PurchaseOrderStatus.CANCELLED,
      });

      const result = await service.cancel('po-1', 'test-tenant');

      expect(result.status).toBe(PurchaseOrderStatus.CANCELLED);
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalled();
    });

    it('should throw error if purchase order not found', async () => {
      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(null);

      await expect(service.cancel('non-existent', 'test-tenant')).rejects.toThrow(AppError);
    });

    it('should throw error if purchase order already received', async () => {
      const mockPO = {
        id: 'po-1',
        status: PurchaseOrderStatus.RECEIVED,
        tenantId: 'test-tenant',
        supplier: {},
        lineItems: [],
      };

      (mockPrisma.purchaseOrder.findFirst as any).mockResolvedValue(mockPO);

      await expect(service.cancel('po-1', 'test-tenant')).rejects.toThrow(AppError);
    });
  });
});

