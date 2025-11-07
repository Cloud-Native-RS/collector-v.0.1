import { z } from "zod";

// Deal stage enum
export const dealStageEnum = z.enum([
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
]);

// Deal priority enum
export const dealPriorityEnum = z.enum(["low", "medium", "high"]);

// Deal schema
export const dealSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),

  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),

  value: z
    .number({ required_error: "Deal value is required" })
    .positive("Deal value must be positive")
    .max(999999999.99, "Deal value is too large"),

  probability: z
    .number()
    .min(0, "Probability must be at least 0%")
    .max(100, "Probability cannot exceed 100%")
    .optional()
    .default(0),

  stage: dealStageEnum,

  priority: dealPriorityEnum.optional().default("medium"),

  expectedCloseDate: z
    .date({ required_error: "Expected close date is required" })
    .min(new Date(), "Close date cannot be in the past"),

  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),

  notes: z.string().max(2000).optional().or(z.literal("")),
});

// Create deal schema
export const createDealSchema = dealSchema;

// Update deal schema
export const updateDealSchema = dealSchema.partial();

// Update deal stage schema (for drag & drop)
export const updateDealStageSchema = z.object({
  dealId: z.string().min(1, "Deal ID is required"),
  stage: dealStageEnum,
});

// Type inference
export type DealFormData = z.infer<typeof dealSchema>;
export type CreateDealData = z.infer<typeof createDealSchema>;
export type UpdateDealData = z.infer<typeof updateDealSchema>;
export type DealStage = z.infer<typeof dealStageEnum>;
export type DealPriority = z.infer<typeof dealPriorityEnum>;
