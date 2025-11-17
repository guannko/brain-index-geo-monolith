import { AIProvider } from './types.js';
import { buildProviders as buildChatGPT } from './chatgpt.provider.js';

export function buildProviders(tier: 'free' | 'pro'): AIProvider[] {
  // Only PRO tier now - FREE tier removed
  // Use same PRO analysis for all cases
  
  const providers: AIProvider[] = [];
  
  // Always use PRO providers
  const chatgpt = new (await import('./chatgpt.provider.js')).ChatGPTProvider();
  if (chatgpt.isEnabled()) {
    providers.push(chatgpt);
  }
  
  const deepseek = new (await import('./deepseek.provider.js')).DeepSeekProvider();
  if (deepseek.isEnabled()) {
    providers.push(deepseek);
  }
  
  const mistral = new (await import('./mistral.provider.js')).MistralProvider();
  if (mistral.isEnabled()) {
    providers.push(mistral);
  }
  
  const grok = new (await import('./grok.provider.js')).GrokProvider();
  if (grok.isEnabled()) {
    providers.push(grok);
  }
  
  const gemini = new (await import('./gemini.provider.js')).GeminiProvider();
  if (gemini.isEnabled()) {
    providers.push(gemini);
  }
  
  return providers;
}

export function determineTier(userPlan: string): 'pro' {
  // Always return PRO - FREE tier removed
  return 'pro';
}
