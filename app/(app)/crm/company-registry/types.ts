export type CompanyStatus = "active" | "inactive" | "pending" | "liquidated";

export type CompanyType = 
  | "Corporation"
  | "Limited Liability Company"
  | "Private Limited Company"
  | "Public Limited Company"
  | "Gesellschaft mit beschränkter Haftung"
  | "Société à Responsabilité Limitée"
  | "Other";

export interface Address {
  street: string;
  city: string;
  state: string | null;
  zipCode: string;
  country: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  routingNumber: string | null;
  iban: string | null;
  swift: string | null;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string | null;
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

export interface LegalRepresentative {
  name: string;
  title: string;
  email: string;
  phone: string;
}

export interface Company {
  id: number;
  originalId?: string; // Original API ID (UUID) for API calls
  companyNumber: string;
  legalName: string;
  tradingName: string;
  companyType: CompanyType;
  taxId: string;
  registrationNumber: string;
  status: CompanyStatus;
  industry: string;
  address: Address;
  contactInfo: ContactInfo;
  bankAccount: BankAccount;
  legalRepresentative: LegalRepresentative;
  contactPersons?: ContactPerson[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

