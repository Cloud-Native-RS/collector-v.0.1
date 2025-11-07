import { OfferService } from './offer.service';
import { AppError } from '../middleware/error-handler';

const INVOICES_SERVICE_URL = process.env.INVOICES_SERVICE_URL || 'http://localhost:3004';

/**
 * Invoice Integration Service
 * Handles communication with invoices-service for offer-to-invoice conversion
 */
export class InvoiceIntegrationService {
  /**
   * Convert offer to invoice via invoices-service API
   */
  static async convertOfferToInvoice(offerId: string, tenantId: string): Promise<string> {
    // Get offer details
    const offer = await OfferService.getOfferById(offerId, tenantId);

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    if (offer.status !== 'APPROVED') {
      throw new AppError('Only approved offers can be converted to invoices', 400);
    }

    if (offer.convertedToInvoiceId) {
      throw new AppError('Offer already converted to invoice', 400);
    }

    try {
      // Prepare invoice data from offer
      const invoiceData = {
        customerId: offer.customerId,
        customerName: offer.customerName,
        dueDate: offer.validUntil,
        currency: offer.currency,
        issueDate: new Date().toISOString(),
        lineItems: offer.lineItems.map((item) => ({
          description: item.name || item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          unit: item.unit,
          productId: item.productId,
        })),
        notes: offer.notes,
        customerDetails: offer.customerDetails,
        fromDetails: offer.fromDetails,
        paymentDetails: offer.paymentDetails,
        noteDetails: offer.noteDetails,
        topBlock: offer.topBlock,
        bottomBlock: offer.bottomBlock,
        template: offer.template,
        logoUrl: offer.logoUrl,
        dateFormat: offer.dateFormat,
        locale: offer.locale,
        timezone: offer.timezone,
        includeDecimals: offer.includeDecimals,
        includeUnits: offer.includeUnits,
        // Reference to original offer
        sourceOfferId: offer.id,
        sourceOfferNumber: offer.offerNumber,
      };

      // Call invoices-service API
      const response = await fetch(`${INVOICES_SERVICE_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to create invoice');
      }

      const result = await response.json();
      const invoiceId = result.data?.id;

      if (!invoiceId) {
        throw new Error('Invoice ID not returned from invoices-service');
      }

      // Update offer with invoice reference
      await OfferService.updateOffer(
        offerId,
        { convertedToInvoiceId: invoiceId },
        tenantId
      );

      return invoiceId;
    } catch (error) {
      console.error('[Invoice Integration] Error converting offer to invoice:', error);
      throw new AppError(
        error instanceof Error ? error.message : 'Failed to convert offer to invoice',
        500
      );
    }
  }
}

