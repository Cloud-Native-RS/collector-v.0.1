import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate line item total with discount and tax
 */
export function calculateLineItemTotal(
  quantity: number | Decimal,
  unitPrice: number | Decimal,
  discountPercent: number | Decimal = 0,
  taxPercent: number | Decimal = 0
): Decimal {
  const qty = typeof quantity === 'number' ? quantity : quantity.toNumber();
  const price = typeof unitPrice === 'number' ? unitPrice : unitPrice.toNumber();
  const discount = typeof discountPercent === 'number' ? discountPercent : discountPercent.toNumber();
  const tax = typeof taxPercent === 'number' ? taxPercent : taxPercent.toNumber();

  // Calculate subtotal
  const subtotal = qty * price;

  // Apply discount
  const afterDiscount = subtotal * (1 - discount / 100);

  // Apply tax
  const total = afterDiscount * (1 + tax / 100);

  return new Decimal(total.toFixed(2));
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(lineItems: Array<{ totalPrice: number | Decimal }>): Decimal {
  const total = lineItems.reduce((sum, item) => {
    const price = typeof item.totalPrice === 'number' ? item.totalPrice : item.totalPrice.toNumber();
    return sum + price;
  }, 0);

  return new Decimal(total.toFixed(2));
}

/**
 * Calculate tax total from line items
 */
export function calculateTaxTotal(
  lineItems: Array<{ 
    quantity: number | Decimal;
    unitPrice: number | Decimal;
    discountPercent: number | Decimal;
    taxPercent: number | Decimal;
  }>
): Decimal {
  let total = 0;

  for (const item of lineItems) {
    const qty = typeof item.quantity === 'number' ? item.quantity : item.quantity.toNumber();
    const price = typeof item.unitPrice === 'number' ? item.unitPrice : item.unitPrice.toNumber();
    const discount = typeof item.discountPercent === 'number' ? item.discountPercent : item.discountPercent.toNumber();
    const tax = typeof item.taxPercent === 'number' ? item.taxPercent : item.taxPercent.toNumber();

    const subtotal = qty * price;
    const afterDiscount = subtotal * (1 - discount / 100);
    const taxAmount = afterDiscount * (tax / 100);

    total += taxAmount;
  }

  return new Decimal(total.toFixed(2));
}

/**
 * Check if invoice is overdue
 */
export function isOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(dueDate: Date): number {
  if (!isOverdue(dueDate)) return 0;
  
  const today = new Date();
  const diffTime = today.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

