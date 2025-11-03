import { PrismaClient, Employee, EmploymentType, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { prisma } from '../index';

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  department?: string;
  employmentType: EmploymentType;
  startDate: Date | string;
  endDate?: Date | string;
  managerId?: string;
  salaryInfoId?: string;
}

export interface UpdateEmployeeInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  employmentType?: EmploymentType;
  startDate?: Date | string;
  endDate?: Date | string;
  managerId?: string;
  salaryInfoId?: string;
}

export interface EmployeeFilters {
  department?: string;
  employmentType?: EmploymentType;
  managerId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Employee Service
 * Manages employee lifecycle and data
 */
export class EmployeeService {
  /**
   * Create a new employee
   */
  static async createEmployee(input: CreateEmployeeInput, tenantId: string): Promise<Employee> {
    // Check if email already exists for this tenant
    const existingEmployee = await prisma.employee.findUnique({
      where: { email: input.email },
    });

    if (existingEmployee && existingEmployee.tenantId === tenantId) {
      throw new AppError('Employee with this email already exists', 400);
    }

    // Validate manager if provided
    if (input.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: input.managerId,
          tenantId,
        },
      });

      if (!manager) {
        throw new AppError('Manager not found', 404);
      }
    }

    const startDate = typeof input.startDate === 'string' ? new Date(input.startDate) : input.startDate;
    const endDate = input.endDate ? (typeof input.endDate === 'string' ? new Date(input.endDate) : input.endDate) : null;

    return await prisma.employee.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        jobTitle: input.jobTitle,
        department: input.department,
        employmentType: input.employmentType,
        startDate,
        endDate,
        managerId: input.managerId,
        salaryInfoId: input.salaryInfoId,
        tenantId,
      },
    });
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string, tenantId: string): Promise<Employee | null> {
    return await prisma.employee.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        directReports: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
          },
        },
      },
    });
  }

  /**
   * List employees with filters
   */
  static async listEmployees(tenantId: string, filters: EmployeeFilters = {}) {
    const where: Prisma.EmployeeWhereInput = {
      tenantId,
      ...(filters.department && { department: filters.department }),
      ...(filters.employmentType && { employmentType: filters.employmentType }),
      ...(filters.managerId && { managerId: filters.managerId }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  }

  /**
   * Update employee
   */
  static async updateEmployee(id: string, input: UpdateEmployeeInput, tenantId: string): Promise<Employee> {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Validate manager if being updated
    if (input.managerId && input.managerId !== employee.managerId) {
      const manager = await prisma.employee.findFirst({
        where: {
          id: input.managerId,
          tenantId,
        },
      });

      if (!manager) {
        throw new AppError('Manager not found', 404);
      }

      // Prevent circular manager references
      if (input.managerId === id) {
        throw new AppError('Employee cannot be their own manager', 400);
      }
    }

    // Validate email uniqueness if being updated
    if (input.email && input.email !== employee.email) {
      const existingEmployee = await prisma.employee.findUnique({
        where: { email: input.email },
      });

      if (existingEmployee && existingEmployee.tenantId === tenantId && existingEmployee.id !== id) {
        throw new AppError('Employee with this email already exists', 400);
      }
    }

    const updateData: Prisma.EmployeeUpdateInput = {
      ...(input.firstName && { firstName: input.firstName }),
      ...(input.lastName && { lastName: input.lastName }),
      ...(input.email && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.jobTitle && { jobTitle: input.jobTitle }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.employmentType && { employmentType: input.employmentType }),
      ...(input.startDate && { startDate: typeof input.startDate === 'string' ? new Date(input.startDate) : input.startDate }),
      ...(input.endDate !== undefined && { 
        endDate: input.endDate ? (typeof input.endDate === 'string' ? new Date(input.endDate) : input.endDate) : null 
      }),
      ...(input.managerId !== undefined && { managerId: input.managerId }),
      ...(input.salaryInfoId !== undefined && { salaryInfoId: input.salaryInfoId }),
    };

    return await prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete employee (soft delete by setting endDate)
   */
  static async deleteEmployee(id: string, tenantId: string): Promise<Employee> {
    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Soft delete by setting endDate
    return await prisma.employee.update({
      where: { id },
      data: {
        endDate: new Date(),
      },
    });
  }

  /**
   * Get employees by department
   */
  static async getEmployeesByDepartment(department: string, tenantId: string): Promise<Employee[]> {
    return await prisma.employee.findMany({
      where: {
        department,
        tenantId,
        endDate: null, // Only active employees
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * Get direct reports for a manager
   */
  static async getDirectReports(managerId: string, tenantId: string): Promise<Employee[]> {
    return await prisma.employee.findMany({
      where: {
        managerId,
        tenantId,
        endDate: null, // Only active employees
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }
}

