import OpenAI from 'openai';

// Multi-provider AI analysis system
export interface ProviderConfig {
  name: string;
  enabled: boolean;
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
}

export interface AnalysisResult {
  provider: string;
  chatgpt_score: number;
  google_score: number;
  brand_strength?: number;
  website_strength?: number;
  analysis: string;
  recommendations?: string[];
  context_used?: boolean;
  error?: string;
}

class ProvidersService {
  private providers: Map<string, OpenAI> = new Map();
  
  // Initialize all configured providers
  initialize() {
    const configs: ProviderConfig[] = [
      {
        name: 'openai',
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'
      },
      {
        name: 'deepseek',
        enabled: !!process.env.DEEPSEEK_API_KEY,
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat'
      },
      {
        name: 'mistral',
        enabled: !!process.env.MISTRAL_API_KEY,
        apiKey: process.env.MISTRAL_API_KEY,
        baseURL: 'https://api.mistral.ai/v1',
        model: 'mistral-small-latest'
      },
      {
        name: 'groq',
        enabled: !!process.env.GROQ_API_KEY,
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        model: 'llama-3.1-8b-instant'
      },
      {
        name: 'gemini',
        enabled: !!process.env.GEMINI_API_KEY,
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-1.5-flash'
      }
    ];
    
    for (const config of configs) {
      if (config.enabled && config.apiKey) {
        const client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL
        });
        this.providers.set(config.name, client);
        console.log(`✅ Provider initialized: ${config.name}`);
      } else {
        console.log(`⚠️ Provider disabled (no API key): ${config.name}`);
      }
    }
    
    console.log(`Total active providers: ${this.providers.size}`);
  }
  
  // Get model name for provider
  private getModel(providerName: string): string {
    const models: Record<string, string> = {
      openai: 'gpt-3.5-turbo',
      deepseek: 'deepseek-chat',
      mistral: 'mistral-small-latest',
      groq: 'llama-3.1-8b-instant',
      gemini: 'gemini-1.5-flash'
    };
    return models[providerName] || 'gpt-3.5-turbo';
  }
  
  // Analyze with single provider
  async analyzeWithProvider(
    providerName: string,
    prompt: string,
    systemPrompt: string
  ): Promise<AnalysisResult> {
    const client = this.providers.get(providerName);
    
    if (!client) {
      return {
        provider: providerName,
        chatgpt_score: 0,
        google_score: 0,
        analysis: 'Provider not configured',
        error: 'Provider not available'
      };
    }
    
    try {
      const response = await client.chat.completions.create({
        model: this.getModel(providerName),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      });
      
      const content = response.choices[0].message.content || '{}';
      
      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          provider: providerName,
          chatgpt_score: parsed.chatgpt_score || 0,
          google_score: parsed.google_score || 0,
          brand_strength: parsed.brand_strength,
          website_strength: parsed.website_strength,
          analysis: parsed.analysis || 'No analysis provided',
          recommendations: parsed.recommendations || [],
          context_used: parsed.context_used || false
        };
      }
      
      throw new Error('No valid JSON in response');
      
    } catch (error: any) {
      console.error(`Error with ${providerName}:`, error.message);
      return {
        provider: providerName,
        chatgpt_score: 0,
        google_score: 0,
        analysis: `Error: ${error.message}`,
        error: error.message
      };
    }
  }
  
  // Analyze with ALL providers in parallel
  async analyzeWithAllProviders(
    brandName: string,
    domain: string | null,
    ragContext: string
  ): Promise<AnalysisResult[]> {
    
    // Build prompt
    let prompt: string;
    const systemPrompt = 'You are an expert in brand visibility and website AI optimization with access to a knowledge base. Use the provided context when relevant.';
    
    if (domain) {
      prompt = `Analyze the AI visibility for the brand "${brandName}" and its website "${domain}".
      
      ${ragContext.length > 0 ? `Relevant context from knowledge base:\n${ragContext}\n\n` : ''}
      
      Provide comprehensive analysis with scores from 0-100 for:
      1. ChatGPT visibility - How likely ChatGPT would mention this brand AND reference the website
      2. Google AI visibility - How likely this brand and site appear in Google's AI features
      
      Consider for the BRAND:
      - Brand recognition and market presence
      - Industry authority and reputation
      - Mention frequency in training data
      
      Consider for the WEBSITE (${domain}):
      - Domain authority and trustworthiness
      - Content quality and structure
      - Technical SEO and crawlability
      - Presence in Wikipedia, Reddit, and authoritative sources
      - Schema.org markup and structured data
      
      For major brands with strong sites (Apple/apple.com, Amazon/amazon.com) - give scores 85-95
      For known brands with decent sites - give scores 60-80
      For small businesses with basic sites - give scores 30-50
      For unknown brands with new sites - give scores 10-30
      
      Return ONLY a JSON object:
      {
        "chatgpt_score": <number 0-100>,
        "google_score": <number 0-100>,
        "brand_strength": <number 0-100>,
        "website_strength": <number 0-100>,
        "analysis": "<detailed analysis of both brand and website>",
        "recommendations": ["<specific action 1>", "<specific action 2>", "<specific action 3>"],
        "context_used": <boolean indicating if provided context was relevant>
      }`;
    } else {
      prompt = `Analyze the brand visibility of "${brandName}" in AI systems.
      
      ${ragContext.length > 0 ? `Relevant context from knowledge base:\n${ragContext}\n\n` : ''}
      
      Rate from 0-100 for:
      1. ChatGPT visibility - how well this brand would be represented in ChatGPT responses
      2. Google AI visibility - how well this brand would appear in Google's AI features
      
      For well-known brands - give scores 70-95
      For medium brands - give scores 40-70
      For unknown brands - give scores 10-40
      
      Return ONLY a JSON object:
      {
        "chatgpt_score": <number 0-100>,
        "google_score": <number 0-100>,
        "analysis": "<brief explanation>",
        "context_used": <boolean indicating if provided context was relevant>
      }`;
    }
    
    // Call ALL providers in parallel
    const promises = Array.from(this.providers.keys()).map(providerName =>
      this.analyzeWithProvider(providerName, prompt, systemPrompt)
    );
    
    const results = await Promise.all(promises);
    
    // Log results summary
    console.log('\n🎯 Multi-Provider Analysis Results:');
    for (const result of results) {
      if (!result.error) {
        console.log(`  ${result.provider}: ChatGPT=${result.chatgpt_score}, Google=${result.google_score}`);
      } else {
        console.log(`  ${result.provider}: ERROR - ${result.error}`);
      }
    }
    
    return results;
  }
  
  // Aggregate results from multiple providers
  aggregateResults(results: AnalysisResult[]): any {
    const validResults = results.filter(r => !r.error && r.chatgpt_score > 0);
    
    if (validResults.length === 0) {
      return {
        chatgpt: 50,
        google: 50,
        analysis: 'No valid results from providers',
        providers: results
      };
    }
    
    // Calculate averages
    const avgChatGPT = Math.round(
      validResults.reduce((sum, r) => sum + r.chatgpt_score, 0) / validResults.length
    );
    
    const avgGoogle = Math.round(
      validResults.reduce((sum, r) => sum + r.google_score, 0) / validResults.length
    );
    
    // Find min/max for variance
    const chatGPTScores = validResults.map(r => r.chatgpt_score);
    const googleScores = validResults.map(r => r.google_score);
    
    const minChatGPT = Math.min(...chatGPTScores);
    const maxChatGPT = Math.max(...chatGPTScores);
    const minGoogle = Math.min(...googleScores);
    const maxGoogle = Math.max(...googleScores);
    
    // Combine analyses
    const combinedAnalysis = validResults
      .filter(r => r.analysis && r.analysis.length > 10)
      .map(r => `[${r.provider}]: ${r.analysis}`)
      .join('\n\n');
    
    // Collect all recommendations
    const allRecommendations = validResults
      .flatMap(r => r.recommendations || [])
      .filter((rec, index, self) => self.indexOf(rec) === index); // unique
    
    return {
      chatgpt: avgChatGPT,
      google: avgGoogle,
      chatgptRange: { min: minChatGPT, max: maxChatGPT },
      googleRange: { min: minGoogle, max: maxGoogle },
      analysis: combinedAnalysis || 'Multi-provider analysis completed',
      recommendations: allRecommendations.slice(0, 5), // top 5
      providersUsed: validResults.length,
      variance: {
        chatgpt: maxChatGPT - minChatGPT,
        google: maxGoogle - minGoogle
      },
      providerResults: results.map(r => ({
        provider: r.provider,
        chatgpt: r.chatgpt_score,
        google: r.google_score,
        error: r.error
      }))
    };
  }
  
  getActiveProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providersService = new ProvidersService();
