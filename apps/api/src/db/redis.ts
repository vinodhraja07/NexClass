import Redis from "ioredis";
import { env } from "../config/env";

type RedisValue = string | number | Buffer | null;

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  hset(key: string, field: string, value: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, field: string): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  ping(): Promise<string>;
  readonly kind: "redis" | "memory";
}

class MemoryCache implements CacheClient {
  readonly kind = "memory" as const;
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private alive(key: string) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string) {
    if (!this.alive(key)) return null;
    return this.store.get(key)!.value;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string) {
    this.store.delete(key);
  }

  async sadd(key: string, member: string) {
    const set = await this.smembers(key);
    if (!set.includes(member)) set.push(member);
    await this.set(key, JSON.stringify(set));
  }

  async srem(key: string, member: string) {
    const set = (await this.smembers(key)).filter((item) => item !== member);
    await this.set(key, JSON.stringify(set));
  }

  async smembers(key: string) {
    if (!this.alive(key)) return [];
    try {
      return JSON.parse(this.store.get(key)!.value) as string[];
    } catch {
      return [];
    }
  }

  async hset(key: string, field: string, value: string) {
    const hash = await this.hgetall(key);
    hash[field] = value;
    await this.set(key, JSON.stringify(hash));
  }

  async hgetall(key: string) {
    if (!this.alive(key)) return {};
    try {
      return JSON.parse(this.store.get(key)!.value) as Record<string, string>;
    } catch {
      return {};
    }
  }

  async hdel(key: string, field: string) {
    const hash = await this.hgetall(key);
    delete hash[field];
    await this.set(key, JSON.stringify(hash));
  }

  async expire(key: string, seconds: number) {
    const entry = this.store.get(key);
    if (entry) entry.expiresAt = Date.now() + seconds * 1000;
  }

  async keys(pattern: string) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    return [...this.store.keys()].filter((key) => this.alive(key) && regex.test(key));
  }

  async ping() {
    return "PONG";
  }
}

class RedisCache implements CacheClient {
  readonly kind = "redis" as const;
  constructor(private client: Redis) {}

  async get(key: string) {
    const value = await this.client.get(key);
    return value ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
    else await this.client.set(key, value);
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async sadd(key: string, member: string) {
    await this.client.sadd(key, member);
  }

  async srem(key: string, member: string) {
    await this.client.srem(key, member);
  }

  async smembers(key: string) {
    return this.client.smembers(key);
  }

  async hset(key: string, field: string, value: string) {
    await this.client.hset(key, field, value);
  }

  async hgetall(key: string) {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string) {
    await this.client.hdel(key, field);
  }

  async expire(key: string, seconds: number) {
    await this.client.expire(key, seconds);
  }

  async keys(pattern: string) {
    return this.client.keys(pattern);
  }

  async ping() {
    return this.client.ping();
  }
}

let client: CacheClient = new MemoryCache();
let redisConnected = false;
let redisDetail = "Using the in-process cache (no REDIS_URL configured).";

export async function connectRedis(): Promise<{ connected: boolean; fallback: boolean; detail: string }> {
  if (!env.redisUrl) {
    return { connected: false, fallback: true, detail: redisDetail };
  }
  try {
    const redis = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    redis.on("error", () => {
      /* handled below by fallback */
    });
    await redis.connect();
    client = new RedisCache(redis);
    redisConnected = true;
    redisDetail = `Redis connected (${env.redisUrl.replace(/\/\/[^@]*@/, "//***@")}).`;
    // eslint-disable-next-line no-console
    console.log("[cache] Redis connected");
    return { connected: true, fallback: false, detail: redisDetail };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    redisDetail = `Redis unavailable (${detail}) - using the in-process cache.`;
    client = new MemoryCache();
    redisConnected = false;
    // eslint-disable-next-line no-console
    console.warn(`[cache] ${redisDetail}`);
    return { connected: false, fallback: true, detail: redisDetail };
  }
}

export function cache(): CacheClient {
  return client;
}

export function cacheStatus() {
  return { connected: redisConnected, fallback: client.kind === "memory", detail: redisDetail };
}

export async function disconnectRedis() {
  const current = client;
  client = new MemoryCache();
  redisConnected = false;
  if (current instanceof RedisCache) {
    await (current as unknown as { client: Redis }).client.quit();
  }
}
