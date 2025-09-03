
import { FastifyInstance } from 'fastify';
import { aiAnalyzerService } from './analyzer.service.js';
import { analyzeQueue } from '../../queue/index.js';

export default async function analyzerRoutes(fastify: FastifyInstance) {
  fastify.post('/analyze', {
    schema: {
      body: {
        type: 'object',
        required: ['input'],
        properties: { input: { type: 'string', minLength: 2 } }
      }
    }
  }, async (req, reply) => {
    const { input } = req.body as any;
    const job = await analyzeQueue.add('analyze', { input });
    return reply.code(202).send({ jobId: job.id, status: 'queued' });
  });

  fastify.get('/results/:id', async (req, reply) => {
    const { id } = req.params as any;
    const record = await fastify.prisma.visibilityScore.findUnique({ where: { id } }).catch(() => null);
    if (!record) return reply.code(404).send({ status: 'pending' });
    return reply.send({ status: record.status, result: record });
  });
}
