# AI Providers Configuration

## 🤖 Provider Overview

Brain Index GEO integrates with **5 major AI systems** to analyze brand visibility:

| Provider | Model | Company | API Cost | FREE Tier |
|----------|-------|---------|----------|-----------|
| ChatGPT | GPT-4 | OpenAI | ~$0.03/1K | ✅ |
| DeepSeek | V3 | DeepSeek | ~$0.002/1K | ✅ |
| Mistral | Large | Mistral AI | ~$0.008/1K | ✅ |
| Grok | Grok-2 | xAI | ~$0.015/1K | ✅ |
| Gemini | 1.5 Pro | Google | ~$0.01/1K | ✅ |

## 📋 Provider Registry

### Configuration File
`src/modules/analyzer/provider-registry.ts`

### Tier System

**FREE Tier:**
```typescript
buildProviders('free') → [
  ChatGPTFreeProvider,  // Simplified 3-criteria analysis
  DeepSeekProvider,     // Full analysis
  MistralProvider,      // Full analysis
  GrokProvider,         // Full analysis
  GeminiProvider        // Full analysis
]
```

**PRO Tier:**
```typescript
buildProviders('pro') → [
  ChatGPTProvider,      // Ultimate v3.1 (7 criteria)
  DeepSeekProvider,     // Full analysis
  MistralProvider,      // Full analysis
  GrokProvider,         // Full analysis
  GeminiProvider,       // Full analysis
  GoogleProvider        // Legacy (backwards compatibility)
]
```

## 🔑 API Keys

### Environment Variables

```bash
# OpenAI (ChatGPT)
OPENAI_API_KEY=sk-proj-...

# DeepSeek
DEEPSEEK_API_KEY=sk-...

# Mistral AI
MISTRAL_API_KEY=...

# xAI (Grok)
GROK_API_KEY=xai-...

# Google (Gemini)
GEMINI_API_KEY=AIza...
```

### Key Management
- Never commit keys to GitHub
- Use Railway environment variables
- Rotate keys quarterly
- Monitor usage via provider dashboards

## 📊 Provider Details

### 1. ChatGPT (OpenAI)

**Model:** GPT-4 Turbo  
**Endpoint:** https://api.openai.com/v1/chat/completions  
**Context:** 128K tokens

**Features:**
- Most accurate brand analysis
- Ultimate GEO v3.1 (PRO: 7 criteria, FREE: 3 criteria)
- Best for complex reasoning

**Configuration:**
```typescript
class ChatGPTProvider implements AIProvider {
  name = 'chatgpt';
  
  isEnabled(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
  
  async analyze(brandName: string): Promise<AnalysisResult> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    });
    
    return {
      name: 'chatgpt',
      score: extractScore(response),
      meta: { model: 'gpt-4-turbo', promptVersion: '3.1-ultimate-pro' }
    };
  }
}
```

---

### 2. DeepSeek

**Model:** DeepSeek V3  
**Endpoint:** https://api.deepseek.com/v1/chat/completions  
**Context:** 64K tokens

**Features:**
- Cost-effective ($0.002/1K tokens)
- Fast inference
- Good for technical analysis

**Configuration:**
```typescript
class DeepSeekProvider implements AIProvider {
  name = 'deepseek';
  
  async analyze(brandName: string): Promise<AnalysisResult> {
    // Similar to ChatGPT but with DeepSeek API
  }
}
```

---

### 3. Mistral

**Model:** Mistral Large  
**Endpoint:** https://api.mistral.ai/v1/chat/completions  
**Context:** 32K tokens

**Features:**
- European AI (GDPR compliant)
- Strong reasoning
- Multi-language support

**Configuration:**
```typescript
class MistralProvider implements AIProvider {
  name = 'mistral';
  
  async analyze(brandName: string): Promise<AnalysisResult> {
    // Mistral API implementation
  }
}
```

---

### 4. Grok (xAI)

**Model:** Grok-2  
**Endpoint:** https://api.x.ai/v1/chat/completions  
**Context:** 128K tokens

**Features:**
- Real-time data access
- X/Twitter integration
- Elon Musk's AI

**Configuration:**
```typescript
class GrokProvider implements AIProvider {
  name = 'grok';
  
  async analyze(brandName: string): Promise<AnalysisResult> {
    // Grok API implementation
  }
}
```

---

### 5. Gemini (Google)

**Model:** Gemini 1.5 Pro  
**Endpoint:** https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent  
**Context:** 1M tokens

**Features:**
- Largest context window
- Google Search integration
- Multimodal capabilities

**Configuration:**
```typescript
class GeminiProvider implements AIProvider {
  name = 'gemini';
  
  async analyze(brandName: string): Promise<AnalysisResult> {
    // Gemini API implementation
  }
}
```

## 🎯 Analysis Prompts

### FREE Tier Prompt (3 Criteria)
```
Analyze brand visibility for: {brandName}

Rate 0-20 based on:
1. Brand Recognition
2. Information Availability  
3. Sentiment

Return score only.
```

### PRO Tier Prompt (7 Criteria - Ultimate GEO v3.1)
```
ULTIMATE GEO ANALYSIS v3.1 for: {brandName}

Analyze across 7 criteria (0-100 each):

1. **Brand Presence** (0-15)
   - Name recognition
   - Industry positioning
   
2. **Information Depth** (0-15)
   - Data completeness
   - Source diversity
   
3. **Context Relevance** (0-15)
   - Use case coverage
   - Problem-solution fit
   
4. **Sentiment Quality** (0-15)
   - Overall perception
   - Review balance
   
5. **Competitive Position** (0-15)
   - Market standing
   - Differentiation
   
6. **Trust Signals** (0-15)
   - Credibility indicators
   - Authority markers
   
7. **Engagement Potential** (0-10)
   - Call-to-action strength
   - User interaction likelihood

Return:
- TOTAL_SCORE (0-100)
- DETAILED BREAKDOWN
- KEY INSIGHTS
- CONFIDENCE (High/Medium/Low)
```

## 🔄 Parallel Execution

### Implementation
```typescript
const results = await Promise.allSettled(
  providers.map(p => p.analyze(brandName))
);

const successful = results
  .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
  .map(r => r.value);
```

### Benefits
- Faster results (parallel vs sequential)
- Resilient (1 failure doesn't block others)
- Better coverage (multiple AI perspectives)

## 📊 Score Aggregation

### Method: Simple Average
```typescript
const avgScore = Math.round(
  successful.reduce((sum, r) => sum + r.score, 0) / successful.length
);
```

### Future: Weighted Average
```typescript
const weights = {
  'chatgpt': 0.3,    // 30% weight (most accurate)
  'gemini': 0.25,    // 25% weight
  'grok': 0.2,       // 20% weight
  'deepseek': 0.15,  // 15% weight
  'mistral': 0.1     // 10% weight
};
```

## 🐛 Error Handling

### Provider Failures
```typescript
try {
  return await provider.analyze(brandName);
} catch (error) {
  console.error(`❌ ${provider.name} failed:`, error);
  return null; // Filtered out by Promise.allSettled
}
```

### Minimum Providers
```typescript
if (successful.length === 0) {
  throw new Error('All providers failed');
}

if (successful.length < 3) {
  console.warn('⚠️ Only ${successful.length}/5 providers succeeded');
}
```

## 💰 Cost Estimation

### FREE Tier (per analysis)
- ChatGPT: ~$0.001 (100 tokens)
- DeepSeek: ~$0.0002
- Mistral: ~$0.0008
- Grok: ~$0.0015
- Gemini: ~$0.001
- **Total: ~$0.004 per analysis**

### PRO Tier (per analysis)
- ChatGPT: ~$0.003 (300 tokens, detailed)
- Others: Same as FREE
- **Total: ~$0.006 per analysis**

### Monthly (1000 analyses)
- FREE: ~$4
- PRO: ~$6

## 🎯 Provider Selection

### Automatic Filtering
```typescript
return list.filter(p => 
  enabledNames.includes(p.name) && p.isEnabled()
);
```

### Manual Override
```bash
# Enable only specific providers
PROVIDERS=chatgpt,gemini,grok
```

## 📝 Adding New Providers

1. Create provider file: `providers/new-provider.provider.ts`
2. Implement `AIProvider` interface
3. Add to `provider-registry.ts`
4. Add API key to env vars
5. Test with sample brand
6. Deploy

## 🔐 Security Best Practices

1. **Never log API keys**
2. **Rate limit API calls**
3. **Timeout after 30s**
4. **Retry with exponential backoff**
5. **Monitor usage/costs**
6. **Rotate keys quarterly**

## 📊 Monitoring

### Key Metrics
- Success rate per provider
- Average response time
- Cost per analysis
- Error frequency

### Logging
```typescript
console.log(`✅ ${successful.length}/${providers.length} providers succeeded`);
console.log(`🎯 Final score: ${avgScore}`);
```
