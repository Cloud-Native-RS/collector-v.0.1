import * as amqp from 'amqplib';

export enum EventType {
  OFFER_APPROVED = 'offer.approved',
}

export interface BaseEvent {
  type: EventType;
  timestamp: string;
  tenantId: string;
  source: string;
  correlationId?: string;
}

export interface OfferApprovedEvent extends BaseEvent {
  type: EventType.OFFER_APPROVED;
  data: {
    offerId: string;
    offerNumber: string;
    customerId: string;
    validUntil: string;
    currency: string;
    grandTotal: string;
    lineItems: Array<{
      productId?: string;
      description: string;
      quantity: string;
      unitPrice: string;
      discountPercent?: string;
      taxPercent?: string;
    }>;
  };
}

export class EventBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName: string = 'collector-events';
  private serviceName: string = 'offers-service';
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      const conn = await amqp.connect(rabbitmqUrl);
      this.connection = conn as unknown as amqp.Connection;
      const ch = await (this.connection as any).createChannel();
      this.channel = ch as unknown as amqp.Channel;
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      this.isConnected = true;
      console.log(`✅ [${this.serviceName}] Connected to RabbitMQ Event Bus`);
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Failed to connect to RabbitMQ:`, error);
      this.isConnected = false;
    }
  }

  async publish(event: OfferApprovedEvent): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.warn(`⚠️ [${this.serviceName}] Event bus not connected, skipping event: ${event.type}`);
      return;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(event));
      this.channel.publish(
        this.exchangeName,
        event.type,
        messageBuffer,
        { persistent: true, timestamp: Date.now(), contentType: 'application/json' }
      );
      console.log(`📤 [${this.serviceName}] Published event: ${event.type} (tenant: ${event.tenantId})`);
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Error publishing event:`, error);
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await (this.channel as any).close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      this.isConnected = false;
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Error closing connection:`, error);
    }
  }
}

export const eventBus = new EventBus();

