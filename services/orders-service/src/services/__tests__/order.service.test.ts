import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { OrderService } from '../order.service';
import { AppError } from '../../middleware/error-handler';
import { OffersService } from '../../integrations/offers.service';
import { InventoryService } from '../../integrations/inventory.service';
import { ShippingService } from '../../integrations/shipping.service';

const mockPrisma = {
  order: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  orderLineItem: {
    createMany: vi.fn(),
  },
  shippingAddress: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

const mockOffersService = {
  getApprovedOffer: vi.fn(),
} as unknown as OffersService;

const mockInventoryService = {
  validateInventory: vi.fn(),
} as unknown as InventoryService;

const mockShippingService = {
  calculateShipping: vi.fn(),
} as unknown as ShippingService;

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrderService(mockPrisma, mockOffersService, mockInventoryService, mockShippingService);
  });

  describe('createFromOffer', () => {
    const mockOffer = {
      id: 'offer-1',
      customerId: 'customer-1',
      lineItems: [
        {
          productId: 'prod-1',
          sku: 'SKU-001',
          quantity: 2,
          unitPrice: 100,
          discountPercent: 0,
          taxPercent: 20,
        },
      ],
    };

    const shippingAddress = {
      fullName: 'John Doe',
      street: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      country: 'US',
    };

    it('should create order from approved offer', async () => {
      (mockOffersService.getApprovedOffer as any).mockResolvedValue(mockOffer);
      (mockInventoryService.validateInventory as any).mockResolvedValue({ valid: true });
      (mockShippingService.calculateShipping as any).mockResolvedValue({ cost: 10 });

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.PENDING,
        customerId: 'customer-1',
        lineItems: [],
        shippingAddress: {},
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        return callback(mockPrisma);
      });

      (mockPrisma.order.findUnique as any).mockResolvedValue(null);
      (mockPrisma.shippingAddress.create as any).mockResolvedValue({ id: 'addr-1', ...shippingAddress });
      (mockPrisma.order.create as any).mockResolvedValue(mockOrder);
      (mockPrisma.orderLineItem.createMany as any).mockResolvedValue({ count: 1 });

      const result = await service.createFromOffer('offer-1', shippingAddress, 'test-tenant');

      expect(result).toBeDefined();
      expect(mockOffersService.getApprovedOffer).toHaveBeenCalledWith('offer-1', 'test-tenant');
      expect(mockInventoryService.validateInventory).toHaveBeenCalled();
    });

    it('should reject order with insufficient inventory', async () => {
      (mockOffersService.getApprovedOffer as any).mockResolvedValue(mockOffer);
      (mockInventoryService.validateInventory as any).mockResolvedValue({
        valid: false,
        unavailableItems: ['SKU-001'],
      });

      await expect(
        service.createFromOffer('offer-1', shippingAddress, 'test-tenant')
      ).rejects.toThrow(AppError);
      await expect(
        service.createFromOffer('offer-1', shippingAddress, 'test-tenant')
      ).rejects.toThrow('Insufficient inventory');
    });
  });
});

