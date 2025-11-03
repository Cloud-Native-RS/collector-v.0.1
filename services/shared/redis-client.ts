import { createClient, RedisClientType } from 'redis';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  database?: number;
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error;
  };
}

export class RedisClient {
  private client: RedisClientType;
  private config: RedisConfig;
  private connected: boolean = false;

  constructor(config: RedisConfig = {}) {
    this.config = {
      url: config.url || process.env.REDIS_URL || 'redis://localhost:6379',
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.password || process.env.REDIS_PASSWORD,
      database: config.database || parseInt(process.env.REDIS_DB || '0'),
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        },
        ...config.socket,
      },
    };

    // If URL is provided, use it; otherwise build from components
    if (this.config.url) {
      this.client = createClient({
        url: this.config.url,
        socket: {
          reconnectStrategy: this.config.socket?.reconnectStrategy,
        },
      });
    } else {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          reconnectStrategy: this.config.socket?.reconnectStrategy,
        },
        password: this.config.password,
        database: this.config.database,
      });
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client: Connecting...');
    });

    this.client.on('ready', () => {
      console.log('Redis Client: Connected and ready');
      this.connected = true;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis Client: Reconnecting...');
    });

    this.client.on('end', () => {
      console.log('Redis Client: Connection closed');
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client.quit();
      this.connected = false;
    } catch (error) {
      console.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // String operations
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  // Cache operations with JSON serialization
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse JSON for key ${key}:`, error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.set(key, serialized, ttlSeconds);
  }

  // Increment/Decrement
  async increment(key: string, by: number = 1): Promise<number> {
    return await this.client.incrBy(key, by);
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    return await this.client.decrBy(key, by);
  }

  // Hash operations
  async hGet(key: string, field: string): Promise<string | undefined> {
    return await this.client.hGet(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return await this.client.hDel(key, fields);
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    return await this.client.lPush(key, values);
  }

  async rPush(key: string, ...values: string[]): Promise<number> {
    return await this.client.rPush(key, values);
  }

  async lPop(key: string): Promise<string | null> {
    return await this.client.lPop(key);
  }

  async rPop(key: string): Promise<string | null> {
    return await this.client.rPop(key);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lRange(key, start, stop);
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sAdd(key, members);
  }

  async sRemove(key: string, ...members: string[]): Promise<number> {
    return await this.client.sRem(key, members);
  }

  async sMembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    return await this.client.sIsMember(key, member);
  }

  // Pattern matching
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async scan(cursor: number = 0, pattern?: string, count?: number): Promise<[number, string[]]> {
    return await this.client.scan(cursor, {
      MATCH: pattern,
      COUNT: count,
    });
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(channel, (message) => {
      callback(message);
    });
  }

  // Health check
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  // Cache helper - generic cache wrapper with TTL
  async cache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    const cached = await this.getJSON<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.setJSON(key, value, ttlSeconds);
    return value;
  }

  // Get raw client for advanced operations
  getClient(): RedisClientType {
    return this.client;
  }
}

// Singleton instance
let redisClientInstance: RedisClient | null = null;

export function getRedisClient(config?: RedisConfig): RedisClient {
  if (!redisClientInstance) {
    redisClientInstance = new RedisClient(config);
  }
  return redisClientInstance;
}

// Export default instance creator
export default RedisClient;

