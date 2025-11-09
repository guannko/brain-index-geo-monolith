import { AIProvider } from './providers/types.js';
import { ChatGPTProvider } from './providers/chatgpt.provider.js';
import { ChatGPTFreeProvider } from './providers/chatgpt-free.provider.js';
import { DeepSeekProvider } from './providers/deepseek.provider.js';
import { GoogleProvider } from './providers/google.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';
import { GrokProvider } from './providers/grok.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';

export function buildProviders(tier: 'free' | 'pro' = 'pro'): AIProvider[] {
  // FREE TIER: All 5 main providers (show real visibility across all AI)
  if (tier === 'free') {
    return [
      new ChatGPTFreeProvider(),   // Free analysis
      new DeepSeekProvider(),
      new MistralProvider(),
      new GrokProvider(),
      new GeminiProvider(),
    ].filter(p => p.isEnabled());
  }
  
  // PRO TIER: All providers with Ultimate GEO 7-criteria analysis
  const list: AIProvider[] = [
    new ChatGPTProvider(),       // Ultimate v3.1 PRO
    new DeepSeekProvider(),
    new MistralProvider(),
    new GrokProvider(),
    new GeminiProvider(),
    new GoogleProvider(),        // Keep old one for backwards compatibility
  ];
  
  // Filter by ENV configuration
  const enabledNames = (process.env.PROVIDERS || 'chatgpt,deepseek,mistral,grok,gemini')
    .split(',')
    .map(s => s.trim().toLowerCase());
    
  return list.filter(p => enabledNames.includes(p.name) && p.isEnabled());
}

// Helper to determine tier from request or user plan
export function determineTier(userPlan?: string): 'free' | 'pro' {
  if (!userPlan || userPlan === 'FREE' || userPlan === 'free') {
    return 'free';
  }
  return 'pro';
}
