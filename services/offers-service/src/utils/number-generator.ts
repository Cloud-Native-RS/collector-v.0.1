import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate sequential offer number
 * Format: OFF-XXXXX (e.g., OFF-00001)
 */
export async function generateOfferNumber(tenantId: string): Promise<string> {
  const prefix = 'OFF-';

  // Find the highest sequence number
  const lastOffer = await prisma.offer.findFirst({
    where: {
      tenantId,
      offerNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      offerNumber: 'desc',
    },
    select: {
      offerNumber: true,
    },
  });

  let sequence = 1;
  if (lastOffer) {
    const lastSequence = parseInt(lastOffer.offerNumber.slice(4), 10);
    sequence = lastSequence + 1;
  }

  const sequenceStr = sequence.toString().padStart(5, '0');
  return `${prefix}${sequenceStr}`;
}

