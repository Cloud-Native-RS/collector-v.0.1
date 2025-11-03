/**
 * Tax calculation utilities
 * Supports various tax calculation methods per tenant
 */

export interface TaxRule {
  type: 'percentage' | 'flat';
  rate: number;
  appliesTo: 'line' | 'total';
}

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
}

/**
 * Calculate line item total with discount and tax
 */
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  taxPercent: number = 0
): number {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discountPercent) / 100;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = (discountedSubtotal * taxPercent) / 100;
  return Math.round((discountedSubtotal + taxAmount) * 100) / 100;
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: Array<{
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
  }>,
  globalDiscountPercent: number = 0
): TaxCalculationResult {
  let subtotal = 0;
  let lineTaxTotal = 0;

  // Calculate subtotal and line item taxes
  lineItems.forEach((item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = (itemSubtotal * item.discountPercent) / 100;
    const discountedSubtotal = itemSubtotal - itemDiscount;
    const itemTax = (discountedSubtotal * item.taxPercent) / 100;

    subtotal += discountedSubtotal;
    lineTaxTotal += itemTax;
  });

  // Apply global discount if any
  const globalDiscountAmount = (subtotal * globalDiscountPercent) / 100;
  const discountedSubtotal = subtotal - globalDiscountAmount;

  const taxTotal = lineTaxTotal;
  const grandTotal = Math.round((discountedSubtotal + taxTotal) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxTotal * 100) / 100,
    discountAmount: Math.round(globalDiscountAmount * 100) / 100,
    grandTotal,
  };
}

/**
 * Calculate tax based on tenant-specific rules
 */
export function calculateTax(
  amount: number,
  taxRules: TaxRule[],
  base: 'line' | 'total' = 'total'
): number {
  let totalTax = 0;

  taxRules.forEach((rule) => {
    if (rule.appliesTo === base) {
      if (rule.type === 'percentage') {
        totalTax += (amount * rule.rate) / 100;
      } else {
        totalTax += rule.rate;
      }
    }
  });

  return Math.round(totalTax * 100) / 100;
}

/**
 * Apply currency conversion (placeholder for future implementation)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate?: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (!exchangeRate) {
    // In production, fetch from currency service
    // For now, use 1:1 exchange rate as placeholder
    exchangeRate = 1;
  }

  return Math.round((amount * exchangeRate) * 100) / 100;
}

