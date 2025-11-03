// Registry Service API Client
// Uses Next.js API routes as proxy to registry-service

const API_BASE_URL = '';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-tenant-id': tenantId,
    ...options.headers,
  };

  // Use relative URL to go through Next.js API route proxy
  const fullUrl = url.startsWith('http') ? url : url;

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Check content type before parsing
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  // Get response text once
  const text = await response.text();

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      if (text && isJson) {
        const error = JSON.parse(text);
        errorMessage = error.error?.message || error.message || `HTTP error! status: ${response.status}`;
      } else if (text && text.trim().startsWith('<!DOCTYPE')) {
        errorMessage = `Server returned HTML instead of JSON. Status: ${response.status}. This usually means the API route doesn't exist or there's a server error.`;
      } else if (text) {
        errorMessage = text.substring(0, 200); // First 200 chars of error
      } else {
        errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
      }
    } catch (e) {
      errorMessage = response.statusText || `HTTP error! status: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  // Ensure response is JSON before parsing
  if (!isJson) {
    if (text.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Server returned HTML instead of JSON. This usually means the API route doesn\'t exist or there\'s a server error.');
    }
    throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
  }

  return JSON.parse(text);
}

// Company Types
export interface Company {
  id: string;
  companyType: 'CORPORATION' | 'LLC' | 'LTD' | 'GMBH' | 'SARL' | 'OTHER';
  companyNumber: string;
  legalName: string;
  tradingName?: string;
  taxId: string;
  registrationNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'LIQUIDATED';
  industry?: string;
  legalRepName?: string;
  legalRepTitle?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
  address: Address;
  contact: Contact;
  bankAccount?: BankAccount;
  contacts?: ContactPerson[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
}

export interface Contact {
  email: string;
  phone?: string;
  website?: string;
}

export interface ContactPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  email: string;
  phone?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
}

export interface CreateCompanyInput {
  companyType: 'CORPORATION' | 'LLC' | 'LTD' | 'GMBH' | 'SARL' | 'OTHER';
  legalName: string;
  tradingName?: string;
  taxId: string;
  registrationNumber: string;
  industry?: string;
  legalRepName?: string;
  legalRepTitle?: string;
  legalRepEmail?: string;
  legalRepPhone?: string;
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

export interface UpdateCompanyInput extends Partial<CreateCompanyInput> {}

// Customer Types
export interface Customer {
  id: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  customerNumber: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  companyName?: string;
  companyId?: string;
  company?: Company; // Include company data when loaded
  email: string;
  phone?: string;
  taxId: string;
  registrationNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ARCHIVED';
  address: Address;
  contact: Contact;
  bankAccount?: BankAccount;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  type: 'INDIVIDUAL' | 'COMPANY';
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  companyName?: string;
  companyId?: string;
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

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

// Company API
export const companiesApi = {
  async list(filters?: {
    status?: string;
    companyType?: string;
    skip?: number;
    take?: number;
  }): Promise<{ success: boolean; data: Company[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/companies${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Company }> {
    return fetchWithAuth(`/api/companies/${id}`);
  },

  async create(input: CreateCompanyInput): Promise<{ success: boolean; data: Company }> {
    return fetchWithAuth('/api/companies', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateCompanyInput): Promise<{ success: boolean; data: Company }> {
    return fetchWithAuth(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth(`/api/companies/${id}`, {
      method: 'DELETE',
    });
  },
};

// Customer API
export const customersApi = {
  async list(filters?: {
    status?: string;
    type?: string;
    skip?: number;
    take?: number;
  }): Promise<{ success: boolean; data: Customer[] }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/customers${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Customer }> {
    return fetchWithAuth(`/api/customers/${id}`);
  },

  async create(input: CreateCustomerInput): Promise<{ success: boolean; data: Customer }> {
    return fetchWithAuth('/api/customers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateCustomerInput): Promise<{ success: boolean; data: Customer }> {
    return fetchWithAuth(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return fetchWithAuth(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
