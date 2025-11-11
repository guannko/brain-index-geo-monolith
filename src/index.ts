import Fastify from 'fastify';
import cors from '@fastify/cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { contextService } from './services/context.service.js';
import { buildProviders, determineTier } from './modules/analyzer/provider-registry.js';
import { AIProvider } from './modules/analyzer/providers/types.js';

const fastify = Fastify({
  logger: true
});

// Initialize ALL Providers (will auto-filter by API keys)
const allProviders = buildProviders('pro'); // PRO by default
const freeProviders = buildProviders('free'); // FREE for homepage

console.log(`✅ Initialized ${allProviders.length} PRO providers:`, allProviders.map(p => p.name).join(', '));
console.log(`✅ Initialized ${freeProviders.length} FREE providers:`, freeProviders.map(p => p.name).join(', '));

// Initialize RAG Pipeline
await contextService.initialize();
console.log('✅ RAG Pipeline initialized with Qdrant');
console.log('✅ Ultimate GEO v3.1 (PRO) + FREE tier ready');

// Temporary in-memory storage
const jobResults = new Map();
const users = new Map();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'brain-index-secret-2025';

// Register CORS
await fastify.register(cors, {
  origin: true
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'brain-index-geo-monolith',
    version: '3.1.0-ultimate-pro',
    features: 'Ultimate GEO Analysis (7 criteria PRO + 3 criteria FREE)',
    providers: {
      pro: allProviders.map(p => p.name),
      free: freeProviders.map(p => p.name)
    },
    promptVersions: {
      pro: '3.1-ultimate-pro',
      free: '1.0-free'
    }
  };
});

// Auth endpoints
fastify.post('/api/auth/register', async (request, reply) => {
  const { name, email, password } = request.body as { name: string; email: string; password: string };
  
  if (users.has(email)) {
    reply.code(400);
    return { message: 'User already exists' };
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = {
    id: Math.random().toString(36).substring(7),
    name,
    email,
    password: hashedPassword,
    plan: 'FREE',
    createdAt: new Date().toISOString(),
    analyses: []
  };
  
  users.set(email, user);
  console.log('User registered:', email);
  
  return { 
    message: 'Registration successful',
    userId: user.id
  };
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as { email: string; password: string };
  
  const user = users.get(email);
  if (!user) {
    reply.code(401);
    return { message: 'Invalid email or password' };
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    reply.code(401);
    return { message: 'Invalid email or password' };
  }
  
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      plan: user.plan
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  console.log('User logged in:', email);
  
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan
    }
  };
});

// Middleware to verify JWT token
async function verifyToken(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.code(401);
      return reply.send({ message: 'No token provided' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    request.user = decoded;
  } catch (error) {
    reply.code(401);
    return reply.send({ message: 'Invalid token' });
  }
}

// Protected endpoints
fastify.get('/api/user/profile', { preHandler: verifyToken }, async (request: any, reply) => {
  const user = users.get(request.user.email);
  if (!user) {
    reply.code(404);
    return { message: 'User not found' };
  }
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    createdAt: user.createdAt
  };
});

fastify.get('/api/user/analyses', { preHandler: verifyToken }, async (request: any, reply) => {
  const user = users.get(request.user.email);
  if (!user) {
    reply.code(404);
    return { message: 'User not found' };
  }
  
  return {
    analyses: user.analyses || [],
    total: user.analyses?.length || 0
  };
});

// MAIN ANALYZER - With FREE/PRO tier support
fastify.post('/api/analyzer/analyze', async (request: any, reply) => {
  const { input, tier: requestedTier } = request.body as { input: string; tier?: 'free' | 'pro' };
  const jobId = Math.random().toString(36).substring(7);
  
  let userId = 'anonymous';
  let userEmail = null;
  let userPlan = 'FREE';
  
  const authHeader = request.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.userId;
      userEmail = decoded.email;
      userPlan = decoded.plan || 'FREE';
    } catch (error) {
      // Continue as anonymous
    }
  }
  
  // Determine tier: requested tier OR based on user plan
  const tier = requestedTier || determineTier(userPlan);
  const providers = tier === 'free' ? freeProviders : allProviders;
  
  console.log(`🎯 Starting ${tier.toUpperCase()} analysis with ${providers.length} provider(s)`);
  
  // Start async analysis
  runMultiProviderAnalysis(input, jobId, userId, userEmail, tier, providers);
  
  return {
    jobId,
    status: 'accepted',
    input: input,
    tier: tier,
    providers: providers.map(p => p.name),
    type: tier === 'free' ? 'geo-free-v1.0' : 'ultimate-geo-v3.1'
  };
});

// Multi-provider analysis with FREE/PRO support
async function runMultiProviderAnalysis(
  brandName: string,
  jobId: string,
  userId: string,
  userEmail: string | null,
  tier: 'free' | 'pro',
  providers: AIProvider[]
) {
  try {
    console.log(`\n🎯 ${tier.toUpperCase()} GEO Analysis - Brand: ${brandName}`);
    
    jobResults.set(jobId, {
      jobId,
      status: 'processing',
      brandName,
      userId,
      tier,
      timestamp: new Date().toISOString()
    });
    
    // Run analysis with ALL available providers
    console.log(`📡 Running ${providers.length} providers:`, providers.map(p => p.name).join(', '));
    
    const results = await Promise.allSettled(
      providers.map(async (p) => {
        try {
          console.log(`  ⏳ Starting ${p.name}...`);
          const result = await p.analyze(brandName);
          
          // Force scale to 0-20 for FREE tier if AI returns 0-100
          if (tier === 'free' && result.score > 20) {
            result.score = Math.round(result.score / 5); // 100 -> 20
            console.log(`  📊 ${p.name} scaled: ${result.score * 5} -> ${result.score}`);
          }
          
          console.log(`  ✅ ${p.name} succeeded: ${result.score}`);
          return result;
        } catch (error) {
          console.error(`  ❌ ${p.name} failed:`, error.message);
          throw error;
        }
      })
    );
    
    // Collect successful results
    const successfulResults = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
    
    const failedProviders = providers.length - successfulResults.length;
    
    if (successfulResults.length === 0) {
      throw new Error('All providers failed');
    }
    
    console.log(`✅ ${successfulResults.length}/${providers.length} providers succeeded${failedProviders > 0 ? ` (${failedProviders} failed)` : ''}`);
    
    // Calculate average score
    const avgScore = Math.round(
      successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length
    );
    
    // Get primary result (first successful provider, usually ChatGPT)
    const primaryResult = successfulResults[0];
    
    // Parse detailed breakdown from meta (for PRO tier)
    let breakdown = null;
    let insights = null;
    let confidence = 'Medium';
    
    if (tier === 'pro' && primaryResult.meta?.analysis) {
      const analysis = primaryResult.meta.analysis as string;
      
      // Extract breakdown
      const breakdownMatch = analysis.match(/DETAILED BREAKDOWN:([\s\S]*?)TOTAL_SCORE/);
      if (breakdownMatch) {
        breakdown = breakdownMatch[1].trim();
      }
      
      // Extract insights
      const insightsMatch = analysis.match(/KEY INSIGHTS:([\s\S]*?)CONFIDENCE/);
      if (insightsMatch) {
        insights = insightsMatch[1].trim();
      }
      
      // Extract confidence
      const confidenceMatch = analysis.match(/CONFIDENCE: (High|Medium|Low)/);
      if (confidenceMatch) {
        confidence = confidenceMatch[1];
      }
    }
    
    // Create flat structure for frontend compatibility
    const providerScores: any = {};
    successfulResults.forEach(r => {
      // Normalize provider names: chatgpt-free -> chatgpt
      const normalizedName = r.name.replace('-free', '');
      providerScores[normalizedName] = r.score;
    });
    
    console.log('📦 Provider scores for frontend:', providerScores);
    
    // Scale scores to 0-100 for frontend display (FREE tier: 0-20 -> 0-100)
    const displayMultiplier = tier === 'free' ? 5 : 1;
    
    const finalResult = {
      score: avgScore * displayMultiplier,
      // Add flat structure FIRST for frontend compatibility
      chatgpt: (providerScores.chatgpt || 0) * displayMultiplier,
      deepseek: (providerScores.deepseek || 0) * displayMultiplier,
      mistral: (providerScores.mistral || 0) * displayMultiplier,
      grok: (providerScores.grok || 0) * displayMultiplier,
      gemini: (providerScores.gemini || 0) * displayMultiplier,
      // Keep array for detailed view
      providers: successfulResults.map(r => ({
        name: r.name,
        score: r.score
      })),
      breakdown: breakdown || primaryResult.meta?.analysis || 'Analysis completed',
      insights: insights || 'Check individual provider results',
      confidence: confidence,
      analysis: primaryResult.meta?.analysis || '',
      verification: primaryResult.meta?.verification || '',
      tier: tier,
      model: primaryResult.meta?.model || 'multi-provider',
      promptVersion: primaryResult.meta?.promptVersion || (tier === 'free' ? '1.0-free' : '3.1-ultimate-pro'),
      timestamp: new Date().toISOString(),
      brandName
    };
    
    // Store result
    jobResults.set(jobId, {
      jobId,
      status: 'completed',
      userId,
      result: finalResult
    });
    
    saveToUserAnalyses(userEmail, finalResult);
    
    // Save to RAG
    await contextService.ingestDocuments([{
      id: `analysis-${jobId}`,
      content: `Brand: ${brandName}, ${tier.toUpperCase()} GEO Score: ${avgScore}${tier === 'pro' ? '/100' : '/20'}`,
      metadata: {
        type: `${tier}-geo-analysis`,
        brandName,
        score: avgScore,
        tier,
        promptVersion: tier === 'free' ? '1.0-free' : '3.1-ultimate-pro',
        timestamp: new Date().toISOString()
      }
    }]);
    
    console.log(`✅ ${tier.toUpperCase()} GEO analysis completed for ${brandName}\n`);
    
  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    jobResults.set(jobId, {
      jobId,
      status: 'completed',
      userId,
      result: {
        score: tier === 'free' ? 5 : 30,
        error: 'Analysis failed',
        brandName,
        tier,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Helper to save to user analyses
function saveToUserAnalyses(userEmail: string | null, result: any) {
  if (userEmail) {
    const user = users.get(userEmail);
    if (user) {
      if (!user.analyses) user.analyses = [];
      user.analyses.push(result);
    }
  }
}

// Results endpoint
fastify.get('/api/analyzer/results/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  
  if (jobResults.has(id)) {
    return jobResults.get(id);
  }
  
  reply.code(404);
  return { error: 'Job not found' };
});

// Dashboard data endpoint
fastify.get('/api/analyzer/dashboard', { preHandler: verifyToken }, async (request: any, reply) => {
  const user = users.get(request.user.email);
  if (!user) {
    reply.code(404);
    return { message: 'User not found' };
  }
  
  const analyses = user.analyses || [];
  const totalAnalyses = analyses.length;
  let averageScore = 0;
  
  if (totalAnalyses > 0) {
    const sum = analyses.reduce((acc: number, analysis: any) => {
      return acc + (analysis.score || 0);
    }, 0);
    averageScore = Math.round(sum / totalAnalyses);
  }
  
  return {
    totalAnalyses,
    averageScore,
    improvementRate: totalAnalyses > 1 ? '+12%' : '0%',
    aiMentions: totalAnalyses * 4,
    recentAnalyses: analyses.slice(-10)
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`\n🚀 Brain Index GEO v3.1 ULTIMATE`);
    console.log(`📡 Server: port ${port}`);
    console.log(`🎯 PRO Providers (${allProviders.length}):`, allProviders.map(p => p.name).join(', '));
    console.log(`🆓 FREE Providers (${freeProviders.length}):`, freeProviders.map(p => p.name).join(', '));
    console.log(`✅ Multi-tier GEO Ready!\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
