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

