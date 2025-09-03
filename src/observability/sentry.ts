import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.log('Sentry not configured (no DSN)');
    return;
  }
  
  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: env.SENTRY_TRACES || 0.1,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.httpIntegration(),
    ],
  });
  
  console.log('Sentry initialized');
}

export function sentryOnError(err: any, req: any, reply: any) {
  if (env.SENTRY_DSN) {
    Sentry.withScope(scope => {
      scope.setTag('route', reply?.context?.config?.url || req?.routerPath || 'unknown');
      scope.setTag('tenant', req?.tenantId || 'public');
      scope.setContext('request', {
        id: req.id,
        method: req.method,
        url: req.url,
        tenantId: req.tenantId,
        userId: req.user?.id
      });
      Sentry.captureException(err);
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';
  
  reply.status(statusCode).send({
    error: message,
    request_id: req.id,
    statusCode
  });
}

export { Sentry };