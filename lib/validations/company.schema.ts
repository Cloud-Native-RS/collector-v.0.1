import { z } from "zod";
import { addressSchema } from "./contact.schema";

// Company type enum
export const companyTypeEnum = z.enum([
  "CORPORATION",
  "LLC",
  "LTD",
  "GMBH",
  "SARL",
  "OTHER",
]);

// Bank account schema
export const bankAccountSchema = z.object({
  bankName: z.string().max(100).optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  iban: z.string().max(50).optional().nullable(),
  swift: z.string().max(20).optional().nullable(),
});

// Contact info schema
export const contactInfoSchema = z.object({
  email: z.string().email("Invalid email").max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

// Legal representative schema
export const legalRepSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  title: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});

// Company schema
export const companySchema = z.object({
  companyType: companyTypeEnum,

  legalName: z
    .string()
    .min(1, "Legal name is required")
    .max(200, "Legal name must be less than 200 characters"),

  taxId: z
    .string()
    .min(1, "Tax ID is required")
    .max(50, "Tax ID must be less than 50 characters"),

  registrationNumber: z
    .string()
    .max(50, "Registration number must be less than 50 characters")
    .optional()
    .or(z.literal("")),

  industry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  address: addressSchema.optional().nullable(),
  contactInfo: contactInfoSchema.optional().nullable(),
  legalRepresentative: legalRepSchema.optional().nullable(),
  bankAccount: bankAccountSchema.optional().nullable(),

  status: z.enum(["active", "inactive", "pending"], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
});

// Create company schema
export const createCompanySchema = companySchema;

// Update company schema
export const updateCompanySchema = companySchema.partial();

// Type inference
export type CompanyFormData = z.infer<typeof companySchema>;
export type CreateCompanyData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>;
export type CompanyType = z.infer<typeof companyTypeEnum>;
