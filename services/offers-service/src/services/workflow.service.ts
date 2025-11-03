import { PrismaClient, OfferStatus, ApprovalStatus } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { OfferService } from './offer.service';

const prisma = new PrismaClient();

export interface ApprovalInput {
  approverEmail: string;
  comments?: string;
}

/**
 * Workflow Service
 * Manages approval workflows and offer status transitions
 */
export class WorkflowService {
  /**
   * Send offer (transition from DRAFT to SENT)
   */
  static async sendOffer(id: string, tenantId: string): Promise<void> {
    const offer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== OfferStatus.DRAFT) {
      throw new AppError(`Cannot send offer with status ${offer.status}`, 400);
    }

    // Validate offer has line items
    const lineItemCount = await prisma.offerLineItem.count({
      where: { offerId: id },
    });

    if (lineItemCount === 0) {
      throw new AppError('Cannot send offer without line items', 400);
    }

    // Generate approval token if not exists
    let approvalToken = offer.approvalToken;
    if (!approvalToken) {
      approvalToken = await OfferService.generateApprovalToken(id, tenantId);
    }

    // Update status to SENT
    await prisma.offer.update({
      where: { id },
      data: {
        status: OfferStatus.SENT,
        approvalToken,
      },
    });
  }

  /**
   * Approve offer (customer approval)
   */
  static async approveOffer(
    id: string,
    input: ApprovalInput,
    tenantId: string
  ): Promise<void> {
    const offer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== OfferStatus.SENT && offer.status !== OfferStatus.DRAFT) {
      throw new AppError(`Cannot approve offer with status ${offer.status}`, 400);
    }

    // Check if expired
    if (new Date() > offer.validUntil) {
      await OfferService.markOfferAsExpired(id, tenantId);
      throw new AppError('Cannot approve expired offer', 400);
    }

    // Create approval record
    await prisma.approval.create({
      data: {
        offerId: id,
        approverEmail: input.approverEmail,
        status: ApprovalStatus.APPROVED,
        comments: input.comments,
        approvedAt: new Date(),
        tenantId,
      },
    });

    // Update offer status
    await prisma.offer.update({
      where: { id },
      data: {
        status: OfferStatus.APPROVED,
      },
    });
  }

  /**
   * Reject offer (customer rejection)
   */
  static async rejectOffer(
    id: string,
    input: ApprovalInput,
    tenantId: string
  ): Promise<void> {
    const offer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== OfferStatus.SENT && offer.status !== OfferStatus.DRAFT) {
      throw new AppError(`Cannot reject offer with status ${offer.status}`, 400);
    }

    // Create approval record
    await prisma.approval.create({
      data: {
        offerId: id,
        approverEmail: input.approverEmail,
        status: ApprovalStatus.REJECTED,
        comments: input.comments,
        tenantId,
      },
    });

    // Update offer status
    await prisma.offer.update({
      where: { id },
      data: {
        status: OfferStatus.REJECTED,
      },
    });
  }

  /**
   * Approve offer by token (external approval link)
   */
  static async approveOfferByToken(
    token: string,
    approverEmail: string,
    approved: boolean,
    comments?: string
  ): Promise<void> {
    const offer = await prisma.offer.findFirst({
      where: { approvalToken: token },
    });

    if (!offer) {
      throw new AppError('Invalid approval token', 404);
    }

    // Check if expired
    if (new Date() > offer.validUntil) {
      await OfferService.markOfferAsExpired(offer.id, offer.tenantId);
      throw new AppError('Cannot approve/reject expired offer', 400);
    }

    if (offer.status !== OfferStatus.SENT && offer.status !== OfferStatus.DRAFT) {
      throw new AppError(`Cannot change approval status for offer with status ${offer.status}`, 400);
    }

    // Create approval record
    await prisma.approval.create({
      data: {
        offerId: offer.id,
        approverEmail,
        status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
        comments,
        approvedAt: approved ? new Date() : null,
        tenantId: offer.tenantId,
      },
    });

    // Update offer status
    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: approved ? OfferStatus.APPROVED : OfferStatus.REJECTED,
      },
    });
  }

  /**
   * Cancel offer
   */
  static async cancelOffer(id: string, tenantId: string): Promise<void> {
    const offer = await prisma.offer.findFirst({
      where: { id, tenantId },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status === OfferStatus.APPROVED || offer.status === OfferStatus.REJECTED) {
      throw new AppError('Cannot cancel approved or rejected offer', 400);
    }

    await prisma.offer.update({
      where: { id },
      data: {
        status: OfferStatus.CANCELLED,
      },
    });
  }
}

