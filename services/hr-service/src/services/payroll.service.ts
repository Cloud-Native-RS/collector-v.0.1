import { PrismaClient, Payroll, PayrollStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../middleware/error-handler';
import { prisma } from '../index';
import { EventService } from './event.service';
import { IntegrationService } from './integration.service';

const eventService = new EventService();
const integrationService = new IntegrationService();

export interface CreatePayrollInput {
  employeeId: string;
  salaryBase: number;
  bonuses?: number;
  deductions?: number;
  taxes?: number;
  payPeriodStart: Date | string;
  payPeriodEnd: Date | string;
  notes?: string;
}

export interface ProcessPayrollInput {
  employeeIds?: string[];
  payPeriodStart: Date | string;
  payPeriodEnd: Date | string;
  department?: string;
}

/**
 * Payroll Service
 * Manages employee payroll processing
 */
export class PayrollService {
  /**
   * Create payroll record
   */
  static async createPayroll(input: CreatePayrollInput, tenantId: string): Promise<Payroll> {
    // Verify employee exists
    const employee = await prisma.employee.findFirst({
      where: {
        id: input.employeeId,
        tenantId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const payPeriodStart = typeof input.payPeriodStart === 'string' 
      ? new Date(input.payPeriodStart) 
      : input.payPeriodStart;
    const payPeriodEnd = typeof input.payPeriodEnd === 'string' 
      ? new Date(input.payPeriodEnd) 
      : input.payPeriodEnd;

    if (payPeriodEnd <= payPeriodStart) {
      throw new AppError('Pay period end must be after start date', 400);
    }

    const salaryBase = new Decimal(input.salaryBase);
    const bonuses = new Decimal(input.bonuses || 0);
    const deductions = new Decimal(input.deductions || 0);
    const taxes = new Decimal(input.taxes || 0);

    // Calculate net pay
    const grossPay = salaryBase.plus(bonuses);
    const netPay = grossPay.minus(deductions).minus(taxes);

    if (netPay.toNumber() < 0) {
      throw new AppError('Net pay cannot be negative', 400);
    }

    return await prisma.payroll.create({
      data: {
        employeeId: input.employeeId,
        salaryBase,
        bonuses,
        deductions,
        taxes,
        netPay,
        payPeriodStart,
        payPeriodEnd,
        status: PayrollStatus.PENDING,
        notes: input.notes,
        tenantId,
      },
    });
  }

  /**
   * Process payroll for multiple employees
   */
  static async processPayroll(input: ProcessPayrollInput, tenantId: string): Promise<Payroll[]> {
    const payPeriodStart = typeof input.payPeriodStart === 'string' 
      ? new Date(input.payPeriodStart) 
      : input.payPeriodStart;
    const payPeriodEnd = typeof input.payPeriodEnd === 'string' 
      ? new Date(input.payPeriodEnd) 
      : input.payPeriodEnd;

    // Build employee filter
    const employeeWhere: Prisma.EmployeeWhereInput = {
      tenantId,
      endDate: null, // Only active employees
      ...(input.employeeIds && input.employeeIds.length > 0 && {
        id: { in: input.employeeIds },
      }),
      ...(input.department && { department: input.department }),
    };

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      include: {
        salaryInfo: true,
      },
    });

    if (employees.length === 0) {
      throw new AppError('No employees found for payroll processing', 404);
    }

    const payrollRecords: Payroll[] = [];

    for (const employee of employees) {
      // Check if payroll already exists for this period
      const existing = await prisma.payroll.findFirst({
        where: {
          employeeId: employee.id,
          tenantId,
          payPeriodStart,
          payPeriodEnd,
        },
      });

      if (existing) {
        // Update existing record
        const updated = await this.updatePayrollStatus(existing.id, PayrollStatus.PROCESSED, tenantId);
        payrollRecords.push(updated);
      } else {
        // Use employee's salary info if available, otherwise use defaults
        const salaryBase = employee.salaryInfo?.salaryBase || new Decimal(0);
        const bonuses = new Decimal(0);
        const deductions = new Decimal(0);
        const taxes = new Decimal(0);

        const grossPay = salaryBase.plus(bonuses);
        const netPay = grossPay.minus(deductions).minus(taxes);

        const payroll = await prisma.payroll.create({
          data: {
            employeeId: employee.id,
            salaryBase,
            bonuses,
            deductions,
            taxes,
            netPay,
            payPeriodStart,
            payPeriodEnd,
            status: PayrollStatus.PROCESSED,
            tenantId,
          },
        });

        payrollRecords.push(payroll);

        // Emit event
        eventService.emitPayrollProcessed(payroll.id, {
          employeeId: employee.id,
          netPay: payroll.netPay,
          payPeriodStart: payroll.payPeriodStart,
          payPeriodEnd: payroll.payPeriodEnd,
          status: payroll.status,
          tenantId,
        }).catch(console.error);

        // Export to accounting service
        integrationService.exportPayrollToAccounting(payroll).catch(console.error);
      }
    }

    return payrollRecords;
  }

  /**
   * Get payroll by ID
   */
  static async getPayrollById(id: string, tenantId: string): Promise<Payroll | null> {
    return await prisma.payroll.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        employee: {
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
   * Get payroll records for an employee
   */
  static async getEmployeePayroll(employeeId: string, tenantId: string, limit: number = 50): Promise<Payroll[]> {
    return await prisma.payroll.findMany({
      where: {
        employeeId,
        tenantId,
      },
      orderBy: {
        payPeriodStart: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Update payroll status
   */
  static async updatePayrollStatus(id: string, status: PayrollStatus, tenantId: string, paymentDate?: Date): Promise<Payroll> {
    const payroll = await prisma.payroll.findFirst({
      where: { id, tenantId },
    });

    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }

    const updateData: Prisma.PayrollUpdateInput = {
      status,
      ...(paymentDate && { paymentDate }),
    };

    const updated = await prisma.payroll.update({
      where: { id },
      data: updateData,
    });

    // Emit event if processed
    if (status === PayrollStatus.PROCESSED || status === PayrollStatus.PAID) {
      eventService.emitPayrollProcessed(updated.id, {
        employeeId: updated.employeeId,
        netPay: updated.netPay,
        payPeriodStart: updated.payPeriodStart,
        payPeriodEnd: updated.payPeriodEnd,
        status: updated.status,
        tenantId,
      }).catch(console.error);

      integrationService.exportPayrollToAccounting(updated).catch(console.error);
    }

    return updated;
  }

  /**
   * List payroll records with filters
   */
  static async listPayroll(tenantId: string, filters: {
    employeeId?: string;
    status?: PayrollStatus;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.PayrollWhereInput = {
      tenantId,
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.status && { status: filters.status }),
      ...((filters.dateFrom || filters.dateTo) && {
        payPeriodStart: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          payPeriodStart: 'desc',
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.payroll.count({ where }),
    ]);

    return { records, total };
  }
}

