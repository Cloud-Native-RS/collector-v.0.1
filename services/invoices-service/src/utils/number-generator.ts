/**
 * Generate unique invoice numbers
 */

const INVOICE_PREFIX = 'INV';
const MAX_ID_LENGTH = 8;

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${INVOICE_PREFIX}-${dateStr}-${random}`;
}

/**
 * Generate a sequential invoice number based on a counter
 * Format: INV-YYYY-CNNNNN
 */
export function generateSequentialInvoiceNumber(counter: number): string {
  const year = new Date().getFullYear();
  const paddedCounter = String(counter).padStart(5, '0');
  return `${INVOICE_PREFIX}-${year}-${paddedCounter}`;
}

