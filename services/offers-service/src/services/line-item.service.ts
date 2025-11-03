import { PrismaClient, OfferLineItem, OfferStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../middleware/error-handler';
import { CalculationService } from './calculation.service';

const prisma = new PrismaClient();

export interface CreateLineItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

/**
 * Line Item Service
 * Manages offer line items
 */
export class LineItemService {
  /**
   * Add line item to existing offer
   */
  static async addLineItem(
    offerId: string,
    input: CreateLineItemInput,
    tenantId: string
  ): Promise<OfferLineItem> {
    // Verify offer exists and can be modified
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status === OfferStatus.APPROVED || offer.status === OfferStatus.REJECTED) {
      throw new AppError('Cannot modify line items after approval or rejection', 400);
    }

    // Get current line items count for line number
    const lineItemCount = await prisma.offerLineItem.count({
      where: { offerId },
    });

    // Calculate line item total
    const discountPercent = new Decimal(input.discountPercent || 0);
    const taxPercent = new Decimal(input.taxPercent || 0);
    const quantity = new Decimal(input.quantity);
    const unitPrice = new Decimal(input.unitPrice);

    const totalPrice = CalculationService.calculateLineItemTotal({
      quantity,
      unitPrice,
      discountPercent,
      taxPercent,
    });

    // Create line item
    const lineItem = await prisma.offerLineItem.create({
      data: {
        offerId,
        productId: input.productId || null,
        description: input.description,
        quantity,
        unitPrice,
        discountPercent,
        taxPercent,
        totalPrice,
        lineNumber: lineItemCount + 1,
        tenantId,
      },
    });

    // Recalculate offer totals
    await this.recalculateOfferTotals(offerId, tenantId);

    return lineItem;
  }

  /**
   * Update line item
   */
  static async updateLineItem(
    id: string,
    offerId: string,
    input: Partial<CreateLineItemInput>,
    tenantId: string
  ): Promise<OfferLineItem> {
    // Verify offer exists and can be modified
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status === OfferStatus.APPROVED || offer.status === OfferStatus.REJECTED) {
      throw new AppError('Cannot modify line items after approval or rejection', 400);
    }

    // Get existing line item
    const existingItem = await prisma.offerLineItem.findFirst({
      where: { id, offerId, tenantId },
    });

    if (!existingItem) {
      throw new AppError('Line item not found', 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (input.productId !== undefined) {
      updateData.productId = input.productId || null;
    }
    if (input.description) {
      updateData.description = input.description;
    }
    if (input.quantity !== undefined) {
      updateData.quantity = new Decimal(input.quantity);
    }
    if (input.unitPrice !== undefined) {
      updateData.unitPrice = new Decimal(input.unitPrice);
    }
    if (input.discountPercent !== undefined) {
      updateData.discountPercent = new Decimal(input.discountPercent);
    }
    if (input.taxPercent !== undefined) {
      updateData.taxPercent = new Decimal(input.taxPercent);
    }

    // Recalculate total if any price-related field changed
    if (input.quantity !== undefined || input.unitPrice !== undefined ||
        input.discountPercent !== undefined || input.taxPercent !== undefined) {
      const quantity = updateData.quantity || existingItem.quantity;
      const unitPrice = updateData.unitPrice || existingItem.unitPrice;
      const discountPercent = updateData.discountPercent || existingItem.discountPercent;
      const taxPercent = updateData.taxPercent || existingItem.taxPercent;

      updateData.totalPrice = CalculationService.calculateLineItemTotal({
        quantity,
        unitPrice,
        discountPercent,
        taxPercent,
      });
    }

    // Update line item
    const updatedItem = await prisma.offerLineItem.update({
      where: { id },
      data: updateData,
    });

    // Recalculate offer totals
    await this.recalculateOfferTotals(offerId, tenantId);

    return updatedItem;
  }

  /**
   * Delete line item
   */
  static async deleteLineItem(id: string, offerId: string, tenantId: string): Promise<void> {
    // Verify offer exists and can be modified
    const offer = await prisma.offer.findFirst({
      where: { id: offerId, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status === OfferStatus.APPROVED || offer.status === OfferStatus.REJECTED) {
      throw new AppError('Cannot modify line items after approval or rejection', 400);
    }

    // Delete line item
    await prisma.offerLineItem.deleteMany({
      where: { id, offerId, tenantId },
    });

    // Recalculate offer totals
    await this.recalculateOfferTotals(offerId, tenantId);
  }

  /**
   * Recalculate offer totals from all line items
   */
  private static async recalculateOfferTotals(offerId: string, tenantId: string): Promise<void> {
    const lineItems = await prisma.offerLineItem.findMany({
      where: { offerId, tenantId },
    });

    const totals = CalculationService.recalculateOfferTotals(lineItems);

    await prisma.offer.update({
      where: { id: offerId },
      data: {
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        grandTotal: totals.grandTotal,
      },
    });
  }
}

