// Use Next.js API route in browser (relative URL), or direct service URL in server-side
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_INVOICES_API_URL || 'http://localhost:3003');

export interface Invoice {
  id: string;
  invoiceNumber: string;
  deliveryNoteId?: string | null;
  customerId: string;
  companyId?: string | null;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED';
  issueDate: string;
  dueDate: string;
  subtotal: string | number;
  taxTotal: string | number;
  discountTotal: string | number;
  grandTotal: string | number;
  currency: string;
  paidAmount: string | number;
  outstandingAmount: string | number;
  paymentReference?: string | null;
  notes?: string | null;
  lineItems: InvoiceLineItem[];
  payments?: Payment[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  productId?: string | null;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discountPercent: string | number;
  taxPercent: string | number;
  totalPrice: string | number;
  tenantId: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  provider: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'MANUAL' | 'CASH';
  amount: string | number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIAL';
  transactionId?: string | null;
  paymentMethod?: string | null;
  processedAt?: string | null;
}

interface CreateInvoiceRequest {
  deliveryNoteId?: string;
  customerId: string;
  companyId?: string;
  lineItems: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent: number;
  }>;
  currency?: string;
  dueDays?: number;
  notes?: string;
}

interface RecordPaymentRequest {
  invoiceId: string;
  amount: number;
  provider: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'MANUAL' | 'CASH';
  transactionId?: string;
  paymentMethod?: string;
  currency?: string;
  notes?: string;
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authentication token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const tenantId = localStorage.getItem('tenantId') || 'cloud-native-doo';
    headers['x-tenant-id'] = tenantId;
  } else {
    headers['x-tenant-id'] = 'cloud-native-doo';
  }

  return headers;
}

export const invoicesApi = {
  async list(filters?: {
    status?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    skip?: number;
    take?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.skip) params.append('skip', filters.skip.toString());
    if (filters?.take) params.append('take', filters.take.toString());

    try {
      // Use Next.js API route in browser, direct service URL in server
      const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
      const url = `${baseUrl}/api/invoices?${params}`;
      console.log('Fetching invoices from:', url);
      
      const response = await fetch(url, {
        headers: await getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array if endpoint not found (service might not be ready)
          return { success: true, data: [] };
        }
        throw new Error(`Failed to fetch invoices: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // If service is not available, return empty array instead of throwing
      if (error.message?.includes('fetch') || error.message?.includes('Failed')) {
        console.warn('Invoices service not available:', error.message);
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/invoices/${id}`, {
        headers: await getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }
  },

  async create(invoice: CreateInvoiceRequest) {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to create invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async issue(id: string) {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/invoices/${id}/issue`, {
      method: 'POST',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to issue invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async cancel(id: string) {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/invoices/${id}/cancel`, {
      method: 'POST',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to cancel invoice: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async downloadPDF(id: string): Promise<Blob> {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/invoices/${id}/pdf`, {
      headers: await getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    return response.blob();
  },

  async pushToAccounting(id: string) {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/invoices/${id}/accounting`, {
      method: 'POST',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to push to accounting: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async recordPayment(payment: RecordPaymentRequest) {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to record payment: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },

  async checkOverdue() {
    const baseUrl = typeof window !== 'undefined' ? '' : API_BASE_URL;
    const response = await fetch(`${baseUrl}/api/dunnings/process`, {
      method: 'POST',
      headers: await getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to check overdue: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  },
};

