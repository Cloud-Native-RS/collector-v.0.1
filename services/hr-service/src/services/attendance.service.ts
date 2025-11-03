import { PrismaClient, Attendance, AttendanceStatus, LeaveType, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { prisma } from '../index';
import { EventService } from './event.service';

const eventService = new EventService();

export interface CreateAttendanceInput {
  employeeId: string;
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
  date: Date | string;
  status?: AttendanceStatus;
  leaveType?: LeaveType;
  notes?: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  status?: AttendanceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Attendance Service
 * Manages employee attendance tracking
 */
export class AttendanceService {
  /**
   * Create or update attendance record
   */
  static async createAttendance(input: CreateAttendanceInput, tenantId: string): Promise<Attendance> {
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

    const date = typeof input.date === 'string' ? new Date(input.date) : input.date;
    const checkInTime = input.checkInTime ? (typeof input.checkInTime === 'string' ? new Date(input.checkInTime) : input.checkInTime) : null;
    const checkOutTime = input.checkOutTime ? (typeof input.checkOutTime === 'string' ? new Date(input.checkOutTime) : input.checkOutTime) : null;

    // Check if attendance already exists for this date
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date_tenantId: {
          employeeId: input.employeeId,
          date: date,
          tenantId,
        },
      },
    });

    if (existing) {
      // Update existing record
      return await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime,
          checkOutTime,
          status: input.status || existing.status,
          leaveType: input.leaveType || existing.leaveType,
          notes: input.notes || existing.notes,
        },
      });
    }

    // Create new record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: input.employeeId,
        checkInTime,
        checkOutTime,
        date,
        status: input.status || AttendanceStatus.PRESENT,
        leaveType: input.leaveType,
        notes: input.notes,
        tenantId,
      },
    });

    // Emit event if attendance is missed (absent without leave)
    if (attendance.status === AttendanceStatus.ABSENT && !attendance.leaveType) {
      eventService.emitAttendanceMissed(input.employeeId, {
        date: attendance.date,
        status: attendance.status,
        tenantId,
      }).catch(console.error);
    }

    return attendance;
  }

  /**
   * Check in an employee
   */
  static async checkIn(employeeId: string, checkInTime?: Date | string, tenantId?: string, notes?: string): Promise<Attendance> {
    if (!tenantId) {
      throw new AppError('Tenant context required', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = checkInTime ? (typeof checkInTime === 'string' ? new Date(checkInTime) : checkInTime) : new Date();

    // Check if attendance already exists for today
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date_tenantId: {
          employeeId,
          date: today,
          tenantId,
        },
      },
    });

    if (existing) {
      // Update with check-in time
      return await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime: checkIn,
          status: AttendanceStatus.PRESENT,
        },
      });
    }

    // Create new attendance record
    return await prisma.attendance.create({
      data: {
        employeeId,
        checkInTime: checkIn,
        date: today,
        status: AttendanceStatus.PRESENT,
        notes,
        tenantId,
      },
    });
  }

  /**
   * Check out an employee
   */
  static async checkOut(employeeId: string, checkOutTime?: Date | string, tenantId?: string, notes?: string): Promise<Attendance> {
    if (!tenantId) {
      throw new AppError('Tenant context required', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkOut = checkOutTime ? (typeof checkOutTime === 'string' ? new Date(checkOutTime) : checkOutTime) : new Date();

    // Find today's attendance
    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date_tenantId: {
          employeeId,
          date: today,
          tenantId,
        },
      },
    });

    if (!attendance) {
      throw new AppError('No check-in record found for today', 404);
    }

    return await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: checkOut,
        notes: notes || attendance.notes,
      },
    });
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(id: string, tenantId: string): Promise<Attendance | null> {
    return await prisma.attendance.findFirst({
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
   * List attendance records with filters
   */
  static async listAttendance(tenantId: string, filters: AttendanceFilters = {}) {
    const where: Prisma.AttendanceWhereInput = {
      tenantId,
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.status && { status: filters.status }),
      ...((filters.dateFrom || filters.dateTo) && {
        date: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          date: 'desc',
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
      }),
      prisma.attendance.count({ where }),
    ]);

    return { records, total };
  }

  /**
   * Get employee attendance summary
   */
  static async getEmployeeAttendanceSummary(employeeId: string, dateFrom: Date, dateTo: Date, tenantId: string) {
    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        tenantId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
    });

    const summary = {
      totalDays: records.length,
      present: records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.REMOTE).length,
      absent: records.filter(r => r.status === AttendanceStatus.ABSENT).length,
      onLeave: records.filter(r => r.status === AttendanceStatus.ON_LEAVE || r.leaveType !== null).length,
      remote: records.filter(r => r.status === AttendanceStatus.REMOTE).length,
    };

    return summary;
  }
}

