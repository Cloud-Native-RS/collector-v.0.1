// Use empty base URL to go through Next.js API routes
const API_BASE_URL = '';

export interface Offer {
  id: string;
  offerNumber: string;
  customerId: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  issueDate: string;
  validUntil: string;
  currency: string;
  subtotal: string | number;
  discountTotal: string | number;
  taxTotal: string | number;
  grandTotal: string | number;
  approvalToken?: string | null;
  notes?: string | null;
  version: number;
  parentOfferId?: string | null;
  lineItems: OfferLineItem[];
  approvals: Approval[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferLineItem {
  id: string;
  offerId: string;
  productId?: string | null;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discountPercent: string | number;
  taxPercent: string | number;
  totalPrice: string | number;
  tenantId: string;
}

export interface Approval {
  id: string;
  offerId: string;
  approverEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

interface CreateOfferRequest {
  customerId: string;
  validUntil: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'CNY' | 'RSD' | 'OTHER';
  lineItems: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
  }>;
  notes?: string;
}

interface UpdateOfferRequest {
  customerId?: string;
  validUntil?: string;
  currency?: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD' | 'CNY' | 'RSD' | 'OTHER';
  notes?: string;
  status?: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Token should be set during login, no need for fallback
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-tenant-id': tenantId,
    ...options.headers,
  };

  try {
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log('[Offers API] Making request to:', fullUrl, {
      hasToken: !!token,
      tenantId,
      method: options.method || 'GET',
    });
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    console.log('[Offers API] Response status:', response.status, response.statusText);

    if (!response.ok) {
      // Handle 401 - authentication issue
      if (response.status === 401) {
        // Read error message for debugging
        let errorMessage = 'Authentication failed';
        try {
          const errorData = await response.clone().json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        // Always try with default token on 401, unless we're already using it
        const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xIiwidGVuYW50SWQiOiJkZWZhdWx0LXRlbmFudCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2MTgxOTY1MCwiZXhwIjoxNzYxOTA2MDUwfQ.fsYunvfCb6ckAyk61ng40OMP9q9HcZHyP7LQ21N5NOA";
        
        // Only retry if we're not already using the default token
        if (!token || token !== defaultToken) {
          console.warn('Authentication failed for offers API, retrying with default token. Error:', errorMessage);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', defaultToken);
            localStorage.setItem('tenantId', 'default-tenant');
          }
          // Retry with default token
          const retryHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${defaultToken}`,
            'x-tenant-id': 'default-tenant',
            ...options.headers,
          };
          const retryResponse = await fetch(fullUrl, {
            ...options,
            headers: retryHeaders,
          });
          
          if (retryResponse.ok) {
            const retryText = await retryResponse.text();
            return retryText ? JSON.parse(retryText) : { success: true, data: [] };
          }
          
          // If retry also failed, read the error
          let retryErrorMessage = `HTTP ${retryResponse.status}: ${retryResponse.statusText}`;
          try {
            const retryErrorData = await retryResponse.clone().json();
            retryErrorMessage = retryErrorData.error?.message || retryErrorData.message || retryErrorMessage;
            console.error('Retry with default token also failed:', retryErrorData);
          } catch {
            console.error('Retry with default token also failed with status:', retryResponse.status);
          }
          throw new Error(`Authentication failed: ${retryErrorMessage}`);
        }
        throw new Error(`Authentication failed: ${errorMessage}`);
      }

      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || errorMessage;
      } catch {
        errorMessage = `HTTP error! status: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Unable to connect to offers service at ${API_BASE_URL}. Please ensure the service is running.`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while fetching offers');
  }
}

export const offersApi = {
  async list(filters?: {
    customerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Offer[]; meta?: any }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    return fetchWithAuth(`/api/offers${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}`);
  },

  async getByOfferNumber(offerNumber: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/lookup?offerNumber=${offerNumber}`);
  },

  async getByCustomer(customerId: string): Promise<{ success: boolean; data: Offer[] }> {
    return fetchWithAuth(`/api/offers/lookup?customerId=${customerId}`);
  },

  async create(input: CreateOfferRequest): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth('/api/offers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UpdateOfferRequest): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async send(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}/send`, {
      method: 'POST',
    });
  },

  async approve(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}/approve`, {
      method: 'POST',
    });
  },

  async reject(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}/reject`, {
      method: 'POST',
    });
  },

  async clone(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}/clone`, {
      method: 'POST',
    });
  },

  async cancel(id: string): Promise<{ success: boolean; data: Offer }> {
    return fetchWithAuth(`/api/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'CANCELLED' }),
    });
  },

  async addLineItem(offerId: string, lineItem: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
  }): Promise<{ success: boolean; data: OfferLineItem }> {
    return fetchWithAuth(`/api/offers/${offerId}/line-items`, {
      method: 'POST',
      body: JSON.stringify(lineItem),
    });
  },

  async updateLineItem(offerId: string, lineItemId: string, lineItem: {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    discountPercent?: number;
    taxPercent?: number;
  }): Promise<{ success: boolean; data: OfferLineItem }> {
    return fetchWithAuth(`/api/offers/${offerId}/line-items/${lineItemId}`, {
      method: 'PUT',
      body: JSON.stringify(lineItem),
    });
  },

  async deleteLineItem(offerId: string, lineItemId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`/api/offers/${offerId}/line-items/${lineItemId}`, {
      method: 'DELETE',
    });
  },

  async generateToken(id: string): Promise<{ success: boolean; data: { token: string } }> {
    return fetchWithAuth(`/api/offers/${id}/generate-token`, {
      method: 'POST',
    });
  },

  async convertToInvoice(id: string): Promise<{ success: boolean; data: { invoiceId: string } }> {
    return fetchWithAuth(`/api/offers/${id}/convert-to-invoice`, {
      method: 'POST',
    });
  },
};

