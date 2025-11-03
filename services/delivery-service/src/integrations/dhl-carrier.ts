import { Carrier } from '@prisma/client';
import { BaseCarrier, ShipmentData, TrackingInfo } from './base-carrier';

export class DHLCarrier extends BaseCarrier {
  async createShipment(data: ShipmentData): Promise<{ trackingNumber: string; labelUrl?: string }> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.post('/shipments', {
        service: 'standard',
        recipient: {
          name: data.recipientName,
          address: data.recipientAddress,
          city: data.recipientCity,
          postalCode: data.recipientZipCode,
          country: data.recipientCountry,
        },
        packages: data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight || 1,
          value: item.value || 0,
        })),
      });

      return {
        trackingNumber: response.data.trackingNumber,
        labelUrl: response.data.labelUrl,
      };
    });
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.get(`/tracking/${trackingNumber}`);

      return {
        trackingNumber,
        status: response.data.status,
        currentLocation: response.data.currentLocation,
        estimatedDelivery: response.data.estimatedDelivery
          ? new Date(response.data.estimatedDelivery)
          : undefined,
        events: response.data.events.map((e: any) => ({
          timestamp: new Date(e.timestamp),
          description: e.description,
          location: e.location,
        })),
      };
    });
  }
}

