import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(cors, {
  origin: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'brain-index-geo-monolith'
  };
});

// Basic analyzer endpoint
fastify.post('/api/analyzer/analyze', async (request, reply) => {
  const { input } = request.body as { input: string };
  
  // Mock response for now
  return {
    jobId: Math.random().toString(36).substring(7),
    status: 'accepted',
    input: input
  };
});

// Results endpoint
fastify.get('/api/analyzer/results/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  
  // Mock response
  return {
    jobId: id,
    status: 'completed',
    result: {
      chatgpt: Math.floor(Math.random() * 100),
      google: Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString()
    }
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
