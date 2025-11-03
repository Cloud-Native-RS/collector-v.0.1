import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ActivityType } from '@prisma/client';
import { ActivityService } from '../activity.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  activity: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  lead: {
    findFirst: vi.fn(),
  },
  deal: {
    findFirst: vi.fn(),
  },
  task: {
    findFirst: vi.fn(),
  },
} as unknown as PrismaClient;

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ActivityService(mockPrisma);
  });

  describe('create', () => {
    const validLeadData = {
      type: ActivityType.CALL,
      title: 'Phone call with client',
      description: 'Discussed proposal',
      notes: 'Client interested',
      duration: 30,
      leadId: 'lead-1',
      tenantId: 'test-tenant',
    };

    it('should create an activity with valid lead data', async () => {
      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockActivity = {
        id: 'activity-1',
        ...validLeadData,
        createdAt: new Date(),
        lead: mockLead,
        deal: null,
        task: null,
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await service.create(validLeadData);

      expect(result).toBeDefined();
      expect(result.id).toBe('activity-1');
      expect(mockPrisma.activity.create).toHaveBeenCalled();
    });

    it('should create an activity with valid deal data', async () => {
      const validDealData = {
        ...validLeadData,
        dealId: 'deal-1',
        leadId: undefined,
      };

      const mockDeal = { id: 'deal-1', tenantId: 'test-tenant' };
      const mockActivity = {
        id: 'activity-1',
        ...validDealData,
        lead: null,
        deal: mockDeal,
        task: null,
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(mockDeal);
      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await service.create(validDealData);

      expect(result).toBeDefined();
    });

    it('should create an activity with valid task data', async () => {
      const validTaskData = {
        ...validLeadData,
        taskId: 'task-1',
        leadId: undefined,
      };

      const mockTask = { id: 'task-1', tenantId: 'test-tenant' };
      const mockActivity = {
        id: 'activity-1',
        ...validTaskData,
        lead: null,
        deal: null,
        task: mockTask,
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(mockTask);
      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await service.create(validTaskData);

      expect(result).toBeDefined();
    });

    it('should reject activity without lead, deal, or task', async () => {
      const invalidData = {
        type: ActivityType.NOTE,
        title: 'Activity',
        tenantId: 'test-tenant',
      };

      await expect(service.create(invalidData as any)).rejects.toThrow(AppError);
      await expect(service.create(invalidData as any)).rejects.toThrow('associated with a lead, deal, or task');
    });

    it('should reject activity with non-existent lead', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      await expect(service.create(validLeadData)).rejects.toThrow(AppError);
      await expect(service.create(validLeadData)).rejects.toThrow('Lead not found');
    });
  });

  describe('getById', () => {
    it('should return activity by id and tenant', async () => {
      const mockActivity = {
        id: 'activity-1',
        title: 'Activity',
        tenantId: 'test-tenant',
        lead: null,
        deal: null,
        task: null,
      };

      (mockPrisma.activity.findFirst as any).mockResolvedValue(mockActivity);

      const result = await service.getById('activity-1', 'test-tenant');

      expect(result).toEqual(mockActivity);
    });
  });

  describe('getAll', () => {
    it('should return all activities for tenant', async () => {
      const mockActivities = [
        { id: 'activity-1', tenantId: 'test-tenant' },
        { id: 'activity-2', tenantId: 'test-tenant' },
      ];

      (mockPrisma.activity.findMany as any).mockResolvedValue(mockActivities);
      (mockPrisma.activity.count as any).mockResolvedValue(2);

      const result = await service.getAll('test-tenant');

      expect(result.activities).toEqual(mockActivities);
      expect(result.total).toBe(2);
    });

    it('should filter by type', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await service.getAll('test-tenant', { type: ActivityType.CALL });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ActivityType.CALL,
          }),
        })
      );
    });
  });
});

