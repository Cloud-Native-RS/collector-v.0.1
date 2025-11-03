import amqp, { Connection, Channel } from 'amqplib';
import { EventType, SystemEvent, BaseEvent } from './types';

/**
 * Standardized Event Bus for Microservices
 * Uses RabbitMQ with topic exchange for event-driven architecture
 */
export class EventBus {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private exchangeName: string;
  private serviceName: string;
  private isConnected: boolean = false;

  constructor(serviceName: string, exchangeName: string = 'collector-events') {
    this.serviceName = serviceName;
    this.exchangeName = exchangeName;
  }

  /**
   * Connect to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Assert topic exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      this.isConnected = true;
      console.log(`✅ [${this.serviceName}] Connected to RabbitMQ Event Bus`);
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Failed to connect to RabbitMQ:`, error);
      // Service can continue without event bus in some cases
      // throw error; // Uncomment if event bus is critical
    }
  }

  /**
   * Publish an event
   */
  async publish<T extends SystemEvent>(event: Omit<T, keyof BaseEvent> & Partial<BaseEvent>): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.warn(`⚠️ [${this.serviceName}] Event bus not connected, skipping event: ${event.type}`);
      return;
    }

    try {
      const baseEvent: BaseEvent = {
        type: event.type,
        timestamp: event.timestamp || new Date().toISOString(),
        tenantId: event.tenantId,
        source: event.source || this.serviceName,
        correlationId: event.correlationId,
      };

      const fullEvent = {
        ...baseEvent,
        ...event,
      };

      const routingKey = event.type;
      const messageBuffer = Buffer.from(JSON.stringify(fullEvent));

      const published = this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json',
        }
      );

      if (published) {
        console.log(`📤 [${this.serviceName}] Published event: ${event.type} (tenant: ${event.tenantId})`);
      } else {
        console.warn(`⚠️ [${this.serviceName}] Failed to publish event: ${event.type} (buffer full)`);
      }
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Error publishing event ${event.type}:`, error);
      // Don't throw - event failures shouldn't break main flow
    }
  }

  /**
   * Subscribe to an event type
   */
  async subscribe(
    eventType: EventType,
    handler: (event: SystemEvent) => Promise<void>,
    options?: {
      queueName?: string;
      durable?: boolean;
      maxRetries?: number;
    }
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      console.warn(`⚠️ [${this.serviceName}] Event bus not connected, cannot subscribe to: ${eventType}`);
      return;
    }

    try {
      const queueName = options?.queueName || `${eventType}.${this.serviceName}`;
      const durable = options?.durable !== false;
      const maxRetries = options?.maxRetries || 3;

      // Declare queue
      await this.channel.assertQueue(queueName, {
        durable,
      });

      // Bind queue to exchange with routing key
      await this.channel.bindQueue(queueName, this.exchangeName, eventType);

      console.log(`✅ [${this.serviceName}] Subscribed to event: ${eventType} (queue: ${queueName})`);

      // Consume messages
      await this.channel.consume(queueName, async (msg) => {
        if (!msg) return;

        let retries = 0;
        let processed = false;

        while (!processed && retries < maxRetries) {
          try {
            const event: SystemEvent = JSON.parse(msg.content.toString());
            
            // Validate event structure
            if (!event.type || !event.tenantId) {
              throw new Error('Invalid event structure');
            }

            await handler(event);
            processed = true;
            this.channel?.ack(msg);
            
            console.log(`✅ [${this.serviceName}] Processed event: ${event.type} (tenant: ${event.tenantId})`);
          } catch (error) {
            retries++;
            console.error(
              `❌ [${this.serviceName}] Error processing event (attempt ${retries}/${maxRetries}):`,
              error
            );

            if (retries >= maxRetries) {
              // Send to dead letter queue or log for manual processing
              console.error(
                `💀 [${this.serviceName}] Event processing failed after ${maxRetries} attempts, rejecting message`
              );
              this.channel?.nack(msg, false, false); // Don't requeue
            } else {
              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
            }
          }
        }
      });
    } catch (error) {
      console.error(`❌ [${this.serviceName}] Failed to subscribe to ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to multiple event types
   */
  async subscribeMany(
    subscriptions: Array<{
      eventType: EventType;
      handler: (event: SystemEvent) => Promise<void>;
      queueName?: string;
    }>
  ): Promise<void> {
    await Promise.all(
      subscriptions.map((sub) =>
        this.subscribe(sub.eventType, sub.handler, { queueName: sub.queueName })
      )
    );
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
    this.isConnected = false;
    console.log(`🔌 [${this.serviceName}] Event bus connection closed`);
  }

  /**
   * Health check
   */
  isHealthy(): boolean {
    return this.isConnected && this.channel !== null && !this.channel.closed;
  }
}

/**
 * Create a singleton event bus instance for a service
 */
export function createEventBus(serviceName: string, exchangeName?: string): EventBus {
  return new EventBus(serviceName, exchangeName);
}

