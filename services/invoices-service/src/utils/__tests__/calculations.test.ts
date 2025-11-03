import { describe, it, expect } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateLineItemTotal,
  calculateSubtotal,
  calculateTaxTotal,
  isOverdue,
  getDaysOverdue,
} from '../calculations';

describe('Calculation Utilities', () => {
  describe('calculateLineItemTotal', () => {
    it('should calculate total without discount and tax', () => {
      const result = calculateLineItemTotal(2, 100, 0, 0);
      expect(result.toNumber()).toBe(200);
    });

    it('should calculate total with discount only', () => {
      const result = calculateLineItemTotal(2, 100, 10, 0);
      expect(result.toNumber()).toBe(180);
    });

    it('should calculate total with tax only', () => {
      const result = calculateLineItemTotal(2, 100, 0, 20);
      expect(result.toNumber()).toBe(240);
    });

    it('should calculate total with both discount and tax', () => {
      const result = calculateLineItemTotal(2, 100, 10, 20);
      expect(result.toNumber()).toBe(216);
    });

    it('should handle Decimal inputs', () => {
      const qty = new Decimal(3);
      const price = new Decimal(150);
      const discount = new Decimal(15);
      const tax = new Decimal(10);

      const result = calculateLineItemTotal(qty, price, discount, tax);
      
      // 3 * 150 * (1 - 0.15) * (1 + 0.10) = 420.75
      expect(result.toNumber()).toBeCloseTo(420.75, 2);
    });

    it('should handle large quantities', () => {
      const result = calculateLineItemTotal(1000, 1.99, 5, 20);
      expect(result.toNumber()).toBeCloseTo(2278.10, 2);
    });

    it('should handle fractional results correctly', () => {
      const result = calculateLineItemTotal(1, 33.33, 7, 21);
      expect(result.toNumber()).toBeCloseTo(36.47, 2);
    });

    it('should round to 2 decimal places', () => {
      const result = calculateLineItemTotal(1, 99.99, 0, 0);
      expect(result.toFixed(2)).toBe('99.99');
    });

    it('should handle zero quantity', () => {
      const result = calculateLineItemTotal(0, 100, 0, 0);
      expect(result.toNumber()).toBe(0);
    });

    it('should handle zero price', () => {
      const result = calculateLineItemTotal(10, 0, 0, 0);
      expect(result.toNumber()).toBe(0);
    });

    it('should handle 100% discount', () => {
      const result = calculateLineItemTotal(10, 100, 100, 20);
      expect(result.toNumber()).toBe(0);
    });

    it('should handle very high tax rate', () => {
      const result = calculateLineItemTotal(1, 100, 0, 200);
      expect(result.toNumber()).toBe(300);
    });
  });

  describe('calculateSubtotal', () => {
    it('should calculate subtotal from multiple line items', () => {
      const lineItems = [
        { totalPrice: new Decimal(100) },
        { totalPrice: new Decimal(200) },
        { totalPrice: new Decimal(150) },
      ];

      const result = calculateSubtotal(lineItems);
      expect(result.toNumber()).toBe(450);
    });

    it('should handle number inputs', () => {
      const lineItems = [
        { totalPrice: 100 },
        { totalPrice: 200 },
        { totalPrice: 150 },
      ];

      const result = calculateSubtotal(lineItems);
      expect(result.toNumber()).toBe(450);
    });

    it('should handle mixed Decimal and number inputs', () => {
      const lineItems = [
        { totalPrice: new Decimal(100) },
        { totalPrice: 200 },
        { totalPrice: new Decimal(150) },
      ];

      const result = calculateSubtotal(lineItems);
      expect(result.toNumber()).toBe(450);
    });

    it('should handle empty array', () => {
      const result = calculateSubtotal([]);
      expect(result.toNumber()).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const lineItems = [
        { totalPrice: 33.333 },
        { totalPrice: 66.666 },
      ];

      const result = calculateSubtotal(lineItems);
      expect(result.toFixed(2)).toBe('100.00');
    });

    it('should handle very large totals', () => {
      const lineItems = Array.from({ length: 100 }, () => ({
        totalPrice: new Decimal(99999.99),
      }));

      const result = calculateSubtotal(lineItems);
      expect(result.toNumber()).toBeCloseTo(9999999.00, 2);
    });
  });

  describe('calculateTaxTotal', () => {
    it('should calculate tax total from multiple line items', () => {
      const lineItems = [
        {
          quantity: 2,
          unitPrice: 100,
          discountPercent: 0,
          taxPercent: 20,
        },
        {
          quantity: 1,
          unitPrice: 200,
          discountPercent: 10,
          taxPercent: 20,
        },
      ];

      const result = calculateTaxTotal(lineItems);
      
      // First: 2 * 100 * (1 - 0) * (0.20) = 40
      // Second: 1 * 200 * (1 - 0.10) * (0.20) = 36
      // Total: 76
      expect(result.toNumber()).toBeCloseTo(76, 2);
    });

    it('should handle Decimal inputs', () => {
      const lineItems = [
        {
          quantity: new Decimal(3),
          unitPrice: new Decimal(100),
          discountPercent: new Decimal(15),
          taxPercent: new Decimal(10),
        },
      ];

      const result = calculateTaxTotal(lineItems);
      
      // 3 * 100 * (1 - 0.15) * (0.10) = 25.5
      expect(result.toNumber()).toBeCloseTo(25.5, 2);
    });

    it('should handle zero tax', () => {
      const lineItems = [
        {
          quantity: 10,
          unitPrice: 100,
          discountPercent: 0,
          taxPercent: 0,
        },
      ];

      const result = calculateTaxTotal(lineItems);
      expect(result.toNumber()).toBe(0);
    });

    it('should handle discount correctly in tax calculation', () => {
      const lineItems = [
        {
          quantity: 1,
          unitPrice: 100,
          discountPercent: 50,
          taxPercent: 20,
        },
      ];

      const result = calculateTaxTotal(lineItems);
      
      // 1 * 100 * (1 - 0.50) * (0.20) = 10
      expect(result.toNumber()).toBeCloseTo(10, 2);
    });

    it('should handle empty array', () => {
      const result = calculateTaxTotal([]);
      expect(result.toNumber()).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      const lineItems = [
        {
          quantity: 1,
          unitPrice: 33.333,
          discountPercent: 0,
          taxPercent: 20,
        },
      ];

      const result = calculateTaxTotal(lineItems);
      expect(result.toFixed(2)).toBe('6.67');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1 day from now
      expect(isOverdue(futureDate)).toBe(false);
    });

    it('should return true for today when past current time', () => {
      const todayMorning = new Date();
      todayMorning.setHours(0, 0, 0, 0);
      expect(isOverdue(todayMorning)).toBe(true);
    });

    it('should handle dates far in the past', () => {
      const oldDate = new Date('2020-01-01');
      expect(isOverdue(oldDate)).toBe(true);
    });

    it('should handle dates far in the future', () => {
      const futureDate = new Date('2100-01-01');
      expect(isOverdue(futureDate)).toBe(false);
    });
  });

  describe('getDaysOverdue', () => {
    it('should return 0 for future dates', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24);
      expect(getDaysOverdue(futureDate)).toBe(0);
    });

    it('should return correct days for past dates', () => {
      const daysAgo = 5;
      const pastDate = new Date(Date.now() - daysAgo * 1000 * 60 * 60 * 24);
      
      const result = getDaysOverdue(pastDate);
      expect(result).toBe(daysAgo);
    });

    it('should return 0 for today', () => {
      const today = new Date();
      expect(getDaysOverdue(today)).toBe(0);
    });

    it('should handle dates very far in the past', () => {
      const oldDate = new Date('2000-01-01');
      const result = getDaysOverdue(oldDate);
      expect(result).toBeGreaterThan(0);
    });

    it('should round up partial days', () => {
      const yesterday = new Date(Date.now() - 1000 * 60 * 60 * 12); // 12 hours ago
      expect(getDaysOverdue(yesterday)).toBe(1);
    });

    it('should handle exactly one day ago', () => {
      const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
      expect(getDaysOverdue(oneDayAgo)).toBe(1);
    });

    it('should handle multiple days ago', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 1000 * 60 * 60 * 24);
      expect(getDaysOverdue(thirtyDaysAgo)).toBe(30);
    });
  });
});


