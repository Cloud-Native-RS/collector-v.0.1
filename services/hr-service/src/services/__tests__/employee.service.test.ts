import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient, EmploymentType } from '@prisma/client';
import { EmployeeService } from '../employee.service';
import { AppError } from '../../middleware/error-handler';
import * as prismaModule from '../../index';

// Mock prisma module
vi.mock('../../index', () => ({
  prisma: {
    employee: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockPrisma = prismaModule.prisma as unknown as PrismaClient;

describe('EmployeeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createEmployee', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      jobTitle: 'Software Engineer',
      department: 'Engineering',
      employmentType: EmploymentType.FULL_TIME,
      startDate: new Date(),
    };

    it('should create an employee with valid data', async () => {
      const mockEmployee = {
        id: 'emp-1',
        employeeId: 'EMP001',
        ...validInput,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantId: 'test-tenant',
        endDate: null,
        managerId: null,
        salaryInfoId: null,
      };

      (mockPrisma.employee.findUnique as any).mockResolvedValue(null);
      (mockPrisma.employee.create as any).mockResolvedValue(mockEmployee);

      const result = await EmployeeService.createEmployee(validInput, 'test-tenant');

      expect(result).toBeDefined();
      expect(result.id).toBe('emp-1');
      expect(mockPrisma.employee.create).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      const existingEmployee = {
        id: 'emp-existing',
        email: validInput.email,
        tenantId: 'test-tenant',
      };

      (mockPrisma.employee.findUnique as any).mockResolvedValue(existingEmployee);

      await expect(
        EmployeeService.createEmployee(validInput, 'test-tenant')
      ).rejects.toThrow(AppError);
      await expect(
        EmployeeService.createEmployee(validInput, 'test-tenant')
      ).rejects.toThrow('email already exists');
    });

    it('should validate manager exists', async () => {
      const inputWithManager = {
        ...validInput,
        managerId: 'manager-1',
      };

      (mockPrisma.employee.findUnique as any).mockResolvedValue(null);
      (mockPrisma.employee.findFirst as any).mockResolvedValue(null);

      await expect(
        EmployeeService.createEmployee(inputWithManager, 'test-tenant')
      ).rejects.toThrow(AppError);
      await expect(
        EmployeeService.createEmployee(inputWithManager, 'test-tenant')
      ).rejects.toThrow('Manager not found');
    });

    it('should accept valid manager', async () => {
      const inputWithManager = {
        ...validInput,
        managerId: 'manager-1',
      };

      const mockManager = {
        id: 'manager-1',
        tenantId: 'test-tenant',
      };

      const mockEmployee = {
        id: 'emp-1',
        ...inputWithManager,
        tenantId: 'test-tenant',
      };

      (mockPrisma.employee.findUnique as any).mockResolvedValue(null);
      (mockPrisma.employee.findFirst as any).mockResolvedValue(mockManager);
      (mockPrisma.employee.create as any).mockResolvedValue(mockEmployee);

      const result = await EmployeeService.createEmployee(inputWithManager, 'test-tenant');

      expect(result).toBeDefined();
    });
  });

  describe('getEmployeeById', () => {
    it('should return employee by id and tenant', async () => {
      const mockEmployee = {
        id: 'emp-1',
        firstName: 'John',
        lastName: 'Doe',
        tenantId: 'test-tenant',
        manager: null,
        directReports: [],
      };

      (mockPrisma.employee.findFirst as any).mockResolvedValue(mockEmployee);

      const result = await EmployeeService.getEmployeeById('emp-1', 'test-tenant');

      expect(result).toEqual(mockEmployee);
    });

    it('should return null for non-existent employee', async () => {
      (mockPrisma.employee.findFirst as any).mockResolvedValue(null);

      const result = await EmployeeService.getEmployeeById('non-existent', 'test-tenant');

      expect(result).toBeNull();
    });
  });

  describe('updateEmployee', () => {
    it('should update employee successfully', async () => {
      const existingEmployee = {
        id: 'emp-1',
        firstName: 'John',
        email: 'john@example.com',
        tenantId: 'test-tenant',
      };

      const updatedEmployee = {
        ...existingEmployee,
        firstName: 'Johnny',
      };

      (mockPrisma.employee.findFirst as any)
        .mockResolvedValueOnce(existingEmployee)
        .mockResolvedValueOnce(existingEmployee);
      (mockPrisma.employee.update as any).mockResolvedValue(updatedEmployee);

      const result = await EmployeeService.updateEmployee(
        'emp-1',
        { firstName: 'Johnny' },
        'test-tenant'
      );

      expect(result.firstName).toBe('Johnny');
    });

    it('should prevent employee being their own manager', async () => {
      const existingEmployee = {
        id: 'emp-1',
        tenantId: 'test-tenant',
      };

      (mockPrisma.employee.findFirst as any).mockResolvedValue(existingEmployee);

      await expect(
        EmployeeService.updateEmployee('emp-1', { managerId: 'emp-1' }, 'test-tenant')
      ).rejects.toThrow(AppError);
      await expect(
        EmployeeService.updateEmployee('emp-1', { managerId: 'emp-1' }, 'test-tenant')
      ).rejects.toThrow('cannot be their own manager');
    });
  });

  describe('deleteEmployee', () => {
    it('should soft delete employee by setting endDate', async () => {
      const existingEmployee = {
        id: 'emp-1',
        firstName: 'John',
        tenantId: 'test-tenant',
      };

      const deletedEmployee = {
        ...existingEmployee,
        endDate: new Date(),
      };

      (mockPrisma.employee.findFirst as any).mockResolvedValue(existingEmployee);
      (mockPrisma.employee.update as any).mockResolvedValue(deletedEmployee);

      const result = await EmployeeService.deleteEmployee('emp-1', 'test-tenant');

      expect(result.endDate).toBeDefined();
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endDate: expect.any(Date),
          }),
        })
      );
    });
  });
});

