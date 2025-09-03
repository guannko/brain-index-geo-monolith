
import { buildServer } from './config/fastify.js';
import analyzerRoutes from './modules/analyzer/analyzer.controller.js';
import { prisma } from './prisma/client.js';
import { env } from './config/env.js';

const fastify = buildServer();

// decorate prisma for routes access
fastify.decorate('prisma', prisma);

fastify.register(analyzerRoutes, { prefix: '/api/analyzer' });

async function start() {
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    fastify.log.info(`API running on :${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
