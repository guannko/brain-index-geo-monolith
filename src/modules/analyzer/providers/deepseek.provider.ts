import { AIProvider, ProviderResult } from './types.js';
import { env } from '../../../config/env.js';

export class DeepSeekProvider implements AIProvider {
  name: 'deepseek' = 'deepseek';
  
  isEnabled() { 
    return !!env.DEEPSEEK_API_KEY && process.env.PROVIDER_DEEPSEEK_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 25000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = this.buildGEOPrompt(input);
      
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 800
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`DeepSeek API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices[0]?.message?.content?.trim() || '';
      
      console.log(`\n🔍 DeepSeek Response (first 400 chars):\n${raw.substring(0, 400)}\n`);
      
      // Extract score - look for SCORE: XX/100 or SCORE: XX
      const scoreMatch = raw.match(/(?:TOTAL_)?SCORE[:\s]+(\d+)(?:\/100)?/i) || 
                        raw.match(/(\d+)\/100/) ||
                        raw.match(/\b(\d{1,2})\b/); // fallback to any 1-2 digit number
      
      const score = scoreMatch ? Math.max(0, Math.min(100, Number(scoreMatch[1]))) : 50;
      
      console.log(`✅ DeepSeek extracted score: ${score}`);
      
      return { 
        name: this.name, 
        score, 
        meta: { raw, model: 'deepseek-chat' } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`DeepSeek timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildGEOPrompt(brandName: string): string {
    return `Analyze "${brandName}" GEO visibility score (0-100). Be STRICT and REALISTIC.

CALIBRATION:
• No website/dead brand: 0-15
• Unknown startup: 5-25  
• Local business: 10-35
• Regional player: 25-50
• National brand: 45-70
• Major brand: 65-85
• Global leader: 80-95

Rate these 8 criteria (0-100 total):
1. AI Search Presence (0-25)
2. Brand Authority (0-20)
3. Context Quality (0-18)
4. Competitive Position (0-15)
5. Community Authority (0-10)
6. Information Richness (0-12)
7. Structured Data (0-8)
8. Geographic Visibility (0-12)

CRITICAL: End with exactly:
SCORE: XX/100

Be honest. Most brands score 10-40.`;
  }
}
