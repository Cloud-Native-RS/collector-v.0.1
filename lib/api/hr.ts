// HR Service API Client

const API_BASE_URL = process.env.NEXT_PUBLIC_HR_SERVICE_URL || 'http://localhost:3006';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-tenant-id': tenantId,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'An error occurred' } }));
    throw new Error(error.error?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Employee Types
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  department?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN' | 'TEMPORARY';
  startDate: string;
  endDate?: string;
  managerId?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  directReports?: Employee[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  department?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN' | 'TEMPORARY';
  startDate: string;
  endDate?: string;
  managerId?: string;
  salaryInfoId?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {}

// Attendance Types
export interface Attendance {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
  };
  checkInTime?: string;
  checkOutTime?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'REMOTE' | 'SICK_LEAVE' | 'VACATION';
  leaveType?: 'VACATION' | 'SICK' | 'UNPAID' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceInput {
  employeeId: string;
  checkInTime?: string;
  checkOutTime?: string;
  date: string;
  status?: 'PRESENT' | 'ABSENT' | 'ON_LEAVE' | 'REMOTE' | 'SICK_LEAVE' | 'VACATION';
  leaveType?: 'VACATION' | 'SICK' | 'UNPAID' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
  notes?: string;
}

// Payroll Types
export interface Payroll {
  id: string;
  employeeId: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  salaryBase: number;
  bonuses: number;
  deductions: number;
  taxes: number;
  netPay: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  status: 'PENDING' | 'PROCESSED' | 'PAID' | 'CANCELLED';
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollInput {
  employeeId: string;
  salaryBase: number;
  bonuses?: number;
  deductions?: number;
  taxes?: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  notes?: string;
}

export interface ProcessPayrollInput {
  employeeIds?: string[];
  payPeriodStart: string;
  payPeriodEnd: string;
  department?: string;
}

// Recruiting Types
export interface JobPosting {
  id: string;
  title: string;
  description: string;
  department?: string;
  location?: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT' | 'FILLED';
  postedDate?: string;
  closedDate?: string;
  applicants?: Applicant[];
  createdAt: string;
  updatedAt: string;
}

export interface Applicant {
  id: string;
  jobPostingId: string;
  jobPosting?: {
    id: string;
    title: string;
    department?: string;
  };
  applicantName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
  appliedDate: string;
  interviewDate?: string;
  offerDate?: string;
  hiredDate?: string;
  rejectedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingInput {
  title: string;
  description: string;
  department?: string;
  location?: string;
  status?: 'OPEN' | 'CLOSED' | 'DRAFT' | 'FILLED';
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
  status?: 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
  interviewDate?: string;
  offerDate?: string;
  notes?: string;
}

// Employee API
export const employeesApi = {
  async list(filters?: {
    department?: string;
    employmentType?: string;
    managerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Employee[]; meta: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/employees${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Employee }> {
    return fetchWithAuth(`/api/employees/${id}`);
  },

  async create(input: CreateEmployeeInput): Promise<{ success: boolean; data: Employee }> {
    return fetchWithAuth('/api/employees', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateEmployeeInput): Promise<{ success: boolean; data: Employee }> {
    return fetchWithAuth(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<{ success: boolean; message: string; data: Employee }> {
    return fetchWithAuth(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  },
};

// Attendance API
export const attendanceApi = {
  async list(filters?: {
    employeeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Attendance[]; meta: { total: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/attendance${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Attendance }> {
    return fetchWithAuth(`/api/attendance/${id}`);
  },

  async create(input: CreateAttendanceInput): Promise<{ success: boolean; data: Attendance }> {
    return fetchWithAuth('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async checkIn(employeeId: string, checkInTime?: string): Promise<{ success: boolean; data: Attendance }> {
    return fetchWithAuth('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId, checkInTime }),
    });
  },

  async checkOut(employeeId: string, checkOutTime?: string): Promise<{ success: boolean; data: Attendance }> {
    return fetchWithAuth('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ employeeId, checkOutTime }),
    });
  },
};

// Payroll API
export const payrollApi = {
  async list(filters?: {
    employeeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Payroll[]; meta: { total: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/payroll${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Payroll }> {
    return fetchWithAuth(`/api/payroll/${id}`);
  },

  async getByEmployee(employeeId: string): Promise<{ success: boolean; data: Payroll[] }> {
    return fetchWithAuth(`/api/payroll/employee/${employeeId}`);
  },

  async create(input: CreatePayrollInput): Promise<{ success: boolean; data: Payroll }> {
    return fetchWithAuth('/api/payroll', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async process(input: ProcessPayrollInput): Promise<{ success: boolean; data: Payroll[]; count: number }> {
    return fetchWithAuth('/api/payroll/process', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

// Recruiting API
export const recruitingApi = {
  // Job Postings
  async listJobPostings(filters?: {
    status?: string;
    department?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: JobPosting[]; meta: { total: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/recruiting/job-postings${queryString ? `?${queryString}` : ''}`);
  },

  async getJobPostingById(id: string): Promise<{ success: boolean; data: JobPosting }> {
    return fetchWithAuth(`/api/recruiting/job-postings/${id}`);
  },

  async createJobPosting(input: CreateJobPostingInput): Promise<{ success: boolean; data: JobPosting }> {
    return fetchWithAuth('/api/recruiting/job-postings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Applicants
  async listApplicants(filters?: {
    jobPostingId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Applicant[]; meta: { total: number } }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/recruiting/applicants${queryString ? `?${queryString}` : ''}`);
  },

  async getApplicantById(id: string): Promise<{ success: boolean; data: Applicant }> {
    return fetchWithAuth(`/api/recruiting/applicants/${id}`);
  },

  async createApplicant(input: CreateApplicantInput): Promise<{ success: boolean; data: Applicant }> {
    return fetchWithAuth('/api/recruiting/applicants', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateApplicant(id: string, input: UpdateApplicantInput): Promise<{ success: boolean; data: Applicant }> {
    return fetchWithAuth(`/api/recruiting/applicants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },
};

