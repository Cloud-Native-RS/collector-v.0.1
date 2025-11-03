import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DeliveryService } from '../delivery.service';
import { EventPublisher } from '../../utils/event-publisher';

// Mock Prisma
const mockPrisma = {
  deliveryNote: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  deliveryEvent: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock EventPublisher
const mockEventPublisher = {
  publish: vi.fn(),
} as unknown as EventPublisher;

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;

  beforeEach(() => {
    vi.clearAllMocks();
    deliveryService = new DeliveryService(mockPrisma, mockEventPublisher);
  });

  describe('create', () => {
    it('should create a delivery note with unique delivery number', async () => {
      const mockData = {
        orderId: 'order-123',
        customerId: 'customer-123',
        deliveryAddressId: 'address-123',
        items: [
          {
            productId: 'product-123',
            description: 'Test Product',
            quantity: 2,
            unit: 'pcs',
          },
        ],
        tenantId: 'tenant-123',
      };

      (mockPrisma.deliveryNote.findUnique as any).mockResolvedValue(null);
      (mockPrisma.deliveryNote.create as any).mockResolvedValue({
        id: 'delivery-123',
        deliveryNumber: 'DN-20240101-000001',
        ...mockData,
        status: 'PENDING',
        items: [],
        events: [],
      });

      const result = await deliveryService.create(mockData);

      expect(result).toBeDefined();
      expect(mockPrisma.deliveryNote.create).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith('delivery.created', expect.any(Object));
    });
  });

  describe('getById', () => {
    it('should return delivery note by id and tenant', async () => {
      const mockDeliveryNote = {
        id: 'delivery-123',
        deliveryNumber: 'DN-20240101-000001',
        tenantId: 'tenant-123',
        items: [],
        events: [],
      };

      (mockPrisma.deliveryNote.findFirst as any).mockResolvedValue(mockDeliveryNote);

      const result = await deliveryService.getById('delivery-123', 'tenant-123');

      expect(result).toEqual(mockDeliveryNote);
      expect(mockPrisma.deliveryNote.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'delivery-123',
          tenantId: 'tenant-123',
        },
        include: {
          items: true,
          events: {
            orderBy: {
              timestamp: 'desc',
            },
          },
          carrier: true,
        },
      });
    });
  });
});

