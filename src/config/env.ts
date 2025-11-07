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
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  // Qdrant configuration for RAG Pipeline
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  QDRANT_API_KEY: process.env.QDRANT_API_KEY || '',
  // AI Provider API Keys
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
  GROK_API_KEY: process.env.GROK_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
