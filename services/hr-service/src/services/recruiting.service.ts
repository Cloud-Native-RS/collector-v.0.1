import { PrismaClient, JobPosting, Applicant, ApplicantStatus, JobPostingStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { prisma } from '../index';
import { EventService } from './event.service';
import { EmployeeService } from './employee.service';

const eventService = new EventService();

export interface CreateJobPostingInput {
  title: string;
  description: string;
  department?: string;
  location?: string;
  status?: JobPostingStatus;
}

export interface UpdateJobPostingInput {
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  status?: JobPostingStatus;
}

export interface CreateApplicantInput {
  jobPostingId: string;
  applicantName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  notes?: string;
}

export interface UpdateApplicantInput {
  status?: ApplicantStatus;
  interviewDate?: Date | string;
  offerDate?: Date | string;
  notes?: string;
}

/**
 * Recruiting Service
 * Manages job postings and applicant tracking
 */
export class RecruitingService {
  /**
   * Create job posting
   */
  static async createJobPosting(input: CreateJobPostingInput, tenantId: string): Promise<JobPosting> {
    return await prisma.jobPosting.create({
      data: {
        title: input.title,
        description: input.description,
        department: input.department,
        location: input.location,
        status: input.status || JobPostingStatus.DRAFT,
        postedDate: input.status === JobPostingStatus.OPEN ? new Date() : null,
        tenantId,
      },
    });
  }

  /**
   * Get job posting by ID
   */
  static async getJobPostingById(id: string, tenantId: string): Promise<JobPosting | null> {
    return await prisma.jobPosting.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        applicants: {
          orderBy: {
            appliedDate: 'desc',
          },
        },
      },
    });
  }

  /**
   * List job postings
   */
  static async listJobPostings(tenantId: string, filters: {
    status?: JobPostingStatus;
    department?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.JobPostingWhereInput = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.department && { department: filters.department }),
    };

    const [postings, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          postedDate: 'desc',
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return { postings, total };
  }

  /**
   * Update job posting
   */
  static async updateJobPosting(id: string, input: UpdateJobPostingInput, tenantId: string): Promise<JobPosting> {
    const posting = await prisma.jobPosting.findFirst({
      where: { id, tenantId },
    });

    if (!posting) {
      throw new AppError('Job posting not found', 404);
    }

    const updateData: Prisma.JobPostingUpdateInput = {
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.department !== undefined && { department: input.department }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.status !== undefined && { 
        status: input.status,
        ...(input.status === JobPostingStatus.OPEN && !posting.postedDate && { postedDate: new Date() }),
        ...(input.status === JobPostingStatus.CLOSED && !posting.closedDate && { closedDate: new Date() }),
      }),
    };

    return await prisma.jobPosting.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Create applicant
   */
  static async createApplicant(input: CreateApplicantInput, tenantId: string): Promise<Applicant> {
    // Verify job posting exists and is open
    const jobPosting = await prisma.jobPosting.findFirst({
      where: {
        id: input.jobPostingId,
        tenantId,
      },
    });

    if (!jobPosting) {
      throw new AppError('Job posting not found', 404);
    }

    if (jobPosting.status !== JobPostingStatus.OPEN) {
      throw new AppError('Job posting is not open for applications', 400);
    }

    return await prisma.applicant.create({
      data: {
        jobPostingId: input.jobPostingId,
        applicantName: input.applicantName,
        email: input.email,
        phone: input.phone,
        resumeUrl: input.resumeUrl,
        status: ApplicantStatus.APPLIED,
        notes: input.notes,
        tenantId,
      },
    });
  }

  /**
   * Get applicant by ID
   */
  static async getApplicantById(id: string, tenantId: string): Promise<Applicant | null> {
    return await prisma.applicant.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
    });
  }

  /**
   * List applicants
   */
  static async listApplicants(tenantId: string, filters: {
    jobPostingId?: string;
    status?: ApplicantStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const where: Prisma.ApplicantWhereInput = {
      tenantId,
      ...(filters.jobPostingId && { jobPostingId: filters.jobPostingId }),
      ...(filters.status && { status: filters.status }),
    };

    const [applicants, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: {
          appliedDate: 'desc',
        },
        include: {
          jobPosting: {
            select: {
              id: true,
              title: true,
              department: true,
            },
          },
        },
      }),
      prisma.applicant.count({ where }),
    ]);

    return { applicants, total };
  }

  /**
   * Update applicant
   */
  static async updateApplicant(id: string, input: UpdateApplicantInput, tenantId: string): Promise<Applicant> {
    const applicant = await prisma.applicant.findFirst({
      where: { id, tenantId },
      include: {
        jobPosting: true,
      },
    });

    if (!applicant) {
      throw new AppError('Applicant not found', 404);
    }

    const interviewDate = input.interviewDate 
      ? (typeof input.interviewDate === 'string' ? new Date(input.interviewDate) : input.interviewDate)
      : undefined;
    const offerDate = input.offerDate
      ? (typeof input.offerDate === 'string' ? new Date(input.offerDate) : input.offerDate)
      : undefined;

    const updateData: Prisma.ApplicantUpdateInput = {
      ...(input.status !== undefined && { status: input.status }),
      ...(interviewDate && { interviewDate }),
      ...(offerDate && { offerDate }),
      ...(input.status === ApplicantStatus.REJECTED && !applicant.rejectedDate && { rejectedDate: new Date() }),
      ...(input.notes !== undefined && { notes: input.notes }),
    };

    const updated = await prisma.applicant.update({
      where: { id },
      data: updateData,
    });

    // If applicant is hired, create employee record and emit event
    if (input.status === ApplicantStatus.HIRED && !applicant.hiredDate) {
      try {
        const hiredDate = new Date();
        await prisma.applicant.update({
          where: { id },
          data: { hiredDate },
        });

        // Create employee from applicant
        // Note: This is a simplified version - in production, you'd collect more employee data
        const employee = await EmployeeService.createEmployee({
          firstName: applicant.applicantName.split(' ')[0] || applicant.applicantName,
          lastName: applicant.applicantName.split(' ').slice(1).join(' ') || '',
          email: applicant.email,
          phone: applicant.phone || undefined,
          jobTitle: applicant.jobPosting.title,
          department: applicant.jobPosting.department || undefined,
          employmentType: 'FULL_TIME',
          startDate: hiredDate,
        }, tenantId);

        // Emit employee.hired event
        await eventService.emitEmployeeHired(employee.id, {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          jobTitle: employee.jobTitle,
          department: employee.department,
          startDate: employee.startDate,
          tenantId,
        });
      } catch (error) {
        console.error('Failed to create employee from hired applicant:', error);
        // Don't fail the applicant update if employee creation fails
      }
    }

    return updated;
  }
}

