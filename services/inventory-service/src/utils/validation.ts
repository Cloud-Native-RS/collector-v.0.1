import { z } from 'zod';

// Product validation schemas
export const productCreateSchema = z.object({
  sku: z.string().min(3).max(50),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  unitOfMeasure: z.enum(['PIECE', 'KG', 'LITER', 'BOX', 'PALLET', 'CARTON']),
  price: z.number().positive(),
  taxPercent: z.number().min(0).max(100).default(0),
  category: z.enum(['ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'FURNITURE', 'TOOLS', 'MEDICAL', 'OFFICE_SUPPLIES', 'OTHER']),
  tenantId: z.string(),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  category: z.enum(['ELECTRONICS', 'CLOTHING', 'FOOD', 'BOOKS', 'FURNITURE', 'TOOLS', 'MEDICAL', 'OFFICE_SUPPLIES', 'OTHER']).optional(),
});

// Warehouse validation schemas
export const warehouseCreateSchema = z.object({
  name: z.string().min(1).max(255),
  location: z.string().min(1).max(500),
  capacity: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
  tenantId: z.string(),
});

export const warehouseUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  location: z.string().min(1).max(500).optional(),
  capacity: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

// Stock validation schemas
export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int(),
  transactionType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  tenantId: z.string(),
});

export const stockReservationSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.number().int().positive(),
  tenantId: z.string(),
});

export const stockCheckSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid().optional(),
  tenantId: z.string(),
});

// Supplier validation schemas
export const supplierCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  status: z.string().default('ACTIVE'),
  tenantId: z.string(),
});

export const supplierUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
  status: z.string().optional(),
});

// Purchase Order validation schemas
export const purchaseOrderCreateSchema = z.object({
  supplierId: z.string().uuid(),
  status: z.enum(['DRAFT', 'SENT', 'RECEIVED', 'CANCELED', 'PARTIALLY_RECEIVED']).default('DRAFT'),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
  tenantId: z.string(),
});

export const purchaseOrderUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'RECEIVED', 'CANCELED', 'PARTIALLY_RECEIVED']).optional(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const purchaseOrderReceiveSchema = z.object({
  lineItems: z.array(z.object({
    id: z.string().uuid(),
    receivedQuantity: z.number().int().min(0),
  })),
  tenantId: z.string(),
});

// Delivery Note Sync validation schema
export const deliveryNoteSyncSchema = z.object({
  deliveryNoteId: z.string(),
  productId: z.string().uuid(),
  quantity: z.number().int(),
  warehouseId: z.string().uuid(),
  transactionType: z.enum(['IN', 'OUT']),
  tenantId: z.string(),
});

