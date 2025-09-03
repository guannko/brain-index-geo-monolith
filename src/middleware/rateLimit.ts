import { FastifyInstance, FastifyRequest } from 'fastify';
import { FEATURE_FLAGS } from '../config/features.js';

// User plan types
export enum UserPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Rate limits per plan (requests per minute)
const RATE_LIMITS = {
  [UserPlan.FREE]: 10,
  [UserPlan.STARTER]: 50,
  [UserPlan.PRO]: 200,
  [UserPlan.ENTERPRISE]: 1000,
};

// Get user plan from request (from JWT, API key, etc.)
function getUserPlan(request: FastifyRequest): UserPlan {
  // TODO: Implement actual user plan detection
  const user = (request as any).user;
  return user?.plan || UserPlan.FREE;
}

// Dynamic rate limit middleware
export function setupRateLimit(fastify: FastifyInstance) {
  if (FEATURE_FLAGS.DYNAMIC_RATE_LIMIT) {
    fastify.register(import('@fastify/rate-limit'), {
      global: true,
      max: async (request: FastifyRequest) => {
        const plan = getUserPlan(request);
        return RATE_LIMITS[plan];
      },
      timeWindow: '1 minute',
      cache: 10000,
      skipOnError: true,
      keyGenerator: (request: FastifyRequest) => {
        // Use user ID if authenticated, otherwise IP
        const user = (request as any).user;
        return user?.id || request.ip;
      },
      errorResponseBuilder: (request, context) => {
        return {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Max ${context.max} requests per minute for your plan.`,
          retry: context.ttl
        };
      }
    });
  } else {
    // Fallback to static rate limit
    fastify.register(import('@fastify/rate-limit'), {
      global: true,
      max: 50, // Default static limit
      timeWindow: '1 minute'
    });
  }
}