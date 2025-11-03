import amqp, { Connection, Channel, ConsumeMessage, Options } from 'amqplib';

export interface RabbitMQConfig {
  url?: string;
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
  heartbeat?: number;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface PublishOptions {
  exchange?: string;
  routingKey?: string;
  persistent?: boolean;
  expiration?: number;
  priority?: number;
  headers?: Record<string, any>;
}

export interface ConsumeOptions {
  exchange?: string;
  queue?: string;
  routingKey?: string;
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  noAck?: boolean;
  prefetch?: number;
}

export class RabbitMQClient {
  private config: RabbitMQConfig;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor(config: RabbitMQConfig = {}) {
    this.config = {
      url: config.url || process.env.RABBITMQ_URL,
      hostname: config.hostname || process.env.RABBITMQ_HOST || 'localhost',
      port: config.port || parseInt(process.env.RABBITMQ_PORT || '5672'),
      username: config.username || process.env.RABBITMQ_USER || 'rabbitmq_user',
      password: config.password || process.env.RABBITMQ_PASSWORD || 'rabbitmq_pass',
      vhost: config.vhost || process.env.RABBITMQ_VHOST || 'collector',
      heartbeat: config.heartbeat || 60,
      reconnectDelay: config.reconnectDelay || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
    };
  }

  private buildConnectionUrl(): string {
    if (this.config.url) {
      return this.config.url;
    }

    const { username, password, hostname, port, vhost } = this.config;
    const vhostEncoded = encodeURIComponent(vhost || '/');
    return `amqp://${username}:${password}@${hostname}:${port}/${vhostEncoded}`;
  }

  async connect(): Promise<void> {
    if (this.connected && this.connection) {
      return;
    }

    try {
      const url = this.buildConnectionUrl();
      this.connection = await amqp.connect(url, {
        heartbeat: this.config.heartbeat,
      });

      this.setupConnectionHandlers();
      this.channel = await this.connection.createChannel();
      this.connected = true;
      this.reconnectAttempts = 0;

      console.log('RabbitMQ: Connected successfully');
    } catch (error) {
      console.error('RabbitMQ: Failed to connect:', error);
      this.connected = false;
      throw error;
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.on('error', (err) => {
      console.error('RabbitMQ Connection Error:', err);
      this.connected = false;
      this.handleReconnect();
    });

    this.connection.on('close', () => {
      console.log('RabbitMQ Connection: Closed');
      this.connected = false;
      this.handleReconnect();
    });
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('RabbitMQ: Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay || 5000;

    console.log(`RabbitMQ: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('RabbitMQ: Reconnection failed:', error);
      }
    }, delay);
  }

  async disconnect(): Promise<void> {
    this.connected = false;

    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      console.log('RabbitMQ: Disconnected successfully');
    } catch (error) {
      console.error('RabbitMQ: Error during disconnect:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected && this.connection !== null;
  }

  async ensureChannel(): Promise<Channel> {
    if (!this.connected) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('Channel not available');
    }

    return this.channel;
  }

  // Exchange operations
  async assertExchange(
    exchange: string,
    type: 'direct' | 'topic' | 'fanout' | 'headers' = 'topic',
    options: Options.AssertExchange = { durable: true }
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.assertExchange(exchange, type, options);
  }

  // Queue operations
  async assertQueue(
    queue: string,
    options: Options.AssertQueue = { durable: true }
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.assertQueue(queue, options);
  }

  // Binding operations
  async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string,
    args?: Record<string, any>
  ): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.bindQueue(queue, exchange, routingKey, args);
  }

  // Publish message
  async publish(
    exchange: string,
    routingKey: string,
    content: Buffer | string | object,
    options: PublishOptions = {}
  ): Promise<boolean> {
    const channel = await this.ensureChannel();

    // Ensure exchange exists
    await this.assertExchange(exchange, 'topic');

    let message: Buffer;
    if (Buffer.isBuffer(content)) {
      message = content;
    } else if (typeof content === 'string') {
      message = Buffer.from(content);
    } else {
      message = Buffer.from(JSON.stringify(content));
    }

    const publishOptions: Options.Publish = {
      persistent: options.persistent ?? true,
      expiration: options.expiration?.toString(),
      priority: options.priority,
      headers: options.headers,
    };

    return channel.publish(exchange, routingKey, message, publishOptions);
  }

  // Consume messages
  async consume(
    queue: string,
    handler: (message: ConsumeMessage | null) => void | Promise<void>,
    options: ConsumeOptions = {}
  ): Promise<string> {
    const channel = await this.ensureChannel();

    // Ensure queue exists
    await this.assertQueue(queue, {
      durable: options.durable ?? true,
      exclusive: options.exclusive ?? false,
      autoDelete: options.autoDelete ?? false,
    });

    // Bind to exchange if provided
    if (options.exchange && options.routingKey) {
      await this.bindQueue(queue, options.exchange, options.routingKey);
    }

    // Set prefetch if provided
    if (options.prefetch) {
      await channel.prefetch(options.prefetch);
    }

    const consumerTag = await channel.consume(
      queue,
      async (message) => {
        if (!message) {
          return;
        }

        try {
          await handler(message);
          if (!options.noAck) {
            channel.ack(message);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          if (!options.noAck) {
            channel.nack(message, false, true); // Requeue message
          }
        }
      },
      { noAck: options.noAck ?? false }
    );

    return consumerTag.consumerTag;
  }

  // Cancel consumer
  async cancel(consumerTag: string): Promise<void> {
    const channel = await this.ensureChannel();
    await channel.cancel(consumerTag);
  }

  // Helper: Publish to event exchange
  async publishEvent(eventType: string, data: object): Promise<boolean> {
    const exchange = process.env.RABBITMQ_EXCHANGE || 'collector.events';
    return this.publish(exchange, eventType, data);
  }

  // Helper: Subscribe to event pattern
  async subscribeToEvent(
    eventPattern: string,
    handler: (data: any, routingKey: string) => void | Promise<void>,
    queueName?: string
  ): Promise<string> {
    const exchange = process.env.RABBITMQ_EXCHANGE || 'collector.events';
    const queue = queueName || `events.${eventPattern.replace(/\./g, '_')}.${Date.now()}`;

    return this.consume(
      queue,
      async (message) => {
        if (!message) return;

        try {
          const content = JSON.parse(message.content.toString());
          await handler(content, message.fields.routingKey);
        } catch (error) {
          console.error('Error parsing event message:', error);
        }
      },
      {
        exchange,
        routingKey: eventPattern,
        durable: false,
        autoDelete: true,
      }
    );
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        return false;
      }

      const channel = await this.ensureChannel();
      // Try to check queue count as a health check
      const testQueue = 'health_check_' + Date.now();
      await channel.assertQueue(testQueue, { autoDelete: true, exclusive: true });
      await channel.deleteQueue(testQueue);
      return true;
    } catch (error) {
      console.error('RabbitMQ health check failed:', error);
      return false;
    }
  }

  // Get raw channel for advanced operations
  async getChannel(): Promise<Channel> {
    return await this.ensureChannel();
  }
}

// Singleton instance
let rabbitmqClientInstance: RabbitMQClient | null = null;

export function getRabbitMQClient(config?: RabbitMQConfig): RabbitMQClient {
  if (!rabbitmqClientInstance) {
    rabbitmqClientInstance = new RabbitMQClient(config);
  }
  return rabbitmqClientInstance;
}

// Export default instance creator
export default RabbitMQClient;

