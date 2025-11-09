# Backend Architecture - brain-index-geo-monolith

## 🏗️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Fastify
- **Language:** TypeScript
- **Deployment:** Railway
- **Vector DB:** Qdrant (RAG pipeline)

## 📁 Project Structure

```
src/
├── index.ts                 # Main entry point
├── modules/
│   └── analyzer/
│       ├── provider-registry.ts      # Provider configuration
│       ├── analyzer.service.ts       # Analysis orchestration
│       ├── analyzer.controller.ts    # HTTP endpoints
│       └── providers/
│           ├── types.ts              # Provider interface
│           ├── chatgpt.provider.ts   # OpenAI GPT-4
│           ├── chatgpt-free.provider.ts  # Free tier
│           ├── deepseek.provider.ts  # DeepSeek V3
│           ├── mistral.provider.ts   # Mistral Large
│           ├── grok.provider.ts      # xAI Grok-2
│           └── gemini.provider.ts    # Google Gemini
├── services/
│   └── context.service.ts   # RAG/Qdrant integration
└── config/                  # Configuration files
```

## 🔌 API Endpoints

### Health Check
```
GET /health
Response: {
  status: 'ok',
  version: '3.1.0-ultimate-pro',
  providers: { pro: [...], free: [...] }
}
```

### Authentication
```
POST /api/auth/register
POST /api/auth/login
GET /api/user/profile (protected)
GET /api/user/analyses (protected)
```

### Analysis
```
POST /api/analyzer/analyze
Body: { input: "brand name", tier?: "free" | "pro" }
Response: { jobId, status, tier, providers }

GET /api/analyzer/results/:jobId
Response: { 
  status: "completed",
  result: { score, providers, breakdown, insights }
}

GET /api/analyzer/dashboard (protected)
Response: { totalAnalyses, averageScore, recentAnalyses }
```

## 🤖 AI Provider System

### Provider Interface
```typescript
interface AIProvider {
  name: string;
  isEnabled(): boolean;
  analyze(brandName: string): Promise<AnalysisResult>;
}

interface AnalysisResult {
  name: string;
  score: number;
  meta?: {
    model: string;
    promptVersion: string;
    analysis: string;
  };
}
```

### Provider Registry (`provider-registry.ts`)

**FREE Tier:**
```typescript
buildProviders('free') → [
  ChatGPTFreeProvider,
  DeepSeekProvider,
  MistralProvider,
  GrokProvider,
  GeminiProvider
]
```

**PRO Tier:**
```typescript
buildProviders('pro') → [
  ChatGPTProvider,      // Ultimate v3.1 PRO (7 criteria)
  DeepSeekProvider,
  MistralProvider,
  GrokProvider,
  GeminiProvider,
  GoogleProvider        // Legacy
]
```

### Provider Configuration

Each provider checks for API key availability:
```typescript
isEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY; // Example
}
```

**Environment Variables:**
- `OPENAI_API_KEY` - ChatGPT
- `DEEPSEEK_API_KEY` - DeepSeek
- `MISTRAL_API_KEY` - Mistral
- `GROK_API_KEY` - Grok (xAI)
- `GEMINI_API_KEY` - Gemini (Google)

## 🔄 Analysis Flow

1. **Request received** → Create job ID
2. **Async analysis** → Run all providers in parallel
3. **Promise.allSettled** → Collect successful results
4. **Score calculation** → Average across providers
5. **Result storage** → In-memory Map (jobResults)
6. **RAG ingestion** → Save to Qdrant (if available)
7. **Client polling** → GET /api/analyzer/results/:jobId

## 🎯 Multi-Provider Analysis

```typescript
async function runMultiProviderAnalysis(
  brandName: string,
  jobId: string,
  userId: string,
  tier: 'free' | 'pro',
  providers: AIProvider[]
) {
  // Run all providers in parallel
  const results = await Promise.allSettled(
    providers.map(p => p.analyze(brandName))
  );
  
  // Filter successful results
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  // Calculate average score
  const avgScore = Math.round(
    successful.reduce((sum, r) => sum + r.score, 0) / successful.length
  );
  
  // Store result
  jobResults.set(jobId, {
    jobId,
    status: 'completed',
    result: {
      score: avgScore,
      providers: successful.map(r => ({
        name: r.name,
        score: r.score
      })),
      tier,
      timestamp: new Date().toISOString()
    }
  });
}
```

## 🗄️ Data Storage

**In-Memory (Production):**
- `jobResults` - Map<jobId, AnalysisResult>
- `users` - Map<email, User>

**Vector DB (Qdrant):**
- Collection: `brain-index-documents`
- Used for: RAG pipeline, context enrichment
- Status: Currently disabled due to connection issues

## 🔐 Authentication

**JWT-based:**
- Secret: `JWT_SECRET` env var
- Expiration: 7 days
- Middleware: `verifyToken()`

## 🚀 Deployment (Railway)

**Service:** bubbly-elegance
**Region:** Europe
**Port:** 3000
**Auto-deploy:** On push to main branch

**Environment Variables:**
```
PORT=3000
OPENAI_API_KEY=sk-proj-...
DEEPSEEK_API_KEY=sk-...
MISTRAL_API_KEY=...
GROK_API_KEY=xai-...
GEMINI_API_KEY=AIza...
QDRANT_URL=http://qdrant-ma8b.railway.internal:6333
```

## 📊 Monitoring

**Console Logs:**
- `✅ Initialized X PRO providers: ...`
- `✅ Initialized X FREE providers: ...`
- `🎯 Starting FREE/PRO analysis with X provider(s)`
- `✅ X/X providers succeeded`

**Health Check:**
- `/health` endpoint
- Shows active providers
- Service version

## 🔧 Key Features

1. **Multi-Provider Support** - 5 AI systems analyzed in parallel
2. **Tier System** - FREE (all 5 AI) vs PRO (detailed analysis)
3. **Async Processing** - Job queue with polling
4. **Error Resilience** - Promise.allSettled handles partial failures
5. **RAG Pipeline** - Context enrichment (when Qdrant available)

## 🐛 Known Issues

- Qdrant connection timeout (non-critical)
- In-memory storage (resets on redeploy)
- No persistent user database yet

## 📝 Next Steps

- Fix Qdrant private networking
- Add persistent storage (PostgreSQL)
- Implement PRO tier features
- Add monitoring/analytics
