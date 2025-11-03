const API_BASE_URL = process.env.NEXT_PUBLIC_INVOICES_API_URL || 'http://localhost:3002';

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
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWithInvoice extends Payment {
  invoice: {
    id: string;
    invoiceNumber: string;
    customerId: string;
    status: string;
    grandTotal: string | number;
  };
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') || 'default-tenant' : 'default-tenant';

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-tenant-id': tenantId,
  };
}

export const paymentsApi = {
  async list(filters?: {
    invoiceId?: string;
    status?: string;
    provider?: string;
    fromDate?: string;
    toDate?: string;
    skip?: number;
    take?: number;
  }): Promise<{ success: boolean; data: Payment[]; meta?: any }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    // Get all invoices with payments
    const invoicesResponse = await fetch(`${API_BASE_URL}/api/invoices?${params}`, {
      headers: await getHeaders(),
    });

    if (!invoicesResponse.ok) {
      throw new Error(`Failed to fetch payments: ${invoicesResponse.statusText}`);
    }

    const invoicesData = await invoicesResponse.json();
    
    // Extract all payments from invoices
    const allPayments: Payment[] = [];
    if (invoicesData.data && Array.isArray(invoicesData.data)) {
      invoicesData.data.forEach((invoice: any) => {
        if (invoice.payments && Array.isArray(invoice.payments)) {
          allPayments.push(...invoice.payments);
        }
      });
    }

    return {
      success: true,
      data: allPayments,
      meta: invoicesData.meta,
    };
  },

  async getById(id: string): Promise<{ success: boolean; data: Payment }> {
    // Since we don't have a direct payments endpoint, we need to search through invoices
    // This is a simplified version - in production, you'd have a dedicated payments endpoint
    const response = await fetch(`${API_BASE_URL}/api/invoices`, {
      headers: await getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment: ${response.statusText}`);
    }

    const data = await response.json();
    let payment: Payment | undefined;

    // Search through all invoices to find the payment
    if (data.data && Array.isArray(data.data)) {
      for (const invoice of data.data) {
        if (invoice.payments && Array.isArray(invoice.payments)) {
          payment = invoice.payments.find((p: Payment) => p.id === id);
          if (payment) break;
        }
      }
    }

    if (!payment) {
      throw new Error('Payment not found');
    }

    return { success: true, data: payment };
  },

  async recordPayment(payment: RecordPaymentRequest): Promise<{ success: boolean; data: Payment }> {
    const response = await fetch(`${API_BASE_URL}/api/payments`, {
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

  async getByInvoiceId(invoiceId: string): Promise<{ success: boolean; data: Payment[] }> {
    const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
      headers: await getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.statusText}`);
    }

    const data = await response.json();
    const payments = data.data?.payments || [];

    return {
      success: true,
      data: payments,
    };
  },
};

