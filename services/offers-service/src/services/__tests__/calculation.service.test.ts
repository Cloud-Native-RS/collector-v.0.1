import { describe, it, expect } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';
import { CalculationService } from '../calculation.service';
import { AppError } from '../../middleware/error-handler';

describe('CalculationService', () => {
  describe('calculateLineItemTotal', () => {
    it('should calculate line item total correctly without discount and tax', () => {
      const result = CalculationService.calculateLineItemTotal({
        quantity: 10,
        unitPrice: 100,
        discountPercent: 0,
        taxPercent: 0,
      });

      expect(result.toNumber()).toBe(1000);
    });

    it('should calculate line item total with discount', () => {
      const result = CalculationService.calculateLineItemTotal({
        quantity: 10,
        unitPrice: 100,
        discountPercent: 10,
        taxPercent: 0,
      });

      // 1000 * (1 - 0.1) = 900
      expect(result.toNumber()).toBe(900);
    });

    it('should calculate line item total with tax', () => {
      const result = CalculationService.calculateLineItemTotal({
        quantity: 10,
        unitPrice: 100,
        discountPercent: 0,
        taxPercent: 10,
      });

      // 1000 * (1 + 0.1) = 1100
      expect(result.toNumber()).toBe(1100);
    });

    it('should calculate line item total with discount and tax', () => {
      const result = CalculationService.calculateLineItemTotal({
        quantity: 10,
        unitPrice: 100,
        discountPercent: 10,
        taxPercent: 10,
      });

      // (1000 * 0.9) * 1.1 = 990
      expect(result.toNumber()).toBe(990);
    });

    it('should throw error for invalid quantity', () => {
      expect(() => {
        CalculationService.calculateLineItemTotal({
          quantity: 0,
          unitPrice: 100,
          discountPercent: 0,
          taxPercent: 0,
        });
      }).toThrow(AppError);
    });

    it('should throw error for invalid discount percent', () => {
      expect(() => {
        CalculationService.calculateLineItemTotal({
          quantity: 10,
          unitPrice: 100,
          discountPercent: 150,
          taxPercent: 0,
        });
      }).toThrow(AppError);
    });
  });

  describe('recalculateOfferTotals', () => {
    it('should calculate offer totals from line items', () => {
      const lineItems = [
        {
          quantity: new Decimal(10),
          unitPrice: new Decimal(100),
          discountPercent: new Decimal(5),
          taxPercent: new Decimal(10),
          totalPrice: new Decimal(1045),
        },
        {
          quantity: new Decimal(5),
          unitPrice: new Decimal(50),
          discountPercent: new Decimal(0),
          taxPercent: new Decimal(10),
          totalPrice: new Decimal(275),
        },
      ];

      const totals = CalculationService.recalculateOfferTotals(lineItems);

      expect(totals.subtotal.toNumber()).toBe(1250); // 1000 + 250
      expect(totals.grandTotal.toNumber()).toBe(1320); // 1045 + 275
    });
  });
});

