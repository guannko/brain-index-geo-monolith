import { FastifyInstance } from 'fastify';
import {
  Registry, collectDefaultMetrics, Counter, Histogram
} from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry, prefix: 'big_' });

export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry]
});

export const queueJobs = new Counter({
  name: 'queue_jobs_total',
  help: 'Queue jobs by event',
  labelNames: ['queue', 'event'],
  registers: [registry]
});

export const jobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [registry]
});

export const providerCalls = new Counter({
  name: 'provider_calls_total',
  help: 'Provider API calls',
  labelNames: ['provider', 'status'],
  registers: [registry]
});

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Cache hits',
  labelNames: ['kind'],
  registers: [registry]
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Cache misses',
  labelNames: ['kind'],
  registers: [registry]
});

export async function registerMetricsPlugin(fastify: FastifyInstance) {
  // Track request timing
  fastify.addHook('onRequest', async (req) => {
    (req as any)._start = process.hrtime.bigint();
  });
  
  fastify.addHook('onResponse', async (req, reply) => {
    const start = (req as any)._start as bigint | undefined;
    if (!start) return;
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    httpDuration
      .labels(
        req.method, 
        reply.context.config.url || req.routerPath || 'unknown', 
        String(reply.statusCode)
      )
      .observe(duration);
  });

  // Metrics endpoint
  fastify.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });
}

// Provider wrapper for metrics
import type { AIProvider, ProviderResult } from '../modules/analyzer/providers/types.js';

export function wrapProvider(provider: AIProvider): AIProvider {
  return {
    ...provider,
    async analyze(input: string): Promise<ProviderResult> {
      try {
        const result = await provider.analyze(input);
        providerCalls.labels(provider.name, 'ok').inc();
        return result;
      } catch (error) {
        providerCalls.labels(provider.name, 'error').inc();
        throw error;
      }
    }
  };
}