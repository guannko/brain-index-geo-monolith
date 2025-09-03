import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';
import { env } from '../../../config/env.js';

export class ChatGPTProvider implements AIProvider {
  name: 'chatgpt' = 'chatgpt';
  
  isEnabled() { 
    return process.env.PROVIDER_CHATGPT_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = `Rate brand visibility (0..100) for "${input}". Consider brand recognition, market presence, online mentions. Reply with number only.`;
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 8,
        // @ts-ignore: openai fetch supports signal
        signal: (controller as any).signal
      });
      
      const raw = res.choices[0]?.message?.content?.trim() || '0';
      const num = Math.max(0, Math.min(100, Number(raw.match(/\d+/)?.[0] || 0)));
      
      return { 
        name: this.name, 
        score: num, 
        meta: { raw, model: 'gpt-4o-mini' } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`ChatGPT timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}