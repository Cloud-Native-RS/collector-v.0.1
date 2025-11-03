export type InvoiceStatus = "draft" | "issued" | "paid" | "partially_paid" | "overdue" | "canceled" | "refunded";

export type PaymentProvider = "STRIPE" | "PAYPAL" | "BANK_TRANSFER" | "MANUAL" | "CASH";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "partial";

export interface InvoiceLineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: string;
  processedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  deliveryNoteId?: string;
  customerId: string;
  companyId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  paidAmount: number;
  outstandingAmount: number;
  paymentReference?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
  payments?: Payment[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

