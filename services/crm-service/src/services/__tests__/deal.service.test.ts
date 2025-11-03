import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, DealStage } from '@prisma/client';
import { DealService } from '../deal.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  deal: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  lead: {
    findFirst: vi.fn(),
  },
} as unknown as PrismaClient;

describe('DealService', () => {
  let service: DealService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DealService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      title: 'Enterprise Deal',
      description: 'Large enterprise contract',
      value: 50000,
      probability: 75,
      stage: DealStage.QUALIFIED,
      expectedCloseDate: new Date(),
      leadId: 'lead-1',
      tenantId: 'test-tenant',
    };

    it('should create a deal with valid data', async () => {
      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockDeal = {
        id: 'deal-1',
        dealNumber: 'DEAL-ABC123',
        ...validData,
        createdAt: new Date(),
        lead: mockLead,
        tasks: [],
        activities: [],
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.deal.findUnique as any).mockResolvedValue(null);
      (mockPrisma.deal.create as any).mockResolvedValue(mockDeal);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('deal-1');
      expect(result.dealNumber).toBe('DEAL-ABC123');
      expect(mockPrisma.deal.create).toHaveBeenCalled();
    });

    it('should reject deal with non-existent lead', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('Lead not found');
    });

    it('should set default value to 0 if not provided', async () => {
      const dataWithoutValue = { ...validData };
      delete (dataWithoutValue as any).value;

      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockDeal = { id: 'deal-1', dealNumber: 'DEAL-ABC123', ...dataWithoutValue, value: 0 };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.deal.findUnique as any).mockResolvedValue(null);
      (mockPrisma.deal.create as any).mockResolvedValue(mockDeal);

      await service.create(dataWithoutValue);

      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: 0,
          }),
        })
      );
    });

    it('should clamp probability to 0-100 range', async () => {
      const dataWithHighProbability = { ...validData, probability: 150 };
      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockDeal = { id: 'deal-1', dealNumber: 'DEAL-ABC123', ...dataWithHighProbability, probability: 100 };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.deal.findUnique as any).mockResolvedValue(null);
      (mockPrisma.deal.create as any).mockResolvedValue(mockDeal);

      await service.create(dataWithHighProbability);

      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            probability: 100,
          }),
        })
      );
    });

    it('should set default stage to LEAD', async () => {
      const dataWithoutStage = { ...validData };
      delete (dataWithoutStage as any).stage;

      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockDeal = { id: 'deal-1', dealNumber: 'DEAL-ABC123', ...dataWithoutStage, stage: DealStage.LEAD };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.deal.findUnique as any).mockResolvedValue(null);
      (mockPrisma.deal.create as any).mockResolvedValue(mockDeal);

      await service.create(dataWithoutStage);

      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: DealStage.LEAD,
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return deal by id and tenant', async () => {
      const mockDeal = {
        id: 'deal-1',
        dealNumber: 'DEAL-ABC123',
        title: 'Deal',
        tenantId: 'test-tenant',
        lead: null,
        tasks: [],
        activities: [],
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(mockDeal);

      const result = await service.getById('deal-1', 'test-tenant');

      expect(result).toEqual(mockDeal);
    });

    it('should return null for non-existent deal', async () => {
      (mockPrisma.deal.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all deals for tenant', async () => {
      const mockDeals = [
        { id: 'deal-1', dealNumber: 'DEAL-001', tenantId: 'test-tenant' },
        { id: 'deal-2', dealNumber: 'DEAL-002', tenantId: 'test-tenant' },
      ];

      (mockPrisma.deal.findMany as any).mockResolvedValue(mockDeals);
      (mockPrisma.deal.count as any).mockResolvedValue(2);

      const result = await service.getAll('test-tenant');

      expect(result.deals).toEqual(mockDeals);
      expect(result.total).toBe(2);
    });

    it('should filter by stage', async () => {
      (mockPrisma.deal.findMany as any).mockResolvedValue([]);
      (mockPrisma.deal.count as any).mockResolvedValue(0);

      await service.getAll('test-tenant', { stage: DealStage.QUALIFIED });

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stage: DealStage.QUALIFIED,
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update deal successfully', async () => {
      const existingDeal = {
        id: 'deal-1',
        title: 'Old Title',
        stage: DealStage.LEAD,
        tenantId: 'test-tenant',
      };

      const updatedDeal = {
        ...existingDeal,
        title: 'New Title',
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(existingDeal);
      (mockPrisma.deal.update as any).mockResolvedValue(updatedDeal);

      const result = await service.update('deal-1', 'test-tenant', {
        title: 'New Title',
      });

      expect(result.title).toBe('New Title');
    });

    it('should set wonAt and actualCloseDate when marking as CLOSED_WON', async () => {
      const existingDeal = {
        id: 'deal-1',
        stage: DealStage.NEGOTIATION,
        tenantId: 'test-tenant',
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(existingDeal);
      (mockPrisma.deal.update as any).mockResolvedValue({
        ...existingDeal,
        stage: DealStage.CLOSED_WON,
        wonAt: new Date(),
        actualCloseDate: new Date(),
      });

      await service.update('deal-1', 'test-tenant', {
        stage: DealStage.CLOSED_WON,
      });

      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stage: DealStage.CLOSED_WON,
            wonAt: expect.any(Date),
            actualCloseDate: expect.any(Date),
          }),
        })
      );
    });

    it('should clamp probability to 0-100 range on update', async () => {
      const existingDeal = {
        id: 'deal-1',
        probability: 50,
        tenantId: 'test-tenant',
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(existingDeal);
      (mockPrisma.deal.update as any).mockResolvedValue({
        ...existingDeal,
        probability: 100,
      });

      await service.update('deal-1', 'test-tenant', {
        probability: 150,
      });

      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            probability: 100,
          }),
        })
      );
    });
  });

  describe('getPipelineStats', () => {
    it('should return pipeline statistics', async () => {
      const mockDeals = [
        { stage: DealStage.LEAD, value: 10000, probability: 25 },
        { stage: DealStage.QUALIFIED, value: 20000, probability: 50 },
        { stage: DealStage.PROPOSAL, value: 30000, probability: 75 },
      ];

      (mockPrisma.deal.findMany as any).mockResolvedValue(mockDeals);

      const result = await service.getPipelineStats('test-tenant');

      expect(result.totalValue).toBe(60000);
      expect(result.weightedValue).toBeGreaterThan(0);
      expect(result.stages.length).toBeGreaterThan(0);
    });
  });
});

