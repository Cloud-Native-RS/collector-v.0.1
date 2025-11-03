import axios, { AxiosInstance } from 'axios';
import { AppError } from '../middleware/error-handler';
import { retry, withTimeout } from '../utils/retry';

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
  phone?: string;
  email?: string;
}

export interface ShippingRequest {
  orderId: string;
  address: ShippingAddress;
  items: Array<{
    productId: string;
    quantity: number;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }>;
  shippingMethod?: string;
}

export interface ShippingResponse {
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
  shippingCost: number;
  shippingLabel?: string; // URL to shipping label
}

export interface TrackingInfo {
  trackingNumber: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  currentLocation?: string;
  estimatedDelivery?: Date;
  events: Array<{
    timestamp: Date;
    description: string;
    location?: string;
  }>;
}

export class ShippingService {
  private client: AxiosInstance;
  private apiTimeout: number;

  constructor() {
    const baseURL = process.env.SHIPPING_SERVICE_URL || 'http://localhost:3005';
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
   * Create shipping shipment
   */
  async createShipment(request: ShippingRequest, tenantId: string): Promise<ShippingResponse> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.post(
            '/api/shipping/create',
            request,
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

      return response.data;
    } catch (error: any) {
      throw new AppError(
        `Failed to create shipment: ${error.response?.data?.message || error.message}`,
        503
      );
    }
  }

  /**
   * Get tracking information
   */
  async getTracking(trackingNumber: string, tenantId: string): Promise<TrackingInfo> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.get(`/api/shipping/track/${trackingNumber}`, {
            headers: {
              'x-tenant-id': tenantId,
            },
          }),
          this.apiTimeout
        ),
        parseInt(process.env.MAX_RETRY_ATTEMPTS || '3')
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new AppError(`Tracking number ${trackingNumber} not found`, 404);
      }

      throw new AppError(
        `Failed to get tracking info: ${error.message}`,
        503
      );
    }
  }

  /**
   * Calculate shipping cost
   */
  async calculateShippingCost(
    request: ShippingRequest,
    tenantId: string
  ): Promise<{ cost: number; currency: string }> {
    try {
      const response = await retry(
        () => withTimeout(
          this.client.post(
            '/api/shipping/calculate',
            request,
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

      return response.data;
    } catch (error: any) {
      throw new AppError(
        `Failed to calculate shipping cost: ${error.message}`,
        503
      );
    }
  }
}

