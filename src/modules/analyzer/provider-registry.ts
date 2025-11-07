import { AIProvider } from './providers/types.js';
import { ChatGPTProvider } from './providers/chatgpt.provider.js';
import { DeepSeekProvider } from './providers/deepseek.provider.js';
import { GoogleProvider } from './providers/google.provider.js';
import { MistralProvider } from './providers/mistral.provider.js';
import { GrokProvider } from './providers/grok.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';

export function buildProviders(): AIProvider[] {
  const list: AIProvider[] = [
    new ChatGPTProvider(),
    new DeepSeekProvider(),
    new MistralProvider(),
    new GrokProvider(),
    new GeminiProvider(),
    new GoogleProvider(), // Keep old one for backwards compatibility (will be disabled if no key)
  ];
  
  // Filter by ENV configuration
  const enabledNames = (process.env.PROVIDERS || 'chatgpt,deepseek,mistral,grok,gemini')
    .split(',')
    .map(s => s.trim().toLowerCase());
    
  return list.filter(p => enabledNames.includes(p.name) && p.isEnabled());
}
