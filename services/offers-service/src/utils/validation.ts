import { z } from 'zod';

/**
 * Validation schemas for offers service
 */

export const createOfferSchema = z.object({
  customerId: z.string().uuid(),
  validUntil: z.string().datetime(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RSD', 'OTHER']),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      discountPercent: z.number().min(0).max(100).default(0),
      taxPercent: z.number().min(0).max(100).default(0),
    })
  ).min(1),
});

export const updateOfferSchema = z.object({
  customerId: z.string().uuid().optional(),
  validUntil: z.string().datetime().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'RSD', 'OTHER']).optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED']).optional(),
});

export const addLineItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).default(0),
  taxPercent: z.number().min(0).max(100).default(0),
});

export const approvalSchema = z.object({
  approverEmail: z.string().email(),
  comments: z.string().optional(),
});

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type AddLineItemInput = z.infer<typeof addLineItemSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;

