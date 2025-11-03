import { z } from 'zod';

// Order creation schema
export const createOrderSchema = z.object({
  offerId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2).max(2),
    state: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }),
  lineItems: z.array(z.object({
    productId: z.string().uuid(),
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    discountPercent: z.number().min(0).max(100).optional().default(0),
    taxPercent: z.number().min(0).max(100).optional().default(0),
    sku: z.string().optional(),
  })).min(1),
  currency: z.string().length(3).default('USD'),
  notes: z.string().optional(),
});

// Order status update schema
export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED']),
  notes: z.string().optional(),
});

// Payment processing schema
export const processPaymentSchema = z.object({
  provider: z.enum(['STRIPE', 'PAYPAL', 'MANUAL', 'BANK_TRANSFER', 'OTHER']),
  amount: z.number().positive().optional(), // Optional if payment is for full order amount
  paymentMethod: z.string().optional(),
  paymentToken: z.string().optional(), // For Stripe/PayPal tokens
});

// Cancel order schema
export const cancelOrderSchema = z.object({
  reason: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

