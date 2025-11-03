import * as amqp from 'amqplib';

export enum EventType {
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',
  OFFER_APPROVED = 'offer.approved',
}

export interface BaseEvent {
  type: EventType;
  timestamp: string;
  tenantId: string;
  source: string;
  correlationId?: string;
}

export interface OrderCreatedEvent extends BaseEvent {
  type: EventType.ORDER_CREATED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    status: string;
    grandTotal: string;
    offerId?: string;
    lineItems?: Array<{
      productId: string;
      sku?: string;
      description: string;
      quantity: number;
      unitPrice: string;
      warehouseId?: string;
    }>;
    currency?: string;
  };
}

export interface OrderConfirmedEvent extends BaseEvent {
  type: EventType.ORDER_CONFIRMED;
  data: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    paymentStatus: string;
    shippingAddressId?: string;
    lineItems?: Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: string;
    }>;
    currency?: string;
  };
}

export interface OfferApprovedEvent extends BaseEvent {
  type: EventType.OFFER_APPROVED;
  data: {
    offerId: string;
    offerNumber: string;
    customerId: string;
  };
}

export class EventBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName: string = 'collector-events';
  private serviceName: string = 'orders-service';
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

  async subscribe(eventType: EventType, handler: (event: any) => Promise<void>): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.warn(`⚠️ [${this.serviceName}] Event bus not connected, cannot subscribe to: ${eventType}`);
      return;
    }

    try {
      const queueName = `${this.serviceName}-${eventType}`;
      await this.channel.assertQueue(queueName, { durable: true });
      await this.channel.bindQueue(queueName, this.exchangeName, eventType);
      
      this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const event = JSON.parse(msg.content.toString());
          await handler(event);
          this.channel?.ack(msg);
        } catch (error) {
          console.error(`❌ Error processing event ${eventType}:`, error);
          this.channel?.nack(msg, false, true); // Requeue on error
        }
      });

      console.log(`📥 [${this.serviceName}] Subscribed to event: ${eventType}`);
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Error subscribing to ${eventType}:`, error);
    }
  }

  async publish(event: OrderCreatedEvent | OrderConfirmedEvent): Promise<void> {
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

