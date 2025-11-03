import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { CustomerService } from '../customer.service';
import { AppError } from '../../middleware/error-handler';

// Mock Prisma Client
const mockPrisma = {
  customer: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
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

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerService(mockPrisma);
  });

  describe('create', () => {
    const validIndividualData = {
      type: 'INDIVIDUAL' as const,
      firstName: 'John',
      lastName: 'Doe',
      title: 'Mr',
      department: 'Sales',
      companyId: 'company-123',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      taxId: '12-3456789',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      contact: {
        email: 'john.doe@example.com',
        phone: '+1234567890',
      },
      tenantId: 'test-tenant',
    };

    const validCompanyData = {
      type: 'COMPANY' as const,
      companyName: 'Acme Corp',
      email: 'info@acme.com',
      phone: '+1234567890',
      taxId: '98-7654321',
      address: {
        street: '456 Oak Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'US',
      },
      contact: {
        email: 'info@acme.com',
        phone: '+1234567890',
      },
      tenantId: 'test-tenant',
    };

    it('should create an INDIVIDUAL customer with valid data', async () => {
      const mockAddress = { id: 'addr-1', ...validIndividualData.address };
      const mockContact = { id: 'cont-1', ...validIndividualData.contact };
      const mockCustomer = {
        id: 'cust-1',
        customerNumber: 'CUST-ABC123',
        status: 'ACTIVE',
        ...validIndividualData,
        address: mockAddress,
        contact: mockContact,
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findUnique as any).mockResolvedValue(null);
      (mockPrisma.address.create as any).mockResolvedValue(mockAddress);
      (mockPrisma.contact.create as any).mockResolvedValue(mockContact);
      (mockPrisma.customer.create as any).mockResolvedValue(mockCustomer);

      const result = await service.create(validIndividualData);

      expect(result).toBeDefined();
      expect(result.id).toBe('cust-1');
      expect(result.customerNumber).toBe('CUST-ABC123');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(mockPrisma.customer.create).toHaveBeenCalled();
    });

    it('should create a COMPANY customer with valid data', async () => {
      const mockAddress = { id: 'addr-2', ...validCompanyData.address };
      const mockContact = { id: 'cont-2', ...validCompanyData.contact };
      const mockCustomer = {
        id: 'cust-2',
        customerNumber: 'CUST-XYZ789',
        status: 'ACTIVE',
        ...validCompanyData,
        address: mockAddress,
        contact: mockContact,
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findUnique as any).mockResolvedValue(null);
      (mockPrisma.address.create as any).mockResolvedValue(mockAddress);
      (mockPrisma.contact.create as any).mockResolvedValue(mockContact);
      (mockPrisma.customer.create as any).mockResolvedValue(mockCustomer);

      const result = await service.create(validCompanyData);

      expect(result).toBeDefined();
      expect(result.id).toBe('cust-2');
      expect(result.customerNumber).toBe('CUST-XYZ789');
      expect(result.companyName).toBe('Acme Corp');
      expect(mockPrisma.customer.create).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      const existingCustomer = { id: 'cust-existing', email: validIndividualData.email };
      
      (mockPrisma.customer.findUnique as any).mockResolvedValue(existingCustomer);

      await expect(service.create(validIndividualData)).rejects.toThrow(AppError);
      await expect(service.create(validIndividualData)).rejects.toThrow('email already exists');
    });

    it('should reject duplicate tax ID', async () => {
      (mockPrisma.customer.findUnique as any)
        .mockResolvedValueOnce(null) // Email check passes
        .mockResolvedValueOnce({ id: 'cust-existing', taxId: validIndividualData.taxId }); // Tax ID exists

      await expect(service.create(validIndividualData)).rejects.toThrow(AppError);
      await expect(service.create(validIndividualData)).rejects.toThrow('Tax ID already exists');
    });

    it('should reject invalid tax ID format', async () => {
      const invalidData = { ...validIndividualData, taxId: '123' };
      
      (mockPrisma.customer.findUnique as any).mockResolvedValue(null);

      await expect(service.create(invalidData)).rejects.toThrow(AppError);
    });

    it('should include bank account when provided', async () => {
      const dataWithBank = {
        ...validIndividualData,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123456789',
          routingNumber: '987654321',
          iban: 'GB82WEST12345698765432',
          swift: 'DEUTDEFF',
        },
      };

      const mockAddress = { id: 'addr-3', ...dataWithBank.address };
      const mockContact = { id: 'cont-3', ...dataWithBank.contact };
      const mockBankAccount = { id: 'bank-1', ...dataWithBank.bankAccount };
      const mockCustomer = {
        id: 'cust-3',
        customerNumber: 'CUST-DEF456',
        status: 'ACTIVE',
        ...dataWithBank,
        address: mockAddress,
        contact: mockContact,
        bankAccount: mockBankAccount,
        company: null,
      };

      (mockPrisma.customer.findUnique as any).mockResolvedValue(null);
      (mockPrisma.address.create as any).mockResolvedValue(mockAddress);
      (mockPrisma.contact.create as any).mockResolvedValue(mockContact);
      (mockPrisma.bankAccount.create as any).mockResolvedValue(mockBankAccount);
      (mockPrisma.customer.create as any).mockResolvedValue(mockCustomer);

      const result = await service.create(dataWithBank);

      expect(mockPrisma.bankAccount.create).toHaveBeenCalled();
      expect(result.bankAccount).toBeDefined();
    });
  });

  describe('getById', () => {
    it('should return customer by id and tenant', async () => {
      const mockCustomer = {
        id: 'cust-1',
        customerNumber: 'CUST-ABC123',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

      const result = await service.getById('cust-1', 'test-tenant');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'cust-1', tenantId: 'test-tenant' },
        include: { address: true, contact: true, bankAccount: true, company: true },
      });
    });

    it('should return null for non-existent customer', async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);

      const result = await service.getById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return all customers for tenant', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          customerNumber: 'CUST-001',
          firstName: 'John',
          lastName: 'Doe',
          tenantId: 'test-tenant',
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          company: null,
        },
        {
          id: 'cust-2',
          customerNumber: 'CUST-002',
          firstName: 'Jane',
          lastName: 'Smith',
          tenantId: 'test-tenant',
          address: { id: 'addr-2' },
          contact: { id: 'cont-2' },
          bankAccount: null,
          company: null,
        },
      ];

      (mockPrisma.customer.findMany as any).mockResolvedValue(mockCustomers);

      const result = await service.getAll('test-tenant');

      expect(result).toEqual(mockCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant' },
        skip: 0,
        take: 50,
        include: { address: true, contact: true, bankAccount: true, company: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by type when provided', async () => {
      const mockIndividualCustomers = [
        {
          id: 'cust-1',
          customerNumber: 'CUST-001',
          type: 'INDIVIDUAL',
          tenantId: 'test-tenant',
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          company: null,
        },
      ];

      (mockPrisma.customer.findMany as any).mockResolvedValue(mockIndividualCustomers);

      const result = await service.getAll('test-tenant', 0, 50, 'INDIVIDUAL');

      expect(result).toEqual(mockIndividualCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant', type: 'INDIVIDUAL' },
        skip: 0,
        take: 50,
        include: { address: true, contact: true, bankAccount: true, company: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status when provided', async () => {
      const mockActiveCustomers = [
        {
          id: 'cust-1',
          customerNumber: 'CUST-001',
          status: 'ACTIVE',
          tenantId: 'test-tenant',
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          company: null,
        },
      ];

      (mockPrisma.customer.findMany as any).mockResolvedValue(mockActiveCustomers);

      const result = await service.getAll('test-tenant', 0, 50, undefined, 'ACTIVE');

      expect(result).toEqual(mockActiveCustomers);
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'test-tenant', status: 'ACTIVE' },
        skip: 0,
        take: 50,
        include: { address: true, contact: true, bankAccount: true, company: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should ensure all fields are explicitly set', async () => {
      const mockCustomers = [
        {
          id: 'cust-1',
          customerNumber: 'CUST-001',
          tenantId: 'test-tenant',
          companyId: undefined,
          department: undefined,
          title: undefined,
          companyName: undefined,
          address: { id: 'addr-1' },
          contact: { id: 'cont-1' },
          bankAccount: null,
          company: null,
        },
      ];

      (mockPrisma.customer.findMany as any).mockResolvedValue(mockCustomers);

      const result = await service.getAll('test-tenant');

      expect(result[0].companyId).toBeNull();
      expect(result[0].department).toBeNull();
      expect(result[0].title).toBeNull();
      expect(result[0].companyName).toBeNull();
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const existingCustomer = {
        id: 'cust-1',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        company: null,
      };

      const updatedCustomer = {
        ...existingCustomer,
        firstName: 'Johnny',
        department: 'Engineering',
      };

      (mockPrisma.customer.findFirst as any).mockResolvedValue(existingCustomer);
      (mockPrisma.customer.update as any).mockResolvedValue(updatedCustomer);

      const result = await service.update('cust-1', 'test-tenant', {
        firstName: 'Johnny',
        department: 'Engineering',
      });

      expect(result.firstName).toBe('Johnny');
      expect(result.department).toBe('Engineering');
      expect(mockPrisma.customer.update).toHaveBeenCalled();
    });

    it('should throw error if customer not found', async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'test-tenant', { firstName: 'John' })
      ).rejects.toThrow(AppError);
      await expect(
        service.update('non-existent', 'test-tenant', { firstName: 'John' })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      const existingCustomer = {
        id: 'cust-1',
        firstName: 'John',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findFirst as any).mockResolvedValue(existingCustomer);
      (mockPrisma.customer.delete as any).mockResolvedValue(existingCustomer);

      await service.delete('cust-1', 'test-tenant');

      expect(mockPrisma.customer.delete).toHaveBeenCalledWith({ where: { id: 'cust-1' } });
    });

    it('should throw error if customer not found', async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);

      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow(AppError);
      await expect(service.delete('non-existent', 'test-tenant')).rejects.toThrow('Customer not found');
    });
  });

  describe('lookupByTaxId', () => {
    it('should find customer by tax ID', async () => {
      const mockCustomer = {
        id: 'cust-1',
        taxId: '12-3456789',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

      const result = await service.lookupByTaxId('12-3456789', 'test-tenant');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { taxId: '12-3456789', tenantId: 'test-tenant' },
        include: { address: true, contact: true, bankAccount: true, company: true },
      });
    });

    it('should return null when tax ID not found', async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);

      const result = await service.lookupByTaxId('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('lookupByEmail', () => {
    it('should find customer by email', async () => {
      const mockCustomer = {
        id: 'cust-1',
        email: 'john@example.com',
        tenantId: 'test-tenant',
        address: { id: 'addr-1' },
        contact: { id: 'cont-1' },
        bankAccount: null,
        company: null,
      };

      (mockPrisma.customer.findFirst as any).mockResolvedValue(mockCustomer);

      const result = await service.lookupByEmail('john@example.com', 'test-tenant');

      expect(result).toEqual(mockCustomer);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { email: 'john@example.com', tenantId: 'test-tenant' },
        include: { address: true, contact: true, bankAccount: true, company: true },
      });
    });

    it('should return null when email not found', async () => {
      (mockPrisma.customer.findFirst as any).mockResolvedValue(null);

      const result = await service.lookupByEmail('notfound@example.com', 'test-tenant');

      expect(result).toBeNull();
    });
  });
});

