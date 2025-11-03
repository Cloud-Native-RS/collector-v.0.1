import axios, { AxiosInstance } from 'axios';
import { Carrier } from '@prisma/client';

export interface ShipmentData {
  recipientName: string;
  recipientAddress: string;
  recipientCity: string;
  recipientZipCode: string;
  recipientCountry: string;
  items: Array<{
    description: string;
    quantity: number;
    weight?: number;
    value?: number;
  }>;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  events: Array<{
    timestamp: Date;
    description: string;
    location?: string;
  }>;
}

export abstract class BaseCarrier {
  protected apiClient: AxiosInstance;
  protected carrier: Carrier;

  constructor(carrier: Carrier) {
    this.carrier = carrier;
    this.apiClient = axios.create({
      baseURL: carrier.apiEndpoint,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add authentication if available
    if (carrier.apiKey) {
      this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${carrier.apiKey}`;
      if (carrier.apiSecret) {
        this.apiClient.defaults.headers.common['X-API-Secret'] = carrier.apiSecret;
      }
    }
  }

  abstract createShipment(data: ShipmentData): Promise<{ trackingNumber: string; labelUrl?: string }>;
  abstract getTrackingInfo(trackingNumber: string): Promise<TrackingInfo>;

  // Retry logic with exponential backoff
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}

