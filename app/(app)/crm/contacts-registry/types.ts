export type ContactStatus = "active" | "inactive" | "pending" | "archived";

export interface Address {
  street: string;
  city: string;
  state: string | null;
  zipCode: string;
  country: string;
}

export interface Contact {
  id: number;
  originalId?: string; // Original API ID (UUID) for API calls
  contactNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string | null;
  department: string | null;
  companyId: number | null;
  companyName: string | null;
  companyLegalName: string | null;
  status: ContactStatus;
  address: Address;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

