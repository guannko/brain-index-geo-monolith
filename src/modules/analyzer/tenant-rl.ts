import type { Redis } from 'ioredis';

export async function checkTenantRate(
  redis: Redis,
  tenantId: string,
  limitPerMin: number
): Promise<boolean> {
  const key = `rl:tenant:${tenantId}`;
  const count = await redis.incr(key);
  
  // Set expiry on first increment
  if (count === 1) {
    await redis.expire(key, 60);
  }
  
  return count <= limitPerMin;
}

export async function getTenantRateInfo(
  redis: Redis,
  tenantId: string,
  limitPerMin: number
): Promise<{ used: number, limit: number, remaining: number }> {
  const key = `rl:tenant:${tenantId}`;
  const count = await redis.get(key);
  const used = count ? parseInt(count) : 0;
  
  return {
    used,
    limit: limitPerMin,
    remaining: Math.max(0, limitPerMin - used)
  };
}