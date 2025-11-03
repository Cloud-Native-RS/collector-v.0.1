import * as amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

export class MessageBus {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private exchangeName: string;

  constructor() {
    this.exchangeName = process.env.RABBITMQ_EXCHANGE || 'orders_exchange';
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      const conn = await amqp.connect(url);
      this.connection = conn as unknown as amqp.Connection;
      const ch = await (this.connection as any).createChannel();
      this.channel = ch as unknown as amqp.Channel;

      // Declare exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      console.log('✅ Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Publish message to exchange
   */
  async publish(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('Message bus not connected');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      return this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
        }
      );
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  /**
   * Subscribe to messages
   */
  async subscribe(
    queueName: string,
    routingKey: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Message bus not connected');
    }

    try {
      // Declare queue
      await this.channel.assertQueue(queueName, {
        durable: true,
      });

      // Bind queue to exchange
      await this.channel.bindQueue(queueName, this.exchangeName, routingKey);

      // Consume messages
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content);
          
          // Acknowledge message
          this.channel!.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Reject and requeue message
          this.channel!.nack(msg, false, true);
        }
      });

      console.log(`✅ Subscribed to queue: ${queueName} with routing key: ${routingKey}`);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.channel) {
      await (this.channel as any).close();
    }
    if (this.connection) {
      await (this.connection as any).close();
    }
  }
}

export const messageBus = new MessageBus();

