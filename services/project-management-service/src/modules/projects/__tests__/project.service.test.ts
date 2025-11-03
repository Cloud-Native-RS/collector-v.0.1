import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import { ProjectService } from '../project.service';
import { AppError } from '../../../middleware/error-handler';

const mockPrisma = {
  project: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  milestone: {
    findMany: vi.fn(),
  },
  task: {
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      name: 'Test Project',
      description: 'Test Description',
      status: ProjectStatus.PLANNED,
      startDate: new Date(),
      endDate: new Date(),
      clientId: 'client-1',
      tenantId: 'test-tenant',
    };

    it('should create a project with valid data', async () => {
      const mockProject = {
        id: 'proj-1',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.project.create as any).mockResolvedValue(mockProject);

      const result = await service.create(validData as any);

      expect(result).toBeDefined();
      expect(result.id).toBe('proj-1');
      expect(mockPrisma.project.create).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return project by id and tenant', async () => {
      const mockProject = {
        id: 'proj-1',
        name: 'Test Project',
        tenantId: 'test-tenant',
        milestones: [],
        tasks: [],
      };

      (mockPrisma.project.findFirst as any).mockResolvedValue(mockProject);

      const result = await service.getById('proj-1', 'test-tenant');

      expect(result).toEqual(mockProject);
    });

    it('should return null for non-existent project', async () => {
      (mockPrisma.project.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project successfully', async () => {
      const existingProject = {
        id: 'proj-1',
        name: 'Old Name',
        tenantId: 'test-tenant',
      };

      const updatedProject = {
        ...existingProject,
        name: 'New Name',
      };

      (mockPrisma.project.findFirst as any).mockResolvedValue(existingProject);
      (mockPrisma.project.update as any).mockResolvedValue(updatedProject);

      const result = await service.update('proj-1', 'test-tenant', { name: 'New Name' } as any);

      expect(result.name).toBe('New Name');
    });
  });
});

