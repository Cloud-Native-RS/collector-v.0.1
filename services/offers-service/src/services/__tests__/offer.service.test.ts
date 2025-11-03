import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Currency, OfferStatus } from '@prisma/client';
import { OfferService } from '../offer.service';
import { AppError } from '../../middleware/error-handler';

const prisma = new PrismaClient();

describe('OfferService', () => {
  const tenantId = 'test-tenant-1';
  const customerId = 'test-customer-1';

  beforeEach(async () => {
    // Clean up test data
    await prisma.approval.deleteMany({ where: { tenantId } });
    await prisma.offerLineItem.deleteMany({ where: { tenantId } });
    await prisma.offer.deleteMany({ where: { tenantId } });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.approval.deleteMany({ where: { tenantId } });
    await prisma.offerLineItem.deleteMany({ where: { tenantId } });
    await prisma.offer.deleteMany({ where: { tenantId } });
  });

  describe('createOffer', () => {
    it('should create an offer with line items', async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const offer = await OfferService.createOffer(
        {
          customerId,
          validUntil: validUntil.toISOString(),
          currency: Currency.USD,
          lineItems: [
            {
              description: 'Test Product',
              quantity: 10,
              unitPrice: 100,
              discountPercent: 5,
              taxPercent: 10,
            },
          ],
        },
        tenantId
      );

      expect(offer).toBeDefined();
      expect(offer.customerId).toBe(customerId);
      expect(offer.status).toBe(OfferStatus.DRAFT);
      expect(offer.lineItems.length).toBe(1);
      expect(offer.offerNumber).toMatch(/^OFF-\d{8}-\d{5}$/);
    });

    it('should throw error if validUntil is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await expect(
        OfferService.createOffer(
          {
            customerId,
            validUntil: pastDate.toISOString(),
            currency: Currency.USD,
            lineItems: [
              {
                description: 'Test Product',
                quantity: 10,
                unitPrice: 100,
              },
            ],
          },
          tenantId
        )
      ).rejects.toThrow(AppError);
    });
  });

  describe('getOfferById', () => {
    it('should retrieve an offer by ID', async () => {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const created = await OfferService.createOffer(
        {
          customerId,
          validUntil: validUntil.toISOString(),
          currency: Currency.USD,
          lineItems: [
            {
              description: 'Test Product',
              quantity: 10,
              unitPrice: 100,
            },
          ],
        },
        tenantId
      );

      const retrieved = await OfferService.getOfferById(created.id, tenantId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.customerId).toBe(customerId);
    });

    it('should return null for non-existent offer', async () => {
      const result = await OfferService.getOfferById('non-existent-id', tenantId);
      expect(result).toBeNull();
    });
  });
});

