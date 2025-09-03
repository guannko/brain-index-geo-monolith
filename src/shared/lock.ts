import type { Redis } from 'ioredis';

export async function acquireLock(
  redis: Redis,
  key: string,
  ttlMs: number
): Promise<boolean> {
  // SET key 1 NX PX ttl - atomic operation
  const res = await redis.set(key, '1', 'NX', 'PX', ttlMs);
  return res === 'OK';
}

export async function releaseLock(redis: Redis, key: string) {
  try { 
    await redis.del(key); 
  } catch (err) {
    console.error(`Failed to release lock ${key}:`, err);
  }
}