import axios, { AxiosInstance } from 'axios';
import { OfferWithLineItems } from './offer.service';

/**
 * Integration Service
 * Handles CRM integration and external system communication
 */
export class IntegrationService {
  private crmClient: AxiosInstance | null = null;

  constructor() {
    const crmUrl = process.env.CRM_API_URL;
    const crmApiKey = process.env.CRM_API_KEY;

    if (crmUrl && crmApiKey) {
      this.crmClient = axios.create({
        baseURL: crmUrl,
        headers: {
          'Authorization': `Bearer ${crmApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
    }
  }

  /**
   * Push offer update to CRM system
   */
  async pushOfferToCRM(offer: OfferWithLineItems): Promise<void> {
    if (!this.crmClient) {
      console.warn('CRM integration not configured, skipping push');
      return;
    }

    try {
      const payload = {
        offerId: offer.id,
        offerNumber: offer.offerNumber,
        customerId: offer.customerId,
        status: offer.status,
        issueDate: offer.issueDate.toISOString(),
        validUntil: offer.validUntil.toISOString(),
        currency: offer.currency,
        subtotal: offer.subtotal.toString(),
        discountTotal: offer.discountTotal.toString(),
        taxTotal: offer.taxTotal.toString(),
        grandTotal: offer.grandTotal.toString(),
        lineItems: offer.lineItems.map((item) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: item.discountPercent.toString(),
          taxPercent: item.taxPercent.toString(),
          totalPrice: item.totalPrice.toString(),
        })),
      };

      await this.crmClient.post('/webhooks/offers/update', payload);
      console.log(`Pushed offer ${offer.offerNumber} to CRM`);
    } catch (error) {
      console.error('Failed to push offer to CRM:', error);
      // Don't throw - integration failures shouldn't break the main flow
    }
  }

  /**
   * Get customer data from CRM
   */
  async getCustomerFromCRM(customerId: string): Promise<any> {
    if (!this.crmClient) {
      throw new Error('CRM integration not configured');
    }

    try {
      const response = await this.crmClient.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch customer ${customerId} from CRM:`, error);
      throw error;
    }
  }

  /**
   * Send notification via webhook
   */
  async sendNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Publish offer event to message queue
   */
  async publishOfferEvent(eventType: string, offer: OfferWithLineItems): Promise<void> {
    if (eventType === 'offer.approved') {
      const { eventBus, EventType } = await import('../utils/event-bus');
      await eventBus.connect();
      
      await eventBus.publish({
        type: EventType.OFFER_APPROVED,
        timestamp: new Date().toISOString(),
        tenantId: offer.tenantId,
        source: 'offers-service',
        data: {
          offerId: offer.id,
          offerNumber: offer.offerNumber,
          customerId: offer.customerId,
          validUntil: offer.validUntil.toISOString(),
          currency: offer.currency,
          grandTotal: offer.grandTotal.toString(),
          lineItems: offer.lineItems.map((item) => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            discountPercent: item.discountPercent.toString(),
            taxPercent: item.taxPercent.toString(),
          })),
        },
      });
    }
  }
}

