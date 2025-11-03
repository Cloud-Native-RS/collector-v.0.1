import { PrismaClient, Offer, OfferStatus, Currency, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../middleware/error-handler';
import { generateOfferNumber } from '../utils/number-generator';
import { CalculationService } from './calculation.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateOfferInput {
  customerId: string;
  validUntil: Date | string;
  currency: Currency;
  notes?: string;
  lineItems: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
  }>;
}

export interface UpdateOfferInput {
  customerId?: string;
  validUntil?: Date | string;
  currency?: Currency;
  notes?: string;
  status?: OfferStatus;
}

export interface OfferWithLineItems extends Offer {
  lineItems: Array<{
    id: string;
    productId: string | null;
    description: string;
    quantity: Decimal;
    unitPrice: Decimal;
    discountPercent: Decimal;
    taxPercent: Decimal;
    totalPrice: Decimal;
    lineNumber: number;
  }>;
}

/**
 * Offer Service
 * Manages offer creation, updates, retrieval, and business logic
 */
export class OfferService {
  /**
   * Create a new offer with line items
   */
  static async createOffer(input: CreateOfferInput, tenantId: string): Promise<OfferWithLineItems> {
    // Generate offer number
    const offerNumber = await generateOfferNumber(tenantId);

    // Validate validUntil date
    const validUntil = typeof input.validUntil === 'string' ? new Date(input.validUntil) : input.validUntil;
    if (validUntil <= new Date()) {
      throw new AppError('Valid until date must be in the future', 400);
    }

    // Process line items and calculate totals
    const processedLineItems = input.lineItems.map((item, index) => {
      const discountPercent = new Decimal(item.discountPercent || 0);
      const taxPercent = new Decimal(item.taxPercent || 0);
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);

      const totalPrice = CalculationService.calculateLineItemTotal({
        quantity,
        unitPrice,
        discountPercent,
        taxPercent,
      });

      return {
        productId: item.productId || null,
        description: item.description,
        quantity,
        unitPrice,
        discountPercent,
        taxPercent,
        totalPrice,
        lineNumber: index + 1,
        tenantId,
      };
    });

    // Calculate offer totals
    const totals = CalculationService.recalculateOfferTotals(processedLineItems);

    // Create offer with line items
    const offer = await prisma.offer.create({
      data: {
        offerNumber,
        customerId: input.customerId,
        status: OfferStatus.DRAFT,
        issueDate: new Date(),
        validUntil,
        currency: input.currency,
        notes: input.notes,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
        tenantId,
        version: 1,
        lineItems: {
          create: processedLineItems,
        },
      },
      include: {
        lineItems: true,
      },
    });

    return offer as OfferWithLineItems;
  }

  /**
   * Get offer by ID
   */
  static async getOfferById(id: string, tenantId: string): Promise<OfferWithLineItems | null> {
    const offer = await prisma.offer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        lineItems: {
          orderBy: {
            lineNumber: 'asc',
          },
        },
        approvals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    // Check if expired
    if (offer.status === OfferStatus.SENT && new Date() > offer.validUntil) {
      await this.markOfferAsExpired(id, tenantId);
      offer.status = OfferStatus.EXPIRED;
    }

    return offer as OfferWithLineItems;
  }

  /**
   * List offers with filters
   */
  static async listOffers(
    tenantId: string,
    filters?: {
      customerId?: string;
      status?: OfferStatus;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ offers: OfferWithLineItems[]; total: number }> {
    const where: Prisma.OfferWhereInput = {
      tenantId,
    };

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) {
        where.issueDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.issueDate.lte = filters.dateTo;
      }
    }

    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where,
        include: {
          lineItems: {
            orderBy: {
              lineNumber: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.offer.count({ where }),
    ]);

    return {
      offers: offers as OfferWithLineItems[],
      total,
    };
  }

  /**
   * Update offer (only if not approved/rejected)
   */
  static async updateOffer(
    id: string,
    input: UpdateOfferInput,
    tenantId: string
  ): Promise<OfferWithLineItems> {
    const existingOffer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!existingOffer) {
      throw new AppError('Offer not found', 404);
    }

    if (existingOffer.status === OfferStatus.APPROVED || existingOffer.status === OfferStatus.REJECTED) {
      throw new AppError('Cannot update offer after approval or rejection', 400);
    }

    const updateData: Prisma.OfferUpdateInput = {};

    if (input.customerId) {
      updateData.customerId = input.customerId;
    }

    if (input.validUntil) {
      const validUntil = typeof input.validUntil === 'string' ? new Date(input.validUntil) : input.validUntil;
      if (validUntil <= new Date()) {
        throw new AppError('Valid until date must be in the future', 400);
      }
      updateData.validUntil = validUntil;
    }

    if (input.currency) {
      updateData.currency = input.currency;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    if (input.status) {
      updateData.status = input.status;
    }

    // If line items changed, recalculate totals
    if (updateData.lineItems) {
      const lineItems = await prisma.offerLineItem.findMany({
        where: { offerId: id },
      });

      const totals = CalculationService.recalculateOfferTotals(lineItems);
      updateData.subtotal = totals.subtotal;
      updateData.discountTotal = totals.discountTotal;
      updateData.taxTotal = totals.taxTotal;
      updateData.grandTotal = totals.grandTotal;
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: {
          orderBy: {
            lineNumber: 'asc',
          },
        },
      },
    });

    return offer as OfferWithLineItems;
  }

  /**
   * Mark offer as expired
   */
  static async markOfferAsExpired(id: string, tenantId: string): Promise<void> {
    await prisma.offer.updateMany({
      where: {
        id,
        tenantId,
        status: OfferStatus.SENT, // Only expire sent offers
      },
      data: {
        status: OfferStatus.EXPIRED,
      },
    });
  }

  /**
   * Clone offer into a new revision
   */
  static async cloneOffer(id: string, tenantId: string): Promise<OfferWithLineItems> {
    const originalOffer = await prisma.offer.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: true,
      },
    });

    if (!originalOffer) {
      throw new AppError('Offer not found', 404);
    }

    // Generate new offer number
    const offerNumber = await generateOfferNumber(tenantId);

    // Create new offer as revision
    const newOffer = await prisma.offer.create({
      data: {
        offerNumber,
        customerId: originalOffer.customerId,
        status: OfferStatus.DRAFT,
        issueDate: new Date(),
        validUntil: originalOffer.validUntil,
        currency: originalOffer.currency,
        notes: originalOffer.notes,
        subtotal: originalOffer.subtotal,
        discountTotal: originalOffer.discountTotal,
        taxTotal: originalOffer.taxTotal,
        grandTotal: originalOffer.grandTotal,
        tenantId,
        parentOfferId: id,
        version: originalOffer.version + 1,
        lineItems: {
          create: originalOffer.lineItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            taxPercent: item.taxPercent,
            totalPrice: item.totalPrice,
            lineNumber: item.lineNumber,
            tenantId,
          })),
        },
      },
      include: {
        lineItems: {
          orderBy: {
            lineNumber: 'asc',
          },
        },
      },
    });

    return newOffer as OfferWithLineItems;
  }

  /**
   * Get offers by customer ID
   */
  static async getOffersByCustomer(
    customerId: string,
    tenantId: string,
    activeOnly: boolean = false
  ): Promise<OfferWithLineItems[]> {
    const where: Prisma.OfferWhereInput = {
      customerId,
      tenantId,
    };

    if (activeOnly) {
      where.status = {
        in: [OfferStatus.DRAFT, OfferStatus.SENT],
      };
      where.validUntil = {
        gte: new Date(),
      };
    }

    const offers = await prisma.offer.findMany({
      where,
      include: {
        lineItems: {
          orderBy: {
            lineNumber: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return offers as OfferWithLineItems[];
  }

  /**
   * Generate approval token for external approval links
   */
  static async generateApprovalToken(id: string, tenantId: string): Promise<string> {
    const offer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== OfferStatus.DRAFT && offer.status !== OfferStatus.SENT) {
      throw new AppError('Cannot generate approval token for this offer status', 400);
    }

    const token = uuidv4();

    await prisma.offer.update({
      where: { id },
      data: { approvalToken: token },
    });

    return token;
  }
}

