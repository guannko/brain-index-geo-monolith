import { AIProvider } from './providers/types.js';

export async function buildProviders(tier: 'free' | 'pro'): Promise<AIProvider[]> {
  // Only PRO tier now - FREE tier removed
  // Use same PRO analysis for all cases
  
  const providers: AIProvider[] = [];
  
  // Always use PRO providers
  const chatgpt = new (await import('./providers/chatgpt.provider.js')).ChatGPTProvider();
  if (chatgpt.isEnabled()) {
    providers.push(chatgpt);
  }
  
  const deepseek = new (await import('./providers/deepseek.provider.js')).DeepSeekProvider();
  if (deepseek.isEnabled()) {
    providers.push(deepseek);
  }
  
  const mistral = new (await import('./providers/mistral.provider.js')).MistralProvider();
  if (mistral.isEnabled()) {
    providers.push(mistral);
  }
  
  const grok = new (await import('./providers/grok.provider.js')).GrokProvider();
  if (grok.isEnabled()) {
    providers.push(grok);
  }
  
  const gemini = new (await import('./providers/gemini.provider.js')).GeminiProvider();
  if (gemini.isEnabled()) {
    providers.push(gemini);
  }
  
  return providers;
}

export function determineTier(userPlan: string): 'pro' {
  // Always return PRO - FREE tier removed
  return 'pro';
}
