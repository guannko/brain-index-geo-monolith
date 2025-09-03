import { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    user?: any;
  }
}

export default async function tenantPlugin(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (req) => {
    // JWT strategy - from authenticated user
    if (env.TENANT_RESOLVER === 'jwt' && req.user?.tenantId) {
      req.tenantId = String(req.user.tenantId);
      return;
    }
    
    // Subdomain strategy - from host header
    if (env.TENANT_RESOLVER === 'subdomain') {
      const host = req.headers.host || '';
      // Extract subdomain: acme.example.com -> acme
      const subdomain = host.split(':')[0].split('.').at(0);
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        req.tenantId = subdomain;
        return;
      }
    }
    
    // Static/fallback strategy
    req.tenantId = env.TENANT_STATIC_ID || 'public';
  });
}