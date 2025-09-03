import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma/client.js';
import { redis } from '../shared/redis.js';
import { openai } from '../shared/openai.js';
import { getEnabledProviders } from '../config/features.js';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
}

export default async function healthRoutes(fastify: FastifyInstance) {
  // Basic health check
  fastify.get('/healthz', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  // Detailed health check
  fastify.get('/health/detailed', async (request, reply) => {
    const checks: HealthStatus[] = [];
    
    // Check PostgreSQL
    const pgStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({
        service: 'postgresql',
        status: 'healthy',
        latency: Date.now() - pgStart
      });
    } catch (err) {
      checks.push({
        service: 'postgresql',
        status: 'unhealthy',
        latency: Date.now() - pgStart,
        error: err.message
      });
    }
    
    // Check Redis
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.push({
        service: 'redis',
        status: 'healthy',
        latency: Date.now() - redisStart
      });
    } catch (err) {
      checks.push({
        service: 'redis', 
        status: 'unhealthy',
        latency: Date.now() - redisStart,
        error: err.message
      });
    }
    
    // Check OpenAI (only if enabled)
    if (getEnabledProviders().includes('ChatGPT')) {
      const openaiStart = Date.now();
      try {
        await openai.models.list();
        checks.push({
          service: 'openai',
          status: 'healthy',
          latency: Date.now() - openaiStart
        });
      } catch (err) {
        checks.push({
          service: 'openai',
          status: 'degraded', // Degraded not unhealthy as it's external
          latency: Date.now() - openaiStart,
          error: err.message
        });
      }
    }
    
    // Overall status
    const overallStatus = checks.every(c => c.status === 'healthy') 
      ? 'healthy' 
      : checks.some(c => c.status === 'unhealthy')
        ? 'unhealthy'
        : 'degraded';
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503;
    
    return reply.code(statusCode).send({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      features: {
        enabledProviders: getEnabledProviders()
      }
    });
  });
  
  // Readiness check (for k8s)
  fastify.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      return { ready: true };
    } catch {
      return reply.code(503).send({ ready: false });
    }
  });
  
  // Liveness check (for k8s)
  fastify.get('/alive', async (request, reply) => {
    return { alive: true, uptime: process.uptime() };
  });
}