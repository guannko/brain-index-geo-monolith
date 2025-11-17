import { AIProvider, ProviderResult } from './types.js';
import { env } from '../../../config/env.js';

export class GrokProvider implements AIProvider {
  name: 'grok' = 'grok';
  
  isEnabled() { 
    return !!env.GROK_API_KEY && process.env.PROVIDER_GROK_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 25000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = this.buildBrutalGEOPrompt(input);
      
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Lower for stricter scoring
          max_tokens: 1000
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Grok API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const raw = data.choices[0]?.message?.content?.trim() || '';
      
      console.log(`🔍 Grok Response (first 400 chars):\n${raw.substring(0, 400)}\n`);
      
      // Extract score - multiple patterns
      let score = 5; // default to very low
      
      // Pattern 1: SCORE: XX/100 or SCORE: XX
      const scoreMatch = raw.match(/SCORE[:\s]+(\d+)(?:\/100)?/i);
      if (scoreMatch) {
        score = Number(scoreMatch[1]);
        console.log(`✅ Grok extracted score from SCORE: ${score}`);
      } else {
        // Pattern 2: Total: XX/100
        const totalMatch = raw.match(/(?:TOTAL|Total)[:\s]+(\d+)(?:\/100)?/i);
        if (totalMatch) {
          score = Number(totalMatch[1]);
          console.log(`✅ Grok extracted score from Total: ${score}`);
        } else {
          // Pattern 3: XX/100 anywhere in last 200 chars
          const lastPart = raw.slice(-200);
          const slashMatch = lastPart.match(/(\d{1,2})\/100/);
          if (slashMatch) {
            score = Number(slashMatch[1]);
            console.log(`✅ Grok extracted score from XX/100: ${score}`);
          } else {
            console.log(`⚠️ Grok: No score pattern found, using conservative default: ${score}`);
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
          model: 'grok-beta',
          promptVersion: '3.3-brutal-calibration'
        } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Grok timeout after ${timeoutMs}ms`);
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

REAL-WORLD AI VISIBILITY BENCHMARKS (backed by industry data):
• 0-5%: Brand doesn't exist in AI answers (most unknown brands)
• 5-15%: Minimal presence, rare mentions (small startups)
• 15-25%: Beginning visibility (local businesses)
• 25-35%: Moderate presence (established regional players)
• 35-50%: Strong visibility (national brands)
• 50%+: Exceptional (major brands like Nike, Tesla)

SCORING SCALE (0-100):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0-5:    Dead/non-existent brand, no website, zero online presence
5-15:   Unknown startup, no traction, minimal or no citations
15-30:  Small local business, very limited visibility
30-50:  Regional player, some market presence
50-70:  Established national brand, regular citations
70-85:  Major brand, strong market position
85-95:  Global leader, dominant in category (Apple, Google, Nike)
96-100: RESERVED FOR TOP 5 GLOBAL BRANDS ONLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ MANDATORY REALITY CHECKS (APPLY STRICTLY):
1. NO WEBSITE OR DEAD SITE = Maximum 5 points TOTAL
2. NEVER heard of in AI systems = 0-5 points maximum
3. NO CLIENTS/NO REVENUE = 0-8 points maximum  
4. INACTIVE 6+ months = Maximum 10 points
5. NO COMMUNITY/SOCIAL MEDIA = 0 in Community Authority
6. DEFAULT TO LOWER SCORES when uncertain!
7. BE HONEST: 90% of brands score 5-30/100

EVALUATION CRITERIA (8 categories, 100 points total):

1. AI SEARCH PRESENCE (0-25 points) - Most brands: 0-5
2. BRAND AUTHORITY (0-20 points) - Most brands: 0-3
3. CONTEXT QUALITY (0-18 points) - Most brands: 0-3
4. COMPETITIVE POSITION (0-15 points) - Most brands: 0-2
5. COMMUNITY AUTHORITY (0-10 points) - Most brands: 0
6. INFORMATION RICHNESS (0-12 points) - Most brands: 0-3
7. STRUCTURED DATA (0-8 points) - Most brands: 0-2
8. GEOGRAPHIC VISIBILITY (0-12 points) - Most brands: 0-2

═══════════════════════════════════════════════════════════════════
⚠️ MANDATORY FORMAT - YOU MUST END WITH THIS EXACT LINE:

SCORE: XX/100

This line is REQUIRED! Replace XX with total (0-100).
═══════════════════════════════════════════════════════════════════

RESPONSE FORMAT:

BRAND: ${brandName}

ANALYSIS:
[2-3 brutal honest sentences about actual visibility]

BREAKDOWN:
1. AI Search Presence: X/25
2. Brand Authority: X/20
3. Context Quality: X/18
4. Competitive Position: X/15
5. Community Authority: X/10
6. Information Richness: X/12
7. Structured Data: X/8
8. Geographic Visibility: X/12

CRITICAL ISSUES:
1. [Main problem]
2. [Second problem]
3. [Third problem]

SCORE: XX/100

═══════════════════════════════════════════════════════════════════

BE BRUTALLY HONEST. Most brands score 5-30/100. That's NORMAL!
ALWAYS include the "SCORE: XX/100" line at the end!`;
  }
}
