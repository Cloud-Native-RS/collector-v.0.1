import { z } from "zod";

// Product category enum
export const productCategoryEnum = z.enum([
  "GOODS",
  "SERVICES",
  "DIGITAL",
]);

// Product unit enum
export const productUnitEnum = z.enum([
  "PIECE",
  "KILOGRAM",
  "LITER",
  "METER",
  "HOUR",
  "DAY",
  "MONTH",
]);

// Product schema
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(200, "Product name must be less than 200 characters"),

  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "SKU can only contain uppercase letters, numbers and hyphens"),

  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),

  category: productCategoryEnum,

  price: z
    .number({ required_error: "Price is required" })
    .positive("Price must be positive")
    .max(999999999.99, "Price is too large"),

  cost: z
    .number()
    .nonnegative("Cost cannot be negative")
    .max(999999999.99, "Cost is too large")
    .optional()
    .nullable(),

  unit: productUnitEnum,

  minStock: z
    .number()
    .int("Minimum stock must be a whole number")
    .nonnegative("Minimum stock cannot be negative")
    .optional()
    .default(0),

  isActive: z.boolean().optional().default(true),

  taxRate: z
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%")
    .optional()
    .default(0),

  image: z.string().url("Invalid image URL").optional().or(z.literal("")),

  barcode: z
    .string()
    .max(50, "Barcode must be less than 50 characters")
    .optional()
    .or(z.literal("")),
});

// Create product schema
export const createProductSchema = productSchema;

// Update product schema
export const updateProductSchema = productSchema.partial();

// Product filter schema
export const productFilterSchema = z.object({
  category: productCategoryEnum.optional(),
  search: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// Type inference
export type ProductFormData = z.infer<typeof productSchema>;
export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductFilterData = z.infer<typeof productFilterSchema>;
export type ProductCategory = z.infer<typeof productCategoryEnum>;
export type ProductUnit = z.infer<typeof productUnitEnum>;
