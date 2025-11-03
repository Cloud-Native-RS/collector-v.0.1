import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, LeadStatus, LeadSource } from '@prisma/client';
import { LeadService } from '../lead.service';
import { AppError } from '../../middleware/error-handler';

const mockPrisma = {
  lead: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
} as unknown as PrismaClient;

describe('LeadService', () => {
  let service: LeadService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LeadService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      source: LeadSource.WEBSITE,
      status: LeadStatus.NEW,
      value: 10000,
      tenantId: 'test-tenant',
    };

    it('should create a lead with valid data', async () => {
      const mockLead = {
        id: 'lead-1',
        leadNumber: 'LEAD-ABC123',
        ...validData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);
      (mockPrisma.lead.findUnique as any).mockResolvedValue(null);
      (mockPrisma.lead.create as any).mockResolvedValue(mockLead);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('lead-1');
      expect(result.leadNumber).toBe('LEAD-ABC123');
      expect(mockPrisma.lead.create).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      const existingLead = { id: 'lead-existing', email: validData.email };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(existingLead);

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('email already exists');
    });

    it('should generate unique lead number', async () => {
      const mockLead = {
        id: 'lead-1',
        leadNumber: 'LEAD-ABC123',
        ...validData,
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);
      (mockPrisma.lead.findUnique as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (mockPrisma.lead.create as any).mockResolvedValue(mockLead);

      await service.create(validData);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadNumber: expect.stringMatching(/^LEAD-/),
          }),
        })
      );
    });

    it('should set default value to 0 if not provided', async () => {
      const dataWithoutValue = { ...validData };
      delete (dataWithoutValue as any).value;

      const mockLead = {
        id: 'lead-1',
        leadNumber: 'LEAD-ABC123',
        ...dataWithoutValue,
        value: 0,
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);
      (mockPrisma.lead.findUnique as any).mockResolvedValue(null);
      (mockPrisma.lead.create as any).mockResolvedValue(mockLead);

      const result = await service.create(dataWithoutValue);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: 0,
          }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return lead by id and tenant', async () => {
      const mockLead = {
        id: 'lead-1',
        leadNumber: 'LEAD-ABC123',
        name: 'John Doe',
        tenantId: 'test-tenant',
        tasks: [],
        deals: [],
        activities: [],
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(mockLead);

      const result = await service.getById('lead-1', 'test-tenant');

      expect(result).toEqual(mockLead);
      expect(mockPrisma.lead.findFirst).toHaveBeenCalledWith({
        where: { id: 'lead-1', tenantId: 'test-tenant' },
        include: {
          tasks: true,
          deals: true,
          activities: expect.anything(),
        },
      });
    });

    it('should return null for non-existent lead', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all leads for tenant', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          leadNumber: 'LEAD-001',
          name: 'John Doe',
          tenantId: 'test-tenant',
        },
        {
          id: 'lead-2',
          leadNumber: 'LEAD-002',
          name: 'Jane Smith',
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.lead.findMany as any).mockResolvedValue(mockLeads);
      (mockPrisma.lead.count as any).mockResolvedValue(2);

      const result = await service.getAll('test-tenant');

      expect(result.leads).toEqual(mockLeads);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          status: LeadStatus.NEW,
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.lead.findMany as any).mockResolvedValue(mockLeads);
      (mockPrisma.lead.count as any).mockResolvedValue(1);

      const result = await service.getAll('test-tenant', { status: LeadStatus.NEW });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: LeadStatus.NEW,
          }),
        })
      );
    });

    it('should filter by source', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          source: LeadSource.WEBSITE,
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.lead.findMany as any).mockResolvedValue(mockLeads);
      (mockPrisma.lead.count as any).mockResolvedValue(1);

      await service.getAll('test-tenant', { source: LeadSource.WEBSITE });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: LeadSource.WEBSITE,
          }),
        })
      );
    });

    it('should support search functionality', async () => {
      const mockLeads = [
        {
          id: 'lead-1',
          name: 'John Doe',
          tenantId: 'test-tenant',
        },
      ];

      (mockPrisma.lead.findMany as any).mockResolvedValue(mockLeads);
      (mockPrisma.lead.count as any).mockResolvedValue(1);

      await service.getAll('test-tenant', { search: 'John' });

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should exclude converted leads', async () => {
      (mockPrisma.lead.findMany as any).mockResolvedValue([]);
      (mockPrisma.lead.count as any).mockResolvedValue(0);

      await service.getAll('test-tenant');

      expect(mockPrisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            convertedToCustomerId: null,
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update lead successfully', async () => {
      const existingLead = {
        id: 'lead-1',
        name: 'John Doe',
        email: 'john@example.com',
        tenantId: 'test-tenant',
      };

      const updatedLead = {
        ...existingLead,
        name: 'Johnny Doe',
      };

      (mockPrisma.lead.findFirst as any)
        .mockResolvedValueOnce(existingLead)
        .mockResolvedValueOnce(existingLead);
      (mockPrisma.lead.update as any).mockResolvedValue(updatedLead);

      const result = await service.update('lead-1', 'test-tenant', {
        name: 'Johnny Doe',
      });

      expect(result.name).toBe('Johnny Doe');
      expect(mockPrisma.lead.update).toHaveBeenCalled();
    });

    it('should throw error if lead not found', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { name: 'John' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { name: 'John' })
      ).rejects.toThrow('Lead not found');
    });

    it('should reject duplicate email on update', async () => {
      const existingLead = {
        id: 'lead-1',
        email: 'john@example.com',
        tenantId: 'test-tenant',
      };

      const duplicateLead = {
        id: 'lead-2',
        email: 'newemail@example.com',
        tenantId: 'test-tenant',
      };

      (mockPrisma.lead.findFirst as any)
        .mockResolvedValueOnce(existingLead)
        .mockResolvedValueOnce(duplicateLead);

      await expect(
        service.update('lead-1', 'test-tenant', { email: 'newemail@example.com' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('lead-1', 'test-tenant', { email: 'newemail@example.com' })
      ).rejects.toThrow('email already exists');
    });
  });

  describe('delete', () => {
    it('should delete lead successfully', async () => {
      const existingLead = {
        id: 'lead-1',
        name: 'John Doe',
        tenantId: 'test-tenant',
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(existingLead);
      (mockPrisma.lead.delete as any).mockResolvedValue(existingLead);

      await service.delete('lead-1', 'test-tenant');

      expect(mockPrisma.lead.delete).toHaveBeenCalledWith({ where: { id: 'lead-1' } });
    });

    it('should throw error if lead not found', async () => {
      (mockPrisma.lead.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Lead not found');
    });
  });

  describe('markAsConverted', () => {
    it('should mark lead as converted', async () => {
      const existingLead = {
        id: 'lead-1',
        status: LeadStatus.QUALIFIED,
        tenantId: 'test-tenant',
        convertedToCustomerId: null,
      };

      const convertedLead = {
        ...existingLead,
        status: LeadStatus.WON,
        convertedToCustomerId: 'customer-1',
        convertedAt: new Date(),
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(existingLead);
      (mockPrisma.lead.update as any).mockResolvedValue(convertedLead);

      const result = await service.markAsConverted('lead-1', 'test-tenant', 'customer-1');

      expect(result.status).toBe(LeadStatus.WON);
      expect(result.convertedToCustomerId).toBe('customer-1');
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lead-1' },
          data: expect.objectContaining({
            status: LeadStatus.WON,
            convertedToCustomerId: 'customer-1',
          }),
        })
      );
    });

    it('should throw error if lead already converted', async () => {
      const existingLead = {
        id: 'lead-1',
        convertedToCustomerId: 'customer-1',
        tenantId: 'test-tenant',
      };

      (mockPrisma.lead.findFirst as any).mockResolvedValue(existingLead);

      await expect(
        service.markAsConverted('lead-1', 'test-tenant', 'customer-2')
      ).rejects.toThrow(AppError);
      await expect(
        service.markAsConverted('lead-1', 'test-tenant', 'customer-2')
      ).rejects.toThrow('already converted');
    });
  });

  describe('getStats', () => {
    it('should return lead statistics', async () => {
      const mockLeads = [
        { status: LeadStatus.NEW, source: LeadSource.WEBSITE, value: 1000 },
        { status: LeadStatus.CONTACTED, source: LeadSource.EMAIL, value: 2000 },
        { status: LeadStatus.QUALIFIED, source: LeadSource.WEBSITE, value: 3000 },
      ];

      (mockPrisma.lead.findMany as any).mockResolvedValue(mockLeads);

      const result = await service.getStats('test-tenant');

      expect(result.total).toBe(3);
      expect(result.totalValue).toBe(6000);
      expect(result.byStatus[LeadStatus.NEW]).toBe(1);
      expect(result.byStatus[LeadStatus.CONTACTED]).toBe(1);
      expect(result.bySource[LeadSource.WEBSITE]).toBe(2);
      expect(result.bySource[LeadSource.EMAIL]).toBe(1);
    });
  });
});

