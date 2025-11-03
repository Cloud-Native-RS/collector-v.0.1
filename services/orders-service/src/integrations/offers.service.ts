import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/error-handler';
import { retry, withTimeout } from '../utils/retry';

export interface Offer {
  id: string;
  customerId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  lineItems: OfferLineItem[];
  totalAmount: number;
  currency: string;
  validUntil?: Date;
}

export interface OfferLineItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  sku?: string;
}

export class OffersService {
  private client: AxiosInstance;
  private apiTimeout: number;

  constructor() {
    const baseURL = process.env.OFFERS_SERVICE_URL || 'http://localhost:3003';
    this.apiTimeout = parseInt(process.env.API_TIMEOUT || '10000');

    this.client = axios.create({
      baseURL,
      timeout: this.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch an approved offer by ID
   * Validates that the offer is approved and not expired
   */
  async getApprovedOffer(offerId: string, tenantId: string): Promise<Offer> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.get(`/api/offers/${offerId}`, {
            headers: {
              'x-tenant-id': tenantId,
            },
          }),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      const offer: Offer = response.data.data || response.data;

      // Validate offer status
      if (offer.status !== 'APPROVED') {
        throw new AppError(
          `Offer ${offerId} is not approved. Current status: ${offer.status}`,
          400
        );
      }

      // Check expiration
      if (offer.validUntil && new Date(offer.validUntil) < new Date()) {
        throw new AppError(`Offer ${offerId} has expired`, 400);
      }

      return offer;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error.response?.status === 404) {
        throw new AppError(`Offer ${offerId} not found`, 404);
      }

      throw new AppError(
        `Failed to fetch offer: ${error.message}`,
        503
      );
    }
  }

  /**
   * Mark offer as used/consumed
   */
  async markOfferAsUsed(offerId: string, orderId: string, tenantId: string): Promise<void> {
    try {
      await retry(
        () => withTimeout(
          this.client.post(
            `/api/offers/${offerId}/consume`,
            { orderId },
            {
              headers: {
                'x-tenant-id': tenantId,
              },
            }
          ),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );
    } catch (error: any) {
      // Log but don't fail order creation if offer marking fails
      console.error(`Failed to mark offer ${offerId} as used:`, error.message);
    }
  }
}

