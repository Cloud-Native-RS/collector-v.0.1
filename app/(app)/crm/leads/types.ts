export type LeadStatus = "new" | "contacted" | "qualified" | "proposal_sent" | "negotiation" | "won" | "lost";

export type LeadSource = "website" | "social" | "email" | "call" | "referral" | "other";

export interface Lead {
  id: string;
  title?: string;
  name: string;
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
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  value?: number;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

