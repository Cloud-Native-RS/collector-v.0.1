import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CarrierService } from '../carrier.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  carrier: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

describe('CarrierService', () => {
  let service: CarrierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CarrierService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      name: 'DHL Express',
      apiEndpoint: 'https://api.dhl.com',
      trackingUrlTemplate: 'https://dhl.com/track/{trackingNumber}',
      apiKey: 'api-key-123',
      apiSecret: 'api-secret-456',
      tenantId: 'test-tenant',
    };

    it('should create a carrier with valid data', async () => {
      const mockCarrier = {
        id: 'carrier-1',
        ...validData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.carrier.create as any).mockResolvedValue(mockCarrier);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('carrier-1');
      expect(result.name).toBe('DHL Express');
      expect(mockPrisma.carrier.create).toHaveBeenCalledWith({
        data: {
          ...validData,
          active: true,
        },
      });
    });

    it('should create carrier without API credentials', async () => {
      const dataWithoutCredentials = {
        name: 'USPS',
        apiEndpoint: 'https://api.usps.com',
        trackingUrlTemplate: 'https://usps.com/track/{trackingNumber}',
        tenantId: 'test-tenant',
      };

      const mockCarrier = {
        id: 'carrier-1',
        ...dataWithoutCredentials,
        apiKey: null,
        apiSecret: null,
        active: true,
      };

      (mockPrisma.carrier.create as any).mockResolvedValue(mockCarrier);

      const result = await service.create(dataWithoutCredentials);

      expect(result).toBeDefined();
      expect(mockPrisma.carrier.create).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return carrier by id and tenant', async () => {
      const mockCarrier = {
        id: 'carrier-1',
        name: 'DHL Express',
        tenantId: 'test-tenant',
      };

      (mockPrisma.carrier.findFirst as any).mockResolvedValue(mockCarrier);

      const result = await service.getById('carrier-1', 'test-tenant');

      expect(result).toEqual(mockCarrier);
      expect(mockPrisma.carrier.findFirst).toHaveBeenCalledWith({
        where: { id: 'carrier-1', tenantId: 'test-tenant' },
      });
    });

    it('should return null for non-existent carrier', async () => {
      (mockPrisma.carrier.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all carriers for tenant', async () => {
      const mockCarriers = [
        {
          id: 'carrier-1',
          name: 'DHL Express',
          tenantId: 'test-tenant',
          active: true,
        },
        {
          id: 'carrier-2',
          name: 'FedEx',
          tenantId: 'test-tenant',
          active: true,
        },
      ];

      (mockPrisma.carrier.findMany as any).mockResolvedValue(mockCarriers);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockCarriers);
      expect(mockPrisma.carrier.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('should filter by active status when requested', async () => {
      (mockPrisma.carrier.findMany as any).mockResolvedValue([]);

      await service.getAll('test-tenant', true);

      expect(mockPrisma.carrier.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'test-tenant',
          active: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('update', () => {
    it('should update carrier successfully', async () => {
      const existingCarrier = {
        id: 'carrier-1',
        name: 'DHL Express',
        tenantId: 'test-tenant',
      };

      const updatedCarrier = {
        ...existingCarrier,
        name: 'DHL International',
        apiEndpoint: 'https://api.dhl.com/v2',
      };

      (mockPrisma.carrier.findFirst as any).mockResolvedValue(existingCarrier);
      (mockPrisma.carrier.update as any).mockResolvedValue(updatedCarrier);

      const result = await service.update('carrier-1', 'test-tenant', {
        name: 'DHL International',
        apiEndpoint: 'https://api.dhl.com/v2',
      });

      expect(result.name).toBe('DHL International');
      expect(mockPrisma.carrier.update).toHaveBeenCalled();
    });

    it('should throw error if carrier not found', async () => {
      (mockPrisma.carrier.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { name: 'Updated' })
      ).rejects.toThrow('Carrier not found');
    });
  });

  describe('delete', () => {
    it('should delete carrier successfully', async () => {
      const existingCarrier = {
        id: 'carrier-1',
        name: 'DHL Express',
        tenantId: 'test-tenant',
      };

      (mockPrisma.carrier.findFirst as any).mockResolvedValue(existingCarrier);
      (mockPrisma.carrier.delete as any).mockResolvedValue(existingCarrier);

      await service.delete('carrier-1', 'test-tenant');

      expect(mockPrisma.carrier.delete).toHaveBeenCalledWith({ where: { id: 'carrier-1' } });
    });

    it('should throw error if carrier not found', async () => {
      (mockPrisma.carrier.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Carrier not found');
    });
  });

  describe('getTrackingUrl', () => {
    it('should generate tracking URL with tracking number', () => {
      const carrier = {
        id: 'carrier-1',
        name: 'DHL Express',
        trackingUrlTemplate: 'https://dhl.com/track/{trackingNumber}',
        tenantId: 'test-tenant',
        active: true,
        apiEndpoint: '',
        apiKey: null,
        apiSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const url = service.getTrackingUrl(carrier, '1234567890');

      expect(url).toBe('https://dhl.com/track/1234567890');
    });

    it('should handle multiple tracking number placeholders', () => {
      const carrier = {
        id: 'carrier-1',
        name: 'Custom Carrier',
        trackingUrlTemplate: 'https://tracking.com/{trackingNumber}/details',
        tenantId: 'test-tenant',
        active: true,
        apiEndpoint: '',
        apiKey: null,
        apiSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const url = service.getTrackingUrl(carrier, 'ABC123');

      expect(url).toBe('https://tracking.com/ABC123/details');
    });
  });
});

