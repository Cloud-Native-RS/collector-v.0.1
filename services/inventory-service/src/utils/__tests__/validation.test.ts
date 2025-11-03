import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Primer validacionih schema koje se koriste u servisu
const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unitOfMeasure: z.enum(['PIECE', 'KG', 'L', 'M']),
  price: z.number().positive(),
  taxPercent: z.number().min(0).max(100),
  category: z.string().optional(),
});

const warehouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  capacity: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
});

describe('Validation Schemas', () => {
  describe('Product Schema', () => {
    it('should validate correct product data', () => {
      const validData = {
        sku: 'SKU-123456',
        name: 'Test Product',
        description: 'Test Description',
        unitOfMeasure: 'PIECE',
        price: 100.50,
        taxPercent: 20,
        category: 'ELECTRONICS',
      };

      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid unitOfMeasure', () => {
      const invalidData = {
        sku: 'SKU-123456',
        name: 'Test Product',
        unitOfMeasure: 'INVALID',
        price: 100,
        taxPercent: 20,
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const invalidData = {
        sku: 'SKU-123456',
        name: 'Test Product',
        unitOfMeasure: 'PIECE',
        price: -100,
        taxPercent: 20,
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject taxPercent > 100', () => {
      const invalidData = {
        sku: 'SKU-123456',
        name: 'Test Product',
        unitOfMeasure: 'PIECE',
        price: 100,
        taxPercent: 150,
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Warehouse Schema', () => {
    it('should validate correct warehouse data', () => {
      const validData = {
        name: 'Main Warehouse',
        location: '123 Industrial Blvd',
        capacity: 10000,
        status: 'ACTIVE',
      };

      const result = warehouseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate warehouse without capacity', () => {
      const validData = {
        name: 'Main Warehouse',
        location: '123 Industrial Blvd',
        status: 'ACTIVE',
      };

      const result = warehouseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        name: 'Main Warehouse',
        location: '123 Industrial Blvd',
        status: 'INVALID',
      };

      const result = warehouseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        location: '123 Industrial Blvd',
        status: 'ACTIVE',
      };

      const result = warehouseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

