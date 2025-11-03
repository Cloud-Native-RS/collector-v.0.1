import { z } from 'zod';

// Employee schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().min(1),
  department: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  managerId: z.string().uuid().optional(),
  salaryInfoId: z.string().uuid().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// Attendance schemas
export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['PRESENT', 'ABSENT', 'ON_LEAVE', 'REMOTE', 'SICK_LEAVE', 'VACATION']).optional(),
  leaveType: z.enum(['VACATION', 'SICK', 'UNPAID', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER']).optional(),
  notes: z.string().optional(),
});

export const checkInSchema = z.object({
  employeeId: z.string().uuid(),
  checkInTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().uuid(),
  checkOutTime: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Payroll schemas
export const createPayrollSchema = z.object({
  employeeId: z.string().uuid(),
  salaryBase: z.number().positive(),
  bonuses: z.number().min(0).optional(),
  deductions: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  payPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export const processPayrollSchema = z.object({
  employeeIds: z.array(z.string().uuid()).optional(),
  payPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  department: z.string().optional(),
});

// Job Posting schemas
export const createJobPostingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT', 'FILLED']).optional(),
});

export const updateJobPostingSchema = createJobPostingSchema.partial();

// Applicant schemas
export const createApplicantSchema = z.object({
  jobPostingId: z.string().uuid(),
  applicantName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  resumeUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const updateApplicantSchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN']).optional(),
  interviewDate: z.string().datetime().optional(),
  offerDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

