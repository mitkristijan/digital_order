import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/** Options for Upstash (rediss://) - unlimited retries, TLS, handles ECONNRESET */
function getRedisOptions(): object {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  const isUpstash = url.startsWith('rediss://');

  const base = {
    maxRetriesPerRequest: null as number | null, // null = unlimited retries (Upstash)
    enableOfflineQueue: true,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    ...(isUpstash && { tls: {} }),
  };

  if (url.startsWith('redis')) {
    return { ...base, url };
  }
  return {
    ...base,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };
}

@Injectable()
export class RedisService implements OnModuleInit {
  private client: Redis;

  async onModuleInit() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    const fromEnv = !!process.env.REDIS_URL;
    const safeHint = url.startsWith('rediss://')
      ? 'rediss://...'
      : url.startsWith('redis://')
        ? url.replace(/:[^:@]+@/, ':****@').slice(0, 40)
        : 'host/port';
    console.log(`Redis: REDIS_URL from env=${fromEnv}, connecting to ${safeHint}`);

    const options = getRedisOptions();
    this.client = new Redis(options as object);

    let connectedOnce = false;
    this.client.on('error', err => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      if (!connectedOnce) {
        console.log('✅ Redis connected');
        connectedOnce = true;
      }
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.client.expire(key, ttl);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await this.client.hdel(key, ...fields);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}
