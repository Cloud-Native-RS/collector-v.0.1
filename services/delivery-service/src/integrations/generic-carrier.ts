import { Carrier } from '@prisma/client';
import { BaseCarrier, ShipmentData, TrackingInfo } from './base-carrier';

export class GenericCarrier extends BaseCarrier {
  async createShipment(data: ShipmentData): Promise<{ trackingNumber: string; labelUrl?: string }> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.post('/shipments', {
        recipient: {
          name: data.recipientName,
          address: data.recipientAddress,
          city: data.recipientCity,
          zipCode: data.recipientZipCode,
          country: data.recipientCountry,
        },
        items: data.items,
      });

      return {
        trackingNumber: response.data.trackingNumber || response.data.tracking,
        labelUrl: response.data.labelUrl || response.data.label,
      };
    });
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.get(`/tracking/${trackingNumber}`);

      return {
        trackingNumber,
        status: response.data.status || 'In Transit',
        currentLocation: response.data.location || response.data.currentLocation,
        estimatedDelivery: response.data.estimatedDelivery
          ? new Date(response.data.estimatedDelivery)
          : undefined,
        events: (response.data.events || response.data.history || []).map((e: any) => ({
          timestamp: new Date(e.timestamp || e.date || e.time),
          description: e.description || e.status,
          location: e.location,
        })),
      };
    });
  }
}

