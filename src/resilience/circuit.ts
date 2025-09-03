import type { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { circuitEvents } from '../observability/metrics.js';

type State = 'closed' | 'open' | 'half';

const winMs = Number(env.CB_WINDOW_MS || 60000);
const thld = Number(env.CB_FAIL_THRESHOLD || 5);
const halfMs = Number(env.CB_HALF_OPEN_MS || 60000);

function keyState(p: string) { return `cb:${p}:state`; }
function keyFail(p: string) { return `cb:${p}:fails`; }
function keyOpenAt(p: string) { return `cb:${p}:openAt`; }
function keyProbe(p: string) { return `cb:${p}:probe`; }

export async function shouldShortCircuit(redis: Redis, provider: string): Promise<boolean> {
  const state = (await redis.get(keyState(provider))) as State | null;
  if (state !== 'open') return false;
  
  const openedAt = Number(await redis.get(keyOpenAt(provider)) || 0);
  if (!openedAt || (Date.now() - openedAt) > halfMs) {
    // Try to transition to HALF-OPEN (single probe)
    const ok = await redis.set(keyProbe(provider), '1', 'NX', 'PX', halfMs);
    if (ok === 'OK') {
      await redis.set(keyState(provider), 'half');
      circuitEvents.labels(provider, 'half_open').inc();
      return false; // Allow one attempt
    }
  }
  
  circuitEvents.labels(provider, 'short_circuit').inc();
  return true;
}

export async function recordSuccess(redis: Redis, provider: string) {
  const state = (await redis.get(keyState(provider))) as State | null;
  if (state && state !== 'closed') {
    await redis.set(keyState(provider), 'closed');
    await redis.del(keyFail(provider), keyOpenAt(provider), keyProbe(provider));
    circuitEvents.labels(provider, 'closed').inc();
  } else {
    // In closed state, just reset failure window
    await redis.del(keyFail(provider));
  }
}

export async function recordFailure(redis: Redis, provider: string) {
  // Count failures in window via INCR+EX
  const n = await redis.incr(keyFail(provider));
  if (n === 1) await redis.pexpire(keyFail(provider), winMs);
  
  if (n >= thld) {
    await redis.set(keyState(provider), 'open');
    await redis.set(keyOpenAt(provider), String(Date.now()));
    circuitEvents.labels(provider, 'opened').inc();
  }
}