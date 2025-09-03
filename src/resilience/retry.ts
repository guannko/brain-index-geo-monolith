function sleep(ms: number) { 
  return new Promise(r => setTimeout(r, ms)); 
}

function expBackoff(attempt: number, min: number, max: number) {
  const base = Math.min(max, min * Math.pow(2, attempt));
  const jitter = Math.random() * base * 0.2;
  return Math.floor(base + jitter);
}

export type CanRetry = (e: any) => boolean;

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts: number,
  minMs: number,
  maxMs: number,
  canRetry: CanRetry
): Promise<T> {
  let lastErr: any;
  
  for (let i = 0; i <= attempts; i++) {
    try { 
      return await fn(); 
    } catch (e: any) {
      lastErr = e;
      if (i === attempts || !canRetry(e)) throw e;
      await sleep(expBackoff(i, minMs, maxMs));
    }
  }
  
  throw lastErr;
}

export const defaultCanRetry: CanRetry = (e: any) => {
  const msg = String(e?.message || '');
  const code = (e?.status || e?.statusCode || 0) as number;
  
  // Retry on rate limits
  if (code === 429) return true;
  
  // Retry on server errors
  if (code >= 500) return true;
  
  // Retry on network/timeout errors
  return /ECONN|ETIMEDOUT|aborted|timeout/i.test(msg);
};