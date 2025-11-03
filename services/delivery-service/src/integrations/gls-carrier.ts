import { Carrier } from '@prisma/client';
import { BaseCarrier, ShipmentData, TrackingInfo } from './base-carrier';

export class GLSCarrier extends BaseCarrier {
  async createShipment(data: ShipmentData): Promise<{ trackingNumber: string; labelUrl?: string }> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.post('/shipments', {
        service: 'standard',
        recipient: {
          name: data.recipientName,
          street: data.recipientAddress,
          city: data.recipientCity,
          zip: data.recipientZipCode,
          country: data.recipientCountry,
        },
        parcels: data.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight || 1,
        })),
      });

      return {
        trackingNumber: response.data.tracking,
        labelUrl: response.data.label,
      };
    });
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.get(`/tracking/${trackingNumber}`);

      return {
        trackingNumber,
        status: response.data.status,
        currentLocation: response.data.location,
        estimatedDelivery: response.data.eta ? new Date(response.data.eta) : undefined,
        events: response.data.history?.map((h: any) => ({
          timestamp: new Date(h.date),
          description: h.description,
          location: h.location,
        })) || [],
      };
    });
  }
}

