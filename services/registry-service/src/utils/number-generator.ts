/**
 * Generate unique customer or company numbers
 */

const CUSTOMER_PREFIX = 'CUST';
const COMPANY_PREFIX = 'COMP';
const MAX_ID_LENGTH = 8;

/**
 * Generate a unique customer number
 */
export function generateCustomerNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const id = (timestamp + random).substring(0, MAX_ID_LENGTH);
  return `${CUSTOMER_PREFIX}-${id}`;
}

/**
 * Generate a unique company number
 */
export function generateCompanyNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const id = (timestamp + random).substring(0, MAX_ID_LENGTH);
  return `${COMPANY_PREFIX}-${id}`;
}

