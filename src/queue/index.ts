
import { Queue, Worker, JobsOptions } from 'bullmq';
import { redis } from '../shared/redis.js';
import { aiAnalyzerService } from '../modules/analyzer/analyzer.service.js';
import { env } from '../config/env.js';

export const analyzeQueue = new Queue('analyze', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: 1000,
    removeOnFail: 1000
  } as JobsOptions
});

// Worker
const worker = new Worker('analyze', async job => {
  const { input } = job.data as { input: string };
  return aiAnalyzerService.analyze(input);
}, {
  connection: redis,
  concurrency: 5,
  limiter: {
    max: env.RL_ANALYZE_PER_MIN,
    duration: 60 * 1000
  }
});

worker.on('completed', job => {
  console.log(`[worker] completed job ${job.id}`);
});
worker.on('failed', (job, err) => {
  console.error(`[worker] failed job ${job?.id}:`, err?.message);
});
