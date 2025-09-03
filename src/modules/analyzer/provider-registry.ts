import { AIProvider } from './providers/types.js';
import { ChatGPTProvider } from './providers/chatgpt.provider.js';
import { GoogleProvider } from './providers/google.provider.js';

export function buildProviders(): AIProvider[] {
  const list: AIProvider[] = [
    new ChatGPTProvider(),
    new GoogleProvider(),
    // Easy to add more:
    // new PerplexityProvider(),
    // new ClaudeProvider(),
    // new MistralProvider(),
  ];
  
  // Filter by ENV configuration
  const enabledNames = (process.env.PROVIDERS || 'chatgpt,google')
    .split(',')
    .map(s => s.trim().toLowerCase());
    
  return list.filter(p => enabledNames.includes(p.name) && p.isEnabled());
}