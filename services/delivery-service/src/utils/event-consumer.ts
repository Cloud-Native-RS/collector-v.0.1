import amqp from 'amqplib';
import { DeliveryService } from '../services/delivery.service';

export class EventConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private deliveryService: DeliveryService;

  constructor(deliveryService: DeliveryService) {
    this.deliveryService = deliveryService;
  }

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      const conn = await amqp.connect(rabbitmqUrl);
      this.connection = conn as unknown as amqp.Connection;
      const ch = await (this.connection as any).createChannel();
      this.channel = ch as unknown as amqp.Channel;

      // Consume order.fulfilled events
      const queue = 'order.fulfilled.delivery-service';
      await this.channel.assertQueue(queue, { durable: true });
      
      // Bind to exchange
      const exchange = 'order-events';
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.bindQueue(queue, exchange, 'order.fulfilled');

      console.log('✅ Event consumer connected to RabbitMQ');

      // Consume messages
      if (this.channel) {
        await this.channel.consume(queue, async (msg) => {
          if (!msg) return;

          try {
            const event = JSON.parse(msg.content.toString());
            await this.handleOrderFulfilled(event);
            if (this.channel) {
              this.channel.ack(msg);
            }
          } catch (error) {
            console.error('Error processing event:', error);
            if (this.channel) {
              this.channel.nack(msg, false, false); // Reject and don't requeue
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to connect event consumer to RabbitMQ:', error);
      // Service can continue without event consumption
    }
  }

  private async handleOrderFulfilled(event: any): Promise<void> {
    try {
      const { orderId, customerId, items, deliveryAddressId, tenantId } = event.data;

      // Create delivery note from fulfilled order
      await this.deliveryService.create({
        orderId,
        customerId,
        deliveryAddressId,
        items: items.map((item: any) => ({
          productId: item.productId,
          description: item.description || item.name,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
        })),
        tenantId,
      });

      console.log(`✅ Created delivery note for order ${orderId}`);
    } catch (error) {
      console.error('Error handling order.fulfilled event:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
    } catch (error) {
      console.error('Error closing channel:', error);
    }
    try {
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  }
}

