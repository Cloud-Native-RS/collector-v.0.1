import Decimal from 'decimal.js';
import { AppError } from '../middleware/error-handler';

/**
 * Calculation Service
 * Handles all price calculation logic including discounts, taxes, and totals
 */
export class CalculationService {
  /**
   * Calculate line item total price
   * Formula: (quantity * unitPrice * (1 - discountPercent/100)) * (1 + taxPercent/100)
   */
  static calculateLineItemTotal(params: {
    quantity: number | Decimal;
    unitPrice: number | Decimal;
    discountPercent: number | Decimal;
    taxPercent: number | Decimal;
  }): Decimal {
    const quantity = typeof params.quantity === 'number' ? new Decimal(params.quantity) : params.quantity;
    const unitPrice = typeof params.unitPrice === 'number' ? new Decimal(params.unitPrice) : params.unitPrice;
    const discountPercent = typeof params.discountPercent === 'number' ? new Decimal(params.discountPercent) : params.discountPercent;
    const taxPercent = typeof params.taxPercent === 'number' ? new Decimal(params.taxPercent) : params.taxPercent;

    // Validate inputs
    if (quantity.lessThanOrEqualTo(0)) {
      throw new AppError('Quantity must be greater than zero', 400);
    }
    if (unitPrice.lessThan(0)) {
      throw new AppError('Unit price cannot be negative', 400);
    }
    if (discountPercent.lessThan(0) || discountPercent.greaterThan(100)) {
      throw new AppError('Discount percent must be between 0 and 100', 400);
    }
    if (taxPercent.lessThan(0) || taxPercent.greaterThan(100)) {
      throw new AppError('Tax percent must be between 0 and 100', 400);
    }

    // Calculate subtotal after discount
    const subtotal = quantity.mul(unitPrice);
    const discountAmount = subtotal.mul(discountPercent.div(100));
    const subtotalAfterDiscount = subtotal.minus(discountAmount);

    // Apply tax
    const taxAmount = subtotalAfterDiscount.mul(taxPercent.div(100));
    const total = subtotalAfterDiscount.plus(taxAmount);

    // Round to 4 decimal places
    return new Decimal(total.toFixed(4));
  }

  /**
   * Calculate discount amount for a line item
   */
  static calculateDiscountAmount(params: {
    quantity: number | Decimal;
    unitPrice: number | Decimal;
    discountPercent: number | Decimal;
  }): Decimal {
    const quantity = typeof params.quantity === 'number' ? new Decimal(params.quantity) : params.quantity;
    const unitPrice = typeof params.unitPrice === 'number' ? new Decimal(params.unitPrice) : params.unitPrice;
    const discountPercent = typeof params.discountPercent === 'number' ? new Decimal(params.discountPercent) : params.discountPercent;

    const subtotal = quantity.mul(unitPrice);
    const discountAmount = subtotal.mul(discountPercent.div(100));
    
    return new Decimal(discountAmount.toFixed(4));
  }

  /**
   * Calculate tax amount for a line item
   */
  static calculateTaxAmount(params: {
    quantity: number | Decimal;
    unitPrice: number | Decimal;
    discountPercent: number | Decimal;
    taxPercent: number | Decimal;
  }): Decimal {
    const quantity = typeof params.quantity === 'number' ? new Decimal(params.quantity) : params.quantity;
    const unitPrice = typeof params.unitPrice === 'number' ? new Decimal(params.unitPrice) : params.unitPrice;
    const discountPercent = typeof params.discountPercent === 'number' ? new Decimal(params.discountPercent) : params.discountPercent;
    const taxPercent = typeof params.taxPercent === 'number' ? new Decimal(params.taxPercent) : params.taxPercent;

    const subtotal = quantity.mul(unitPrice);
    const discountAmount = subtotal.mul(discountPercent.div(100));
    const subtotalAfterDiscount = subtotal.minus(discountAmount);
    const taxAmount = subtotalAfterDiscount.mul(taxPercent.div(100));

    return new Decimal(taxAmount.toFixed(4));
  }

  /**
   * Recalculate offer totals from line items
   */
  static recalculateOfferTotals(
    lineItems: Array<{
      quantity: Decimal;
      unitPrice: Decimal;
      discountPercent: Decimal;
      taxPercent: Decimal;
      totalPrice: Decimal;
    }>
  ): {
    subtotal: Decimal;
    discountTotal: Decimal;
    taxTotal: Decimal;
    grandTotal: Decimal;
  } {
    let subtotal = new Decimal(0);
    let discountTotal = new Decimal(0);
    let taxTotal = new Decimal(0);
    let grandTotal = new Decimal(0);

    for (const item of lineItems) {
      // Subtotal before discount
      const itemSubtotal = item.quantity.mul(item.unitPrice);
      subtotal = subtotal.plus(itemSubtotal);

      // Discount amount
      const itemDiscount = this.calculateDiscountAmount({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      });
      discountTotal = discountTotal.plus(itemDiscount);

      // Tax amount
      const itemTax = this.calculateTaxAmount({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      });
      taxTotal = taxTotal.plus(itemTax);

      // Grand total (using pre-calculated totalPrice or recalculating)
      grandTotal = grandTotal.plus(item.totalPrice);
    }

    return {
      subtotal: new Decimal(subtotal.toFixed(4)),
      discountTotal: new Decimal(discountTotal.toFixed(4)),
      taxTotal: new Decimal(taxTotal.toFixed(4)),
      grandTotal: new Decimal(grandTotal.toFixed(4)),
    };
  }
}
