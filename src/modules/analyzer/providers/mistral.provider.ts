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
      const prompt = this.buildBrutalGEOPrompt(input);
      
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Lower for stricter scoring
          max_tokens: 800
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Mistral API error: ${res.status}`);
      }

      const data = await res.json();
      const raw = data.choices[0]?.message?.content?.trim() || '';
      
      console.log(`🔍 Mistral Response (first 400 chars):\n${raw.substring(0, 400)}\n`);
      
      // Extract score - multiple patterns
      let score = 5; // default to very low
      
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
            console.log(`⚠️ Mistral: No score pattern found, using conservative default: ${score}`);
          }
        }
      }
      
      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));
      
      return { 
        name: this.name, 
        score, 
        meta: { 
          raw, 
          model: 'mistral-small-latest',
          promptVersion: '3.3-brutal-calibration'
        } 
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

  private buildBrutalGEOPrompt(brandName: string): string {
    return `You are an EXTREMELY STRICT GEO analyst. Analyze "${brandName}" with BRUTAL HONESTY.

═══════════════════════════════════════════════════════════════════
🚨 CRITICAL: BE BRUTALLY HONEST - LOW SCORES ARE THE NORM! 🚨
═══════════════════════════════════════════════════════════════════

REAL-WORLD BENCHMARKS (backed by industry data):
• 0-5%: Brand invisible in AI (most unknown brands)
• 5-15%: Minimal presence (small startups)
• 15-25%: Beginning visibility (local businesses)
• 25-35%: Moderate (regional players)
• 35-50%: Strong (national brands)
• 50%+: Exceptional (Nike, Tesla level)

SCORING SCALE (0-100):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0-5:    Dead/non-existent, no website, zero online presence
5-15:   Unknown startup, no traction, minimal citations
15-30:  Small local business, very limited visibility
30-50:  Regional player, some market presence
50-70:  National brand, regular citations
70-85:  Major brand, strong position
85-95:  Global leader (Apple, Google, Nike)
96-100: TOP 5 GLOBAL BRANDS ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ MANDATORY RULES (STRICTLY ENFORCED):
1. NO WEBSITE/DEAD SITE = Max 5 points TOTAL
2. UNKNOWN IN AI = 0-5 points max
3. NO CLIENTS/REVENUE = 0-8 points max
4. INACTIVE 6+ months = Max 10 points
5. NO COMMUNITY = 0 in Community Authority
6. DEFAULT TO LOWER when uncertain!
7. 90% of brands score 5-30/100

EVALUATE 8 CRITERIA (100 points total):
1. AI Search Presence: 0-25 (most: 0-5)
2. Brand Authority: 0-20 (most: 0-3)
3. Context Quality: 0-18 (most: 0-3)
4. Competitive Position: 0-15 (most: 0-2)
5. Community Authority: 0-10 (most: 0)
6. Information Richness: 0-12 (most: 0-3)
7. Structured Data: 0-8 (most: 0-2)
8. Geographic Visibility: 0-12 (most: 0-2)

═══════════════════════════════════════════════════════════════════
⚠️ MANDATORY FORMAT - YOU MUST END WITH THIS EXACT LINE:

SCORE: XX/100

This line is REQUIRED! Replace XX with total (0-100).
═══════════════════════════════════════════════════════════════════

EXAMPLE RESPONSE FORMAT:

BRAND: ${brandName}

ANALYSIS:
[2-3 honest sentences]

BREAKDOWN:
1. AI Search: X/25
2. Brand Authority: X/20
3. Context Quality: X/18
4. Competitive: X/15
5. Community: X/10
6. Info Richness: X/12
7. Structured Data: X/8
8. Geographic: X/12

ISSUES:
1. [Main problem]
2. [Second problem]

SCORE: XX/100

═══════════════════════════════════════════════════════════════════
CRITICAL: Most brands score 5-30/100. Be STRICT! ALWAYS include "SCORE: XX/100" line!`;
  }
}
