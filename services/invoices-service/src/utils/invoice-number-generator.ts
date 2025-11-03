/**
 * Generate unique, sequential invoice numbers
 * Format: INV-YYYYMMDD-XXXXX (e.g., INV-20240101-00001)
 */

import { prisma } from '../config/database';

export async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const today = new Date();
  const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const prefix = `INV-${datePrefix}-`;

  // Find the last invoice number for today
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      tenantId,
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
  });

  let sequence = 1;

  if (lastInvoice) {
    // Extract sequence number from last invoice
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }

  // Format: INV-YYYYMMDD-00001
  const invoiceNumber = `${prefix}${String(sequence).padStart(5, '0')}`;

  // Verify uniqueness (double-check)
  const existing = await prisma.invoice.findUnique({
    where: {
      invoiceNumber,
    },
  });

  if (existing) {
    // If collision, increment and try again
    return generateInvoiceNumber(tenantId);
  }

  return invoiceNumber;
}

