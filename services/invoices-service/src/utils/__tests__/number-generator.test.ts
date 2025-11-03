import { describe, it, expect } from 'vitest';
import {
  generateInvoiceNumber,
  generateSequentialInvoiceNumber,
} from '../number-generator';

describe('Number Generator Utilities', () => {
  describe('generateInvoiceNumber', () => {
    it('should generate invoice number with correct format', () => {
      const result = generateInvoiceNumber();
      expect(result).toMatch(/^INV-\d{8}-[A-Z0-9]{5}$/);
    });

    it('should include current date', () => {
      const result = generateInvoiceNumber();
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(result).toContain(today);
    });

    it('should generate unique numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateInvoiceNumber());
      }
      // Should have high uniqueness, but might have collisions
      expect(numbers.size).toBeGreaterThan(90);
    });

    it('should have correct prefix', () => {
      const result = generateInvoiceNumber();
      expect(result).toStartWith('INV-');
    });

    it('should have date in correct position', () => {
      const result = generateInvoiceNumber();
      const parts = result.split('-');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('INV');
      expect(parts[1].length).toBe(8); // YYYYMMDD
    });
  });

  describe('generateSequentialInvoiceNumber', () => {
    it('should generate sequential invoice number with correct format', () => {
      const result = generateSequentialInvoiceNumber(1);
      expect(result).toMatch(/^INV-\d{4}-00001$/);
    });

    it('should include current year', () => {
      const result = generateSequentialInvoiceNumber(1);
      const currentYear = new Date().getFullYear().toString();
      expect(result).toContain(currentYear);
    });

    it('should pad counter with zeros', () => {
      const result1 = generateSequentialInvoiceNumber(1);
      const result10 = generateSequentialInvoiceNumber(10);
      const result100 = generateSequentialInvoiceNumber(100);
      const result1000 = generateSequentialInvoiceNumber(1000);
      const result10000 = generateSequentialInvoiceNumber(10000);

      expect(result1).toMatch(/-00001$/);
      expect(result10).toMatch(/-00010$/);
      expect(result100).toMatch(/-00100$/);
      expect(result1000).toMatch(/-01000$/);
      expect(result10000).toMatch(/-10000$/);
    });

    it('should handle single digit counter', () => {
      const result = generateSequentialInvoiceNumber(5);
      expect(result).toMatch(/-00005$/);
    });

    it('should handle large counters', () => {
      const result = generateSequentialInvoiceNumber(12345);
      expect(result).toMatch(/-12345$/);
    });

    it('should have correct structure', () => {
      const result = generateSequentialInvoiceNumber(42);
      const parts = result.split('-');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('INV');
      expect(parts[1].length).toBe(4); // Year
      expect(parts[2].length).toBe(5); // Counter
    });

    it('should maintain format consistency', () => {
      const results = Array.from({ length: 10 }, (_, i) =>
        generateSequentialInvoiceNumber(i + 1)
      );

      results.forEach(result => {
        expect(result).toMatch(/^INV-\d{4}-\d{5}$/);
      });
    });

    it('should generate predictable format', () => {
      const currentYear = new Date().getFullYear();
      const result = generateSequentialInvoiceNumber(999);
      expect(result).toBe(`INV-${currentYear}-00999`);
    });
  });
});


