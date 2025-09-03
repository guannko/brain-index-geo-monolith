import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './env.js';

export function buildServer() {
  const fastify = Fastify({ logger: { level: env.LOG_LEVEL } });

  fastify.register(helmet);
  fastify.register(cors, { origin: env.CORS_ORIGIN });
  fastify.register(websocket);

  // Healthcheck
  fastify.get('/healthz', async () => ({ ok: true }));

  return fastify;
}