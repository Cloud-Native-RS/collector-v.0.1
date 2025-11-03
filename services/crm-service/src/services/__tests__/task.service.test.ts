import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, TaskStatus, TaskType, TaskPriority } from '@prisma/client';
import { TaskService } from '../task.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  task: {
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
} as unknown as PrismaClient;

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService(mockPrisma);
  });

  describe('create', () => {
    const validLeadData = {
      title: 'Follow up with client',
      description: 'Call to discuss proposal',
      type: TaskType.CALL,
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date(),
      leadId: 'lead-1',
      tenantId: 'test-tenant',
    };

    it('should create a task with valid lead data', async () => {
      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockTask = {
        id: 'task-1',
        ...validLeadData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lead: mockLead,
        deal: null,
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      const result = await service.create(validLeadData);

      expect(result).toBeDefined();
      expect(result.id).toBe('task-1');
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it('should create a task with valid deal data', async () => {
      const validDealData = {
        ...validLeadData,
        dealId: 'deal-1',
        leadId: undefined,
      };

      const mockDeal = { id: 'deal-1', tenantId: 'test-tenant' };
      const mockTask = {
        id: 'task-1',
        ...validDealData,
        lead: null,
        deal: mockDeal,
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(mockDeal);
      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      const result = await service.create(validDealData);

      expect(result).toBeDefined();
      expect(mockPrisma.task.create).toHaveBeenCalled();
    });

    it('should reject task without lead or deal', async () => {
      const invalidData = {
        title: 'Task',
        type: TaskType.NOTE,
        tenantId: 'test-tenant',
      };

      await expect(service.create(invalidData as any)).rejects.toThrow(AppError);
      await expect(service.create(invalidData as any)).rejects.toThrow('associated with either a lead or a deal');
    });

    it('should reject task with non-existent lead', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      await expect(service.create(validLeadData)).rejects.toThrow(AppError);
      await expect(service.create(validLeadData)).rejects.toThrow('Lead not found');
    });

    it('should reject task with non-existent deal', async () => {
      const invalidData = {
        ...validLeadData,
        dealId: 'non-existent',
        leadId: undefined,
      };

      (mockPrisma.deal.findFirst as any).mockResolvedValue(null);

      await expect(service.create(invalidData as any)).rejects.toThrow(AppError);
      await expect(service.create(invalidData as any)).rejects.toThrow('Deal not found');
    });

    it('should set default status to PENDING', async () => {
      const dataWithoutStatus = { ...validLeadData };
      delete (dataWithoutStatus as any).status;

      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockTask = { id: 'task-1', ...dataWithoutStatus, status: TaskStatus.PENDING };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      await service.create(dataWithoutStatus);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.PENDING,
          }),
        })
      );
    });

    it('should set default priority to MEDIUM', async () => {
      const dataWithoutPriority = { ...validLeadData };
      delete (dataWithoutPriority as any).priority;

      const mockLead = { id: 'lead-1', tenantId: 'test-tenant' };
      const mockTask = { id: 'task-1', ...dataWithoutPriority, priority: TaskPriority.MEDIUM };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);
      (mockPrisma.task.create as any).mockResolvedValue(mockTask);

      await service.create(dataWithoutPriority);

      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: TaskPriority.MEDIUM,
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return task by id and tenant', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Task',
        tenantId: 'test-tenant',
        lead: null,
        deal: null,
        activities: [],
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(mockTask);

      const result = await service.getById('task-1', 'test-tenant');

      expect(result).toEqual(mockTask);
      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'task-1', tenantId: 'test-tenant' },
        include: {
          lead: true,
          deal: true,
          activities: expect.anything(),
        },
      });
    });

    it('should return null for non-existent task', async () => {
      (mockPrisma.task.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all tasks for tenant', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', tenantId: 'test-tenant' },
        { id: 'task-2', title: 'Task 2', tenantId: 'test-tenant' },
      ];

      (mockPrisma.task.findMany as any).mockResolvedValue(mockTasks);
      (mockPrisma.task.count as any).mockResolvedValue(2);

      const result = await service.getAll('test-tenant');

      expect(result.tasks).toEqual(mockTasks);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      (mockPrisma.task.findMany as any).mockResolvedValue([]);
      (mockPrisma.task.count as any).mockResolvedValue(0);

      await service.getAll('test-tenant', { status: TaskStatus.COMPLETED });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TaskStatus.COMPLETED,
          }),
        })
      );
    });

    it('should filter by leadId', async () => {
      (mockPrisma.task.findMany as any).mockResolvedValue([]);
      (mockPrisma.task.count as any).mockResolvedValue(0);

      await service.getAll('test-tenant', { leadId: 'lead-1' });

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leadId: 'lead-1',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update task successfully', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Old Title',
        status: TaskStatus.PENDING,
        tenantId: 'test-tenant',
      };

      const updatedTask = {
        ...existingTask,
        title: 'New Title',
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(existingTask);
      (mockPrisma.task.update as any).mockResolvedValue(updatedTask);

      const result = await service.update('task-1', 'test-tenant', {
        title: 'New Title',
      });

      expect(result.title).toBe('New Title');
      expect(mockPrisma.task.update).toHaveBeenCalled();
    });

    it('should set completedAt when marking as completed', async () => {
      const existingTask = {
        id: 'task-1',
        status: TaskStatus.PENDING,
        tenantId: 'test-tenant',
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(existingTask);
      (mockPrisma.task.update as any).mockResolvedValue({
        ...existingTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      await service.update('task-1', 'test-tenant', {
        status: TaskStatus.COMPLETED,
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should clear completedAt when unmarking completed', async () => {
      const existingTask = {
        id: 'task-1',
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
        tenantId: 'test-tenant',
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(existingTask);
      (mockPrisma.task.update as any).mockResolvedValue({
        ...existingTask,
        status: TaskStatus.PENDING,
        completedAt: null,
      });

      await service.update('task-1', 'test-tenant', {
        status: TaskStatus.PENDING,
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAt: null,
          }),
        })
      );
    });

    it('should throw error if task not found', async () => {
      (mockPrisma.task.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { title: 'New Title' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { title: 'New Title' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      const existingTask = {
        id: 'task-1',
        title: 'Task',
        tenantId: 'test-tenant',
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(existingTask);
      (mockPrisma.task.delete as any).mockResolvedValue(existingTask);

      await service.delete('task-1', 'test-tenant');

      expect(mockPrisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });

    it('should throw error if task not found', async () => {
      (mockPrisma.task.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Task not found');
    });
  });

  describe('complete', () => {
    it('should mark task as completed', async () => {
      const existingTask = {
        id: 'task-1',
        status: TaskStatus.PENDING,
        tenantId: 'test-tenant',
      };

      (mockPrisma.task.findFirst as any).mockResolvedValue(existingTask);
      (mockPrisma.task.update as any).mockResolvedValue({
        ...existingTask,
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      });

      const result = await service.complete('task-1', 'test-tenant');

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: TaskStatus.COMPLETED,
          }),
        })
      );
    });
  });
});

