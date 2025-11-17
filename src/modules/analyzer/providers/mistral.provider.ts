import { AIProvider, ProviderResult } from './types.js';
import { env } from '../../../config/env.js';

export class MistralProvider implements AIProvider {
  name: 'mistral' = 'mistral';
  
  isEnabled() { 
    return !!env.MISTRAL_API_KEY && process.env.PROVIDER_MISTRAL_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 25000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = this.buildGEOPrompt(input);
      
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 800
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Mistral API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices[0]?.message?.content?.trim() || '';
      
      console.log(`\n🔍 Mistral Response (first 400 chars):\n${raw.substring(0, 400)}\n`);
      
      // Extract score - try multiple patterns
      let score = 50; // default
      
      // Pattern 1: SCORE: XX/100 or SCORE: XX
      const scoreMatch = raw.match(/SCORE[:\s]+(\d+)(?:\/100)?/i);
      if (scoreMatch) {
        score = Number(scoreMatch[1]);
        console.log(`✅ Mistral extracted score from SCORE: ${score}`);
      } else {
        // Pattern 2: Total: XX/100
        const totalMatch = raw.match(/Total[:\s]+(\d+)(?:\/100)?/i);
        if (totalMatch) {
          score = Number(totalMatch[1]);
          console.log(`✅ Mistral extracted score from Total: ${score}`);
        } else {
          // Pattern 3: XX/100 anywhere in last 200 chars
          const lastPart = raw.slice(-200);
          const slashMatch = lastPart.match(/(\d{1,2})\/100/);
          if (slashMatch) {
            score = Number(slashMatch[1]);
            console.log(`✅ Mistral extracted score from XX/100: ${score}`);
          } else {
            console.log(`⚠️ Mistral: No score pattern found, using default: ${score}`);
          }
        }
      }
      
      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));
      
      return { 
        name: this.name, 
        score, 
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

  private buildGEOPrompt(brandName: string): string {
    return `Analyze "${brandName}" GEO visibility. Be STRICT and REALISTIC.

CALIBRATION SCALE (0-100):
• No website/dead: 0-15
• Unknown startup: 5-25  
• Local business: 10-35
• Regional: 25-50
• National: 45-70
• Major brand: 65-85
• Global leader: 80-95

Evaluate 8 criteria:
1. AI Search Presence (0-25 points)
2. Brand Authority (0-20 points)
3. Context Quality (0-18 points)
4. Competitive Position (0-15 points)
5. Community Authority (0-10 points)
6. Information Richness (0-12 points)
7. Structured Data (0-8 points)
8. Geographic Visibility (0-12 points)

Provide brief analysis, then sum all scores.

MANDATORY: You MUST end your response with this EXACT line:
SCORE: XX/100

Where XX is the total (0-100). This line is REQUIRED!

Example ending:
"...limited visibility overall.
SCORE: 23/100"

Be honest. Most brands score 10-40.`;
  }
}
