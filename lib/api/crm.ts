import { fetchWithAuth } from './client';

// Use Next.js API routes for proxying to CRM service
// In browser, these will be relative URLs that go through Next.js API routes
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_CRM_SERVICE_URL || process.env.CRM_SERVICE_URL || 'http://localhost:3009');

// Types
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadSource = 'WEBSITE' | 'SOCIAL' | 'EMAIL' | 'CALL' | 'REFERRAL' | 'OTHER';
export type TaskType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'FOLLOW_UP';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';

export interface Lead {
  id: string;
  leadNumber: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  companyType?: string;
  tradingName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyRegistrationNumber?: string;
  legalRepName?: string;
  legalRepTitle?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
  source: LeadSource;
  status: LeadStatus;
  value?: number;
  assignedTo?: string;
  notes?: string;
  convertedToCustomerId?: string;
  convertedAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  deals?: Deal[];
  activities?: Activity[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string;
  leadId?: string;
  dealId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  deal?: Deal;
  activities?: Activity[];
}

export interface Deal {
  id: string;
  dealNumber: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  stage: DealStage;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  tasks?: Task[];
  activities?: Activity[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  notes?: string;
  duration?: number;
  leadId?: string;
  dealId?: string;
  taskId?: string;
  userId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  deal?: Deal;
  task?: Task;
}

export interface CreateLeadInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  companyType?: string;
  tradingName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companySize?: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyRegistrationNumber?: string;
  legalRepName?: string;
  legalRepTitle?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  value?: number;
  assignedTo?: string;
  notes?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {}

export interface CreateTaskInput {
  title: string;
  description?: string;
  type: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  leadId?: string;
  dealId?: string;
}

export interface CreateDealInput {
  title: string;
  description?: string;
  value: number;
  probability?: number;
  stage?: DealStage;
  expectedCloseDate?: string;
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
}

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  description?: string;
  notes?: string;
  duration?: number;
  leadId?: string;
  dealId?: string;
  taskId?: string;
}

export interface LeadQueryParams {
  skip?: number;
  take?: number;
  status?: LeadStatus;
  source?: LeadSource;
  assignedTo?: string;
  search?: string;
}

export interface TaskQueryParams {
  skip?: number;
  take?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  leadId?: string;
  dealId?: string;
  assignedTo?: string;
}

export interface DealQueryParams {
  skip?: number;
  take?: number;
  stage?: DealStage;
  assignedTo?: string;
  search?: string;
}

export interface ActivityQueryParams {
  skip?: number;
  take?: number;
  leadId?: string;
  dealId?: string;
  taskId?: string;
  type?: ActivityType;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    skip: number;
    take: number;
  };
}

export interface ConvertLeadInput {
  address?: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  taxId?: string;
  registrationNumber?: string;
}

export interface PipelineStats {
  stages: Array<{
    stage: DealStage;
    count: number;
    value: number;
  }>;
  totalValue: number;
  weightedValue: number;
}

// API Client
class CrmApiClient {
  private baseURL = API_BASE_URL;

  // Leads
  async createLead(data: CreateLeadInput): Promise<Lead> {
    return fetchWithAuth<Lead>(`${this.baseURL}/api/leads`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLeads(params?: LeadQueryParams): Promise<ApiResponse<Lead[]>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = `${this.baseURL}/api/leads${queryString ? `?${queryString}` : ''}`;
    const result = await fetchWithAuth<any>(url);
    // fetchWithAuth unwraps ApiResponse and returns just the data field
    // So if result is an array, it means fetchWithAuth returned data.data
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
      };
    }
    // If result is already ApiResponse format (shouldn't happen but handle it)
    if (result && typeof result === 'object' && 'data' in result && 'success' in result) {
      return result as ApiResponse<Lead[]>;
    }
    // Fallback: return empty array
    return {
      success: true,
      data: [],
    };
  }

  async getLead(id: string): Promise<Lead> {
    return fetchWithAuth<Lead>(`${this.baseURL}/api/leads/${id}`);
  }

  async updateLead(id: string, data: UpdateLeadInput): Promise<Lead> {
    return fetchWithAuth<Lead>(`${this.baseURL}/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string): Promise<void> {
    await fetchWithAuth<void>(`${this.baseURL}/api/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async convertLead(id: string, data?: ConvertLeadInput): Promise<{ lead: Lead; customerId: string; customerNumber: string }> {
    return fetchWithAuth<{ lead: Lead; customerId: string; customerNumber: string }>(
      `${this.baseURL}/api/leads/${id}/convert`,
      {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }
    );
  }

  // Tasks (CRM service tasks - different from project management tasks)
  async createTask(data: CreateTaskInput): Promise<Task> {
    return fetchWithAuth<Task>(`${this.baseURL}/api/crm-tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTasks(params?: TaskQueryParams): Promise<ApiResponse<Task[]>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = `${this.baseURL}/api/crm-tasks${queryString ? `?${queryString}` : ''}`;
    const result = await fetchWithAuth<any>(url);
    // fetchWithAuth unwraps ApiResponse and returns just the data field
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
      };
    }
    if (result && typeof result === 'object' && 'data' in result && 'success' in result) {
      return result as ApiResponse<Task[]>;
    }
    return {
      success: true,
      data: [],
    };
  }

  async getTask(id: string): Promise<Task> {
    return fetchWithAuth<Task>(`${this.baseURL}/api/crm-tasks/${id}`);
  }

  async updateTask(id: string, data: Partial<CreateTaskInput>): Promise<Task> {
    return fetchWithAuth<Task>(`${this.baseURL}/api/crm-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<void> {
    await fetchWithAuth<void>(`${this.baseURL}/api/crm-tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async completeTask(id: string): Promise<Task> {
    return fetchWithAuth<Task>(`${this.baseURL}/api/crm-tasks/${id}/complete`, {
      method: 'PUT',
    });
  }

  // Deals
  async createDeal(data: CreateDealInput): Promise<Deal> {
    return fetchWithAuth<Deal>(`${this.baseURL}/api/deals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeals(params?: DealQueryParams): Promise<ApiResponse<Deal[]>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = `${this.baseURL}/api/deals${queryString ? `?${queryString}` : ''}`;
    const result = await fetchWithAuth<any>(url);
    // fetchWithAuth unwraps ApiResponse and returns just the data field
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
      };
    }
    if (result && typeof result === 'object' && 'data' in result && 'success' in result) {
      return result as ApiResponse<Deal[]>;
    }
    return {
      success: true,
      data: [],
    };
  }

  async getDeal(id: string): Promise<Deal> {
    return fetchWithAuth<Deal>(`${this.baseURL}/api/deals/${id}`);
  }

  async updateDeal(id: string, data: Partial<CreateDealInput>): Promise<Deal> {
    return fetchWithAuth<Deal>(`${this.baseURL}/api/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeal(id: string): Promise<void> {
    await fetchWithAuth<void>(`${this.baseURL}/api/deals/${id}`, {
      method: 'DELETE',
    });
  }

  async updateDealStage(id: string, stage: DealStage, lostReason?: string): Promise<Deal> {
    return fetchWithAuth<Deal>(`${this.baseURL}/api/deals/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage, lostReason }),
    });
  }

  // Activities
  async createActivity(data: CreateActivityInput): Promise<Activity> {
    return fetchWithAuth<Activity>(`${this.baseURL}/api/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getActivities(params?: ActivityQueryParams): Promise<ApiResponse<Activity[]>> {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    const url = `${this.baseURL}/api/activities${queryString ? `?${queryString}` : ''}`;
    const result = await fetchWithAuth<any>(url);
    // fetchWithAuth unwraps ApiResponse and returns just the data field
    if (Array.isArray(result)) {
      return {
        success: true,
        data: result,
      };
    }
    if (result && typeof result === 'object' && 'data' in result && 'success' in result) {
      return result as ApiResponse<Activity[]>;
    }
    return {
      success: true,
      data: [],
    };
  }

  async getActivity(id: string): Promise<Activity> {
    return fetchWithAuth<Activity>(`${this.baseURL}/api/activities/${id}`);
  }

  // Analytics
  async getPipelineStats(): Promise<PipelineStats> {
    return fetchWithAuth<PipelineStats>(`${this.baseURL}/api/analytics/pipeline`);
  }

  async getLeadsBySource(): Promise<{ bySource: Record<LeadSource, number> }> {
    return fetchWithAuth<{ bySource: Record<LeadSource, number> }>(
      `${this.baseURL}/api/analytics/leads-by-source`
    );
  }

  async getConversionRate(): Promise<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    byStatus: Record<LeadStatus, number>;
  }> {
    return fetchWithAuth<{
      totalLeads: number;
      convertedLeads: number;
      conversionRate: number;
      byStatus: Record<LeadStatus, number>;
    }>(`${this.baseURL}/api/analytics/conversion-rate`);
  }

  async getDealsByStage(): Promise<{
    stages: Array<{ stage: DealStage; count: number; value: number }>;
    totalValue: number;
    weightedValue: number;
  }> {
    return fetchWithAuth<{
      stages: Array<{ stage: DealStage; count: number; value: number }>;
      totalValue: number;
      weightedValue: number;
    }>(`${this.baseURL}/api/analytics/deals-by-stage`);
  }
}

export const crmApi = new CrmApiClient();

