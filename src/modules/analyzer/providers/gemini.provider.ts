import { AIProvider, ProviderResult } from './types.js';
import { env } from '../../../config/env.js';

export class GeminiProvider implements AIProvider {
  name: 'gemini' = 'gemini';
  
  isEnabled() { 
    return !!env.GEMINI_API_KEY && process.env.PROVIDER_GEMINI_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = `Rate brand visibility (0..100) for "${input}". Consider brand recognition, market presence, online mentions. Reply with number only.`;
      
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8
          }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '0';
      const num = Math.max(0, Math.min(100, Number(raw.match(/\d+/)?.[0] || 0)));
      
      return { 
        name: this.name, 
        score: num, 
        meta: { raw, model: 'gemini-1.5-flash' } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Gemini timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}