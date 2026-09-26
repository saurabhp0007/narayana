import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('database.redis.host');
    const port = this.configService.get<number>('database.redis.port');
    const password = this.configService.get<string>('database.redis.password');
    const tls = this.configService.get<any>('database.redis.tls');

    const redisConfig: any = {
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis max retries reached, stopping...');
          return null;
        }
        const delay = Math.min(times * 1000, 3000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        if (targetErrors.some((targetError) => err.message.includes(targetError))) {
          return true;
        }
        return false;
      },
    };

    // Add TLS configuration if enabled
    if (tls) {
      redisConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    this.client = new Redis(redisConfig);

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error.message);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis is ready to accept commands');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Redis connection closed');
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async deleteByPattern(...patterns: string[]): Promise<number> {
    let deleted = 0;
    for (const match of patterns) {
      for await (const keys of this.client.scanStream({ match, count: 500 })) {
        if (keys.length) deleted += await this.client.del(...keys);
      }
    }
    return deleted;
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
  }
}
