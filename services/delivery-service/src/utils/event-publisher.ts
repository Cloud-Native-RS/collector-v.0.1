import amqp from 'amqplib';

export class EventPublisher {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchange = 'delivery-events';

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      const conn = await amqp.connect(rabbitmqUrl);
      this.connection = conn as unknown as amqp.Connection;
      const ch = await (this.connection as any).createChannel();
      this.channel = ch as unknown as amqp.Channel;
      
      // Assert exchange
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      
      console.log('✅ Connected to RabbitMQ');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      // Service can continue without messaging
    }
  }

  async publish(eventType: string, data: any): Promise<void> {
    if (!this.channel) {
      console.warn('RabbitMQ not connected, event not published:', eventType);
      return;
    }

    try {
      const message = JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString(),
      });

      this.channel.publish(
        this.exchange,
        eventType,
        Buffer.from(message),
        { persistent: true }
      );
    } catch (error) {
      console.error(`Failed to publish event ${eventType}:`, error);
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

// Singleton instance
export const eventPublisher = new EventPublisher();

