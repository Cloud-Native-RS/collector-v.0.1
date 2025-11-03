import axios, { AxiosInstance } from 'axios';

export interface CreateCustomerRequest {
  type: 'INDIVIDUAL' | 'COMPANY';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone?: string;
  taxId: string;
  registrationNumber?: string;
  address: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    iban?: string;
    swift?: string;
  };
}

export interface CreateCustomerResponse {
  success: boolean;
  data: {
    id: string;
    customerNumber: string;
    email: string;
    [key: string]: any;
  };
}

export class RegistryClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.REGISTRY_SERVICE_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set tenant ID for API requests
   */
  setTenantId(tenantId: string): void {
    this.client.defaults.headers.common['x-tenant-id'] = tenantId;
  }

  /**
   * Create a customer in the Registry Service
   */
  async createCustomer(data: CreateCustomerRequest, token?: string, tenantId?: string): Promise<CreateCustomerResponse> {
    const config: any = {};

    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    if (tenantId) {
      config.headers = {
        ...config.headers,
        'x-tenant-id': tenantId,
      };
    }

    try {
      const response = await this.client.post<CreateCustomerResponse>('/api/customers', data, config);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message || 'Failed to create customer';
        throw new Error(message);
      }
      throw error;
    }
  }

  /**
   * Get customer by ID from Registry Service
   */
  async getCustomer(customerId: string, token?: string, tenantId?: string): Promise<any> {
    const config: any = {};

    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }

    if (tenantId) {
      config.headers = {
        ...config.headers,
        'x-tenant-id': tenantId,
      };
    }

    try {
      const response = await this.client.get(`/api/customers/${customerId}`, config);
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message || 'Failed to get customer';
        throw new Error(message);
      }
      throw error;
    }
  }
}

