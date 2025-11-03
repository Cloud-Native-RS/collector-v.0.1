import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CompanyService } from '../company.service';
import { AppError } from '../../middleware/error-handler';

// Mock Prisma Client
const mockPrisma = {
  company: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  address: {
    create: vi.fn(),
  },
  contact: {
    create: vi.fn(),
  },
  bankAccount: {
    create: vi.fn(),
  },
} as unknown as PrismaClient;

describe('CompanyService', () => {
  let service: CompanyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CompanyService(mockPrisma);
  });

  describe('create', () => {
    const validData = {
      companyType: 'CORPORATION' as const,
      legalName: 'Acme Corporation',
      tradingName: 'Acme Corp',
      taxId: '45-9876543',
      registrationNumber: 'CORP-2024-001',
      industry: 'Technology',
      legalRepName: 'John CEO',
      legalRepTitle: 'CEO',
      legalRepEmail: 'ceo@acme.com',
      legalRepPhone: '+1234567890',
      address: {
        street: '456 Park Ave',
        city: 'London',
        state: 'Greater London',
        zipCode: 'SW1A 1AA',
        country: 'GB',
      },
      contact: {
        email: 'info@acme.com',
        phone: '+442071234567',
        website: 'https://acme.com',
      },
      tenantId: 'test-tenant',
    };

    it('should create a company with valid data', async () => {
      const mockAddress = { id: 'addr-1', ...validData.address };
      const mockContact = { id: 'cont-1', ...validData.contact };
      const mockCompany = {
        id: 'comp-1',
        companyNumber: 'COMP-ABC123',
        status: 'ACTIVE',
        ...validData,
        address: mockAddress,
        contact: mockContact,
        bankAccount: null,
        contacts: [],
      };

      (mockPrisma.company.findUnique as any).mockResolvedValue(null);
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);
      (mockPrisma.address.create as any).mockResolvedValue(mockAddress);
      (mockPrisma.contact.create as any).mockResolvedValue(mockContact);
      (mockPrisma.company.create as any).mockResolvedValue(mockCompany);

      const result = await service.create(validData);

      expect(result).toBeDefined();
      expect(result.id).toBe('comp-1');
      expect(result.companyNumber).toBe('COMP-ABC123');
      expect(result.legalName).toBe('Acme Corporation');
      expect(mockPrisma.company.create).toHaveBeenCalled();
    });

    it('should reject duplicate legal name', async () => {
      const existingCompany = { id: 'comp-existing', legalName: validData.legalName };
      
      (mockPrisma.company.findUnique as any).mockResolvedValue(existingCompany);

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('legal name already exists');
    });

    it('should reject duplicate tax ID', async () => {
      (mockPrisma.company.findUnique as any)
        .mockResolvedValueOnce(null) // Legal name check passes
        .mockResolvedValueOnce({ id: 'comp-existing', taxId: validData.taxId }); // Tax ID exists

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('Tax ID already exists');
    });

    it('should reject duplicate registration number', async () => {
      (mockPrisma.company.findUnique as any)
        .mockResolvedValueOnce(null) // Legal name check
        .mockResolvedValueOnce(null); // Tax ID check
      (mockPrisma.company.findFirst as any).mockResolvedValueOnce({ 
        id: 'comp-existing', 
        registrationNumber: validData.registrationNumber 
      });

      await expect(service.create(validData)).rejects.toThrow(AppError);
      await expect(service.create(validData)).rejects.toThrow('registration number already exists');
    });

    it('should reject invalid tax ID format', async () => {
      const invalidData = { ...validData, taxId: '123' };
      
      (mockPrisma.company.findUnique as any).mockResolvedValue(null);
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      await expect(service.create(invalidData)).rejects.toThrow(AppError);
    });

    it('should include bank account when provided', async () => {
      const dataWithBank = {
        ...validData,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123456789',
          routingNumber: '987654321',
          iban: 'GB82WEST12345698765432',
          swift: 'DEUTDEFF',
        },
      };

      const mockAddress = { id: 'addr-2', ...dataWithBank.address };
      const mockContact = { id: 'cont-2', ...dataWithBank.contact };
      const mockBankAccount = { id: 'bank-1', ...dataWithBank.bankAccount };
      const mockCompany = {
        id: 'comp-2',
        companyNumber: 'COMP-DEF456',
        status: 'ACTIVE',
        ...dataWithBank,
        address: mockAddress,
        contact: mockContact,
        bankAccount: mockBankAccount,
        contacts: [],
      };

      (mockPrisma.company.findUnique as any).mockResolvedValue(null);
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);
      (mockPrisma.address.create as any).mockResolvedValue(mockAddress);
      (mockPrisma.contact.create as any).mockResolvedValue(mockContact);
      (mockPrisma.bankAccount.create as any).mockResolvedValue(mockBankAccount);
      (mockPrisma.company.create as any).mockResolvedValue(mockCompany);

      const result = await service.create(dataWithBank);

      expect(mockPrisma.bankAccount.create).toHaveBeenCalled();
      expect(result.bankAccount).toBeDefined();
    });

    it('should validate IBAN when provided', async () => {
      const invalidIBAN = {
        ...validData,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123456',
          iban: 'INVALID-IBAN',
        },
      };

      (mockPrisma.company.findUnique as any).mockResolvedValue(null);
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      await expect(service.create(invalidIBAN)).rejects.toThrow(AppError);
    });

    it('should validate SWIFT when provided', async () => {
      const invalidSWIFT = {
        ...validData,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123456',
          swift: 'INVALID',
        },
      };

      (mockPrisma.company.findUnique as any).mockResolvedValue(null);
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      await expect(service.create(invalidSWIFT)).rejects.toThrow(AppError);
    });
  });

  describe('getById', () => {
    it('should return company by id and tenant', async () => {
      const mockCompany = {
        id: 'comp-1',
        companyNumber: 'COMP-ABC123',
        legalName: 'Acme Corporation',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        contacts: [],
      };

      (mockPrisma.company.findFirst as any).mockResolvedValue(mockCompany);

      const result = await service.getById('comp-1', 'test-tenant');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { id: 'comp-1', tenantId: 'test-tenant' },
        include: { 
          address: true, 
          contact: true, 
          bankAccount: true, 
          contacts: { where: { type: 'INDIVIDUAL' } } 
        },
      });
    });

    it('should return null for non-existent company', async () => {
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all companies for tenant', async () => {
      const mockCompanies = [
        {
          id: 'comp-1',
          companyNumber: 'COMP-001',
          legalName: 'Acme Corporation',
          tenantId: 'test-tenant',
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          contacts: [],
        },
        {
          id: 'comp-2',
          companyNumber: 'COMP-002',
          legalName: 'Tech Innovations Ltd',
          tenantId: 'test-tenant',
          address: { id: 'addr-2' },
          contact: { id: 'cont-2' },
          bankAccount: null,
          contacts: [],
        },
      ];

      (mockPrisma.company.findMany as any).mockResolvedValue(mockCompanies);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockCompanies);
      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        skip: 0,
        take: 50,
        include: { 
          address: true, 
          contact: true, 
          bankAccount: true, 
          contacts: { where: { type: 'INDIVIDUAL' } } 
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply pagination', async () => {
      const mockCompanies = [
        {
          id: 'comp-1',
          companyNumber: 'COMP-001',
          legalName: 'Acme Corporation',
          tenantId: 'test-tenant',
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          contacts: [],
        },
      ];

      (mockPrisma.company.findMany as any).mockResolvedValue(mockCompanies);

      await service.getAll('test-tenant', 10, 20);

      expect(mockPrisma.company.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        skip: 10,
        take: 20,
        include: { 
          address: true, 
          contact: true, 
          bankAccount: true, 
          contacts: { where: { type: 'INDIVIDUAL' } } 
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update company successfully', async () => {
      const existingCompany = {
        id: 'comp-1',
        legalName: 'Acme Corporation',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        contacts: [],
      };

      const updatedCompany = {
        ...existingCompany,
        tradingName: 'Acme Corp International',
        industry: 'FinTech',
      };

      (mockPrisma.company.findFirst as any).mockResolvedValue(existingCompany);
      (mockPrisma.company.update as any).mockResolvedValue(updatedCompany);

      const result = await service.update('comp-1', 'test-tenant', {
        tradingName: 'Acme Corp International',
        industry: 'FinTech',
      });

      expect(result.tradingName).toBe('Acme Corp International');
      expect(result.industry).toBe('FinTech');
      expect(mockPrisma.company.update).toHaveBeenCalled();
    });

    it('should throw error if company not found', async () => {
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { tradingName: 'New Name' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { tradingName: 'New Name' })
      ).rejects.toThrow('Company not found');
    });
  });

  describe('delete', () => {
    it('should delete company successfully', async () => {
      const existingCompany = {
        id: 'comp-1',
        legalName: 'Acme Corporation',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        contacts: [],
      };

      (mockPrisma.company.findFirst as any).mockResolvedValue(existingCompany);
      (mockPrisma.company.delete as any).mockResolvedValue(existingCompany);

      await service.delete('comp-1', 'test-tenant');

      expect(mockPrisma.company.delete).toHaveBeenCalledWith({ where: { id: 'comp-1' } });
    });

    it('should throw error if company not found', async () => {
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Company not found');
    });
  });

  describe('lookupByTaxId', () => {
    it('should find company by tax ID', async () => {
      const mockCompany = {
        id: 'comp-1',
        taxId: '45-9876543',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        contacts: [],
      };

      (mockPrisma.company.findFirst as any).mockResolvedValue(mockCompany);

      const result = await service.lookupByTaxId('45-9876543', 'test-tenant');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { taxId: '45-9876543', tenantId: 'test-tenant' },
        include: { 
          address: true, 
          contact: true, 
          bankAccount: true, 
          contacts: { where: { type: 'INDIVIDUAL' } } 
        },
      });
    });

    it('should return null when tax ID not found', async () => {
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      const result = await service.lookupByTaxId('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('lookupByRegistrationNumber', () => {
    it('should find company by registration number', async () => {
      const mockCompany = {
        id: 'comp-1',
        registrationNumber: 'CORP-2024-001',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        contacts: [],
      };

      (mockPrisma.company.findFirst as any).mockResolvedValue(mockCompany);

      const result = await service.lookupByRegistrationNumber('CORP-2024-001', 'test-tenant');

      expect(result).toEqual(mockCompany);
      expect(mockPrisma.company.findFirst).toHaveBeenCalledWith({
        where: { registrationNumber: 'CORP-2024-001', tenantId: 'test-tenant' },
        include: { 
          address: true, 
          contact: true, 
          bankAccount: true, 
          contacts: { where: { type: 'INDIVIDUAL' } } 
        },
      });
    });

    it('should return null when registration number not found', async () => {
      (mockPrisma.company.findFirst as any).mockResolvedValue(null);

      const result = await service.lookupByRegistrationNumber('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });
});

