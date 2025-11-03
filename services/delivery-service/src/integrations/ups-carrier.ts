import { Carrier } from '@prisma/client';
import { BaseCarrier, ShipmentData, TrackingInfo } from './base-carrier';

export class UPSCarrier extends BaseCarrier {
  async createShipment(data: ShipmentData): Promise<{ trackingNumber: string; labelUrl?: string }> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.post('/shipments', {
        Service: 'UPS Ground',
        ShipTo: {
          Name: data.recipientName,
          Address: {
            AddressLine: [data.recipientAddress],
            City: data.recipientCity,
            PostalCode: data.recipientZipCode,
            CountryCode: data.recipientCountry,
          },
        },
        Package: data.items.map(item => ({
          Description: item.description,
          Weight: item.weight || 1,
          Value: item.value?.toString() || '0',
        })),
      });

      return {
        trackingNumber: response.data.TrackingNumber,
        labelUrl: response.data.LabelUrl,
      };
    });
  }

  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo> {
    return this.retryWithBackoff(async () => {
      const response = await this.apiClient.get(`/track/${trackingNumber}`);

      const activities = response.data.TrackResponse?.Shipment?.[0]?.Package?.[0]?.Activity || [];

      return {
        trackingNumber,
        status: response.data.TrackResponse?.Shipment?.[0]?.Package?.[0]?.Delivery?.DeliveryLocation?.LocationDescription || 'In Transit',
        estimatedDelivery: response.data.TrackResponse?.Shipment?.[0]?.Package?.[0]?.Delivery?.Date
          ? new Date(response.data.TrackResponse.Shipment[0].Package[0].Delivery.Date)
          : undefined,
        events: activities.map((a: any) => ({
          timestamp: new Date(a.Date + ' ' + a.Time),
          description: a.Description,
          location: a.Location?.Address?.City || undefined,
        })),
      };
    });
  }
}

