import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  deliveryAddressId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unit: z.string().default('pcs'),
  })).min(1),
  tenantId: z.string(),
});

export const updateDeliveryNoteSchema = z.object({
  status: z.enum(['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELED']).optional(),
  carrierId: z.string().uuid().optional(),
  trackingNumber: z.string().optional(),
});

export const createCarrierSchema = z.object({
  name: z.string().min(1),
  apiEndpoint: z.string().url(),
  trackingUrlTemplate: z.string(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  tenantId: z.string(),
});

export const confirmDeliverySchema = z.object({
  proofOfDeliveryUrl: z.string().url().optional(),
});

