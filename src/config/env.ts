
import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT || 3000),
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RL_ANALYZE_PER_MIN: Number(process.env.RL_ANALYZE_PER_MIN || 50),
  CACHE_TTL: Number(process.env.CACHE_TTL || 3600),
  JWT_SECRET: process.env.JWT_SECRET || 'secret'
};
