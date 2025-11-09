import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';

/**
 * FREE TIER GEO ANALYZER
 * - 3 simple criteria (AI Presence, Community Trust, Basic Info)
 * - Score /20 (easy to understand)
 * - < 200 tokens response
 * - Single pass (fast)
 * - Perfect for homepage quick check
 */
export class ChatGPTFreeProvider implements AIProvider {
  name: 'chatgpt-free' = 'chatgpt-free';
  
  isEnabled() { 
    return true; // Always enabled for free tier
  }

  async analyze(input: string): Promise<ProviderResult> {
    try {
      const prompt = this.buildFreeGEOPrompt(input);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      });
      
      const raw = response.choices[0]?.message?.content?.trim() || '';
      
      // Extract score from response
      const scoreMatch = raw.match(/TOTAL[:\s]+(\d+)\/20/i) || 
                        raw.match(/SCORE[:\s]+(\d+)/i);
      const score = scoreMatch ? Math.max(0, Math.min(20, Number(scoreMatch[1]))) : 10;
      
      return { 
        name: this.name, 
        score, 
        meta: { 
          analysis: raw,
          model: 'gpt-4o-mini',
          promptVersion: '1.0-free',
          tier: 'free'
        } 
      };
    } catch (error: any) {
      console.error('ChatGPT Free Provider Error:', error);
      throw error;
    }
  }

  private buildFreeGEOPrompt(brandName: string): string {
    return `Quick GEO Check for "${brandName}" - Rate on 20 points.

═══════════════════════════════════════
FREE TIER GEO SCORING (20 points):
═══════════════════════════════════════

1. AI PRESENCE (0-10 points)
   • How often mentioned in AI search (ChatGPT, Perplexity, Gemini)?
   • Position: Top result vs buried vs not found?
   
   0-2:   Unknown to AI systems
   3-5:   Rarely mentioned, niche only
   6-8:   Regularly appears in relevant queries
   9-10:  Dominant presence, consistently top

2. COMMUNITY TRUST (0-6 points)
   • Reddit, forums, social proof?
   • User recommendations and sentiment?
   
   0-1:   No community presence
   2-3:   Some mentions, mixed sentiment
   4-5:   Active positive discussions
   6:     Community favorite, highly recommended

3. BASIC INFO QUALITY (0-4 points)
   • Information depth and accuracy?
   • Up-to-date vs outdated data?
   
   0-1:   Poor or missing information
   2-3:   Basic facts available
   4:     Comprehensive, current info

═══════════════════════════════════════

RESPONSE FORMAT:

BRAND: ${brandName}

[1 sentence summary]

SCORES:
1. AI Presence: X/10
2. Community Trust: X/6
3. Info Quality: X/4

TOTAL: XX/20

INSIGHT: [One key finding - strength or weakness]

═══════════════════════════════════════

RULES:
- Be realistic based on actual market presence
- Unknown brands: 0-6, Niche: 7-13, Major: 14-20
- Keep response under 150 words
- No fluff, just facts`;
  }
}
