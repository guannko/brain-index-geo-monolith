import { AIProvider, ProviderResult } from './types.js';
import { env } from '../../../config/env.js';

export class MistralProvider implements AIProvider {
  name: 'mistral' = 'mistral';
  
  isEnabled() { 
    return !!env.MISTRAL_API_KEY && process.env.PROVIDER_MISTRAL_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = `Rate brand visibility (0..100) for "${input}". Consider brand recognition, market presence, online mentions. Reply with number only.`;
      
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 8
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Mistral API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices[0]?.message?.content?.trim() || '0';
      const num = Math.max(0, Math.min(100, Number(raw.match(/\d+/)?.[0] || 0)));
      
      return { 
        name: this.name, 
        score: num, 
        meta: { raw, model: 'mistral-small-latest' } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Mistral timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}