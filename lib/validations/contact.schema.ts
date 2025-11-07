import { z } from "zod";

// Phone number regex - international format
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

// Address schema (reusable)
export const addressSchema = z.object({
  street: z.string().min(1, "Street address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  country: z.string().min(1, "Country is required").max(100),
});

// Contact schema
export const contactSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens and apostrophes"),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens and apostrophes"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(100, "Email must be less than 100 characters"),

  phone: z
    .string()
    .regex(phoneRegex, "Invalid phone number format")
    .optional()
    .or(z.literal("")),

  title: z
    .string()
    .max(100, "Title must be less than 100 characters")
    .optional()
    .nullable(),

  department: z
    .string()
    .max(100, "Department must be less than 100 characters")
    .optional()
    .nullable(),

  companyId: z.string().optional().nullable(),

  address: addressSchema.optional().nullable(),

  status: z.enum(["active", "inactive", "pending"], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
});

// Create contact schema (for new contacts)
export const createContactSchema = contactSchema;

// Update contact schema (all fields optional)
export const updateContactSchema = contactSchema.partial();

// Contact form schema (for forms with additional fields)
export const contactFormSchema = contactSchema.extend({
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  linkedIn: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

// Type inference
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CreateContactData = z.infer<typeof createContactSchema>;
export type UpdateContactData = z.infer<typeof updateContactSchema>;
