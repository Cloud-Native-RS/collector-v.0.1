import { v4 as uuidv4 } from 'uuid';

const ORDER_NUMBER_PREFIX = process.env.ORDER_NUMBER_PREFIX || 'ORD';

/**
 * Generate a unique sequential order number
 * Format: ORD-YYYYMMDD-XXXXXX (where XXXXXX is a 6-digit sequential number)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
  
  return `${ORDER_NUMBER_PREFIX}-${dateStr}-${randomSuffix}`;
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(): string {
  return `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;
}

