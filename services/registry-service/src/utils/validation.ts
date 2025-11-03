import { z } from 'zod';

// Validation schemas
export const customerCreateSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  title: z.string().optional(),
  department: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  companyId: z.string().uuid().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  taxId: z.string().min(5),
  registrationNumber: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }),
  bankAccount: z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    routingNumber: z.string().optional(),
    iban: z.string().optional(),
    swift: z.string().optional(),
  }).optional(),
  tenantId: z.string().min(1),
}).refine((data) => {
  // Individual must have firstName, lastName, companyId, and department
  if (data.type === 'INDIVIDUAL') {
    if (!data.firstName || !data.lastName) {
      return false;
    }
    if (!data.companyId) {
      return false;
    }
    if (!data.department) {
      return false;
    }
  }
  // Company must have companyName
  if (data.type === 'COMPANY' && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: "INDIVIDUAL contacts must have firstName, lastName, companyId, and department"
});

export const companyCreateSchema = z.object({
  companyType: z.enum(['CORPORATION', 'LLC', 'LTD', 'GMBH', 'SARL', 'OTHER']),
  legalName: z.string().min(1),
  tradingName: z.string().optional(),
  taxId: z.string().min(5),
  registrationNumber: z.string().min(5),
  industry: z.string().optional(),
  legalRepName: z.string().optional(),
  legalRepTitle: z.string().optional(),
  legalRepEmail: z.string().email().optional(),
  legalRepPhone: z.string().optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
  }),
  bankAccount: z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    routingNumber: z.string().optional(),
    iban: z.string().optional(),
    swift: z.string().optional(),
  }).optional(),
  tenantId: z.string().min(1),
});

// Validation helper functions
export function validateTaxId(taxId: string, country: string = 'US'): { valid: boolean; error?: string } {
  const patterns: Record<string, RegExp> = {
    'US': /^\d{2}-\d{7}$/,
    'GB': /^GB\d{9}(\s\d{3})?$/,
    'DE': /^\d{11}$/,
    'FR': /^\d{9}$/,
  };

  const pattern = patterns[country];
  if (pattern && pattern.test(taxId.replace(/\s/g, ''))) {
    return { valid: true };
  }

  if (taxId.length >= 5) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid Tax ID format' };
}

export function validateIBAN(iban: string): { valid: boolean; error?: string } {
  if (!iban) return { valid: true };
  
  const ibanPattern = /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/;
  if (ibanPattern.test(iban.replace(/\s/g, ''))) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid IBAN format' };
}

export function validateSWIFT(swift: string): { valid: boolean; error?: string } {
  if (!swift) return { valid: true };
  
  const swiftPattern = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  if (swiftPattern.test(swift)) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid SWIFT code format' };
}

