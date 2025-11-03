/**
 * Generate unique lead and deal numbers
 */

const LEAD_PREFIX = 'LEAD';
const DEAL_PREFIX = 'DEAL';
const MAX_ID_LENGTH = 8;

// Counter for ensuring uniqueness when called rapidly
let leadCounter = Date.now();
let dealCounter = Date.now();

/**
 * Generate a unique lead number
 */
export function generateLeadNumber(): string {
  leadCounter++;
  const uniqueId = leadCounter.toString(36).toUpperCase().padStart(MAX_ID_LENGTH, '0');
  return `${LEAD_PREFIX}-${uniqueId.substring(0, MAX_ID_LENGTH)}`;
}

/**
 * Generate a unique deal number
 */
export function generateDealNumber(): string {
  dealCounter++;
  const uniqueId = dealCounter.toString(36).toUpperCase().padStart(MAX_ID_LENGTH, '0');
  return `${DEAL_PREFIX}-${uniqueId.substring(0, MAX_ID_LENGTH)}`;
}

