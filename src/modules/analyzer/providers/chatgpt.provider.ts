import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';

export class ChatGPTProvider implements AIProvider {
  name: 'chatgpt' = 'chatgpt';
  
  isEnabled() { 
    return process.env.PROVIDER_CHATGPT_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    try {
      // PASS 1: Detailed GEO Analysis with BRUTAL calibration
      const analysisPrompt = this.buildUltimateGEOPrompt(input);
      
      const analysisRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.1, // Lower for more conservative scoring
        max_tokens: 1200
      });
      
      const analysisRaw = analysisRes.choices[0]?.message?.content?.trim() || '';
      
      console.log(`\n🔍 ChatGPT Analysis Response (first 500 chars):\n${analysisRaw.substring(0, 500)}\n`);
      
      // PASS 2: Verification & Reality Check
      const verifyPrompt = this.buildVerificationPrompt(input, analysisRaw);
      
      const verifyRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: verifyPrompt }],
        temperature: 0.05, // Even lower for strict verification
        max_tokens: 400
      });
      
      const verificationRaw = verifyRes.choices[0]?.message?.content?.trim() || '';
      
      console.log(`\n🔍 ChatGPT Verification Response:\n${verificationRaw}\n`);
      
      // Extract final score - try multiple patterns
      let score = 5; // default to very low
      
      // Pattern 1: FINAL_SCORE: XX
      const finalScoreMatch = verificationRaw.match(/FINAL[_\s]+SCORE[:\s]+(\d+)/i);
      if (finalScoreMatch) {
        score = Number(finalScoreMatch[1]);
        console.log(`✅ Extracted score from FINAL_SCORE: ${score}`);
      } else {
        // Pattern 2: TOTAL_SCORE: XX/100
        const totalScoreMatch = analysisRaw.match(/TOTAL[_\s]+SCORE[:\s]+(\d+)/i);
        if (totalScoreMatch) {
          score = Number(totalScoreMatch[1]);
          console.log(`✅ Extracted score from TOTAL_SCORE: ${score}`);
        } else {
          // Pattern 3: XX/100 anywhere
          const slashScoreMatch = analysisRaw.match(/(\d+)\/100/);
          if (slashScoreMatch) {
            score = Number(slashScoreMatch[1]);
            console.log(`✅ Extracted score from XX/100: ${score}`);
          } else {
            console.log(`⚠️ No score pattern found! Using conservative default: ${score}`);
          }
        }
      }
      
      // Clamp to 0-100
      score = Math.max(0, Math.min(100, score));
      
      return { 
        name: this.name, 
        score, 
        meta: { 
          analysis: analysisRaw,
          verification: verificationRaw,
          model: 'gpt-4o-mini',
          promptVersion: '3.3-brutal-calibration'
        } 
      };
    } catch (error: any) {
      console.error('ChatGPT Provider Error:', error);
      throw error;
    }
  }

  private buildUltimateGEOPrompt(brandName: string): string {
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

1. AI SEARCH PRESENCE (0-25 points)
   Reality: Most brands score 0-5 here
   0-3:   Never appears in AI answers
   4-8:   Extremely rare mentions
   9-15:  Occasional niche appearances
   16-20: Regular category mentions
   21-25: Industry leader status (very rare)

2. BRAND AUTHORITY (0-20 points)
   Reality: Most brands score 0-3 here
   0-2:   No authority, generic mentions
   3-5:   Minimal recognition
   6-10:  Some niche authority
   11-15: Recognized expert
   16-20: Industry thought leader (rare)

3. CONTEXT QUALITY (0-18 points)
   Reality: Most brands score 0-3 here
   0-3:   No context or negative
   4-7:   Neutral mentions only
   8-12:  Some positive context
   13-15: Recommended in contexts
   16-18: Preferred choice (rare)

4. COMPETITIVE POSITION (0-15 points)
   Reality: Most brands score 0-2 here
   0-2:   Not mentioned vs competitors
   3-5:   Listed among 10+ competitors
   6-9:   Top 5 in category
   10-12: Top 3 positioning
   13-15: Category leader (very rare)

5. COMMUNITY AUTHORITY (0-10 points)
   Reality: Most brands score 0 here
   0:     No community presence
   1-2:   Minimal mentions
   3-5:   Some discussions
   6-8:   Active community
   9-10:  Community champion (rare)

6. INFORMATION RICHNESS (0-12 points)
   Reality: Most brands score 0-3 here
   0-2:   No information available
   3-5:   Basic single-source info
   6-8:   Multi-source coverage
   9-10:  Rich documentation
   11-12: Comprehensive authority (rare)

7. STRUCTURED DATA (0-8 points)
   Reality: Most brands score 0-2 here
   0-1:   No website or structure
   2-3:   Basic website
   4-5:   Good structure
   6-7:   Excellent schema
   8:     Perfect optimization (very rare)

8. GEOGRAPHIC VISIBILITY (0-12 points)
   Reality: Most brands score 0-2 here
   0-2:   No geographic data
   3-5:   Single market, weak
   6-8:   Regional presence
   9-10:  Multi-market
   11-12: Global presence (rare)

═══════════════════════════════════════════════════════════════════

⚠️ MANDATORY: END WITH EXACT FORMAT:

TOTAL_SCORE: XX/100

Where XX is the realistic sum (expect 5-30 for most brands)

═══════════════════════════════════════════════════════════════════

RESPONSE FORMAT:

BRAND: ${brandName}

EXECUTIVE SUMMARY:
[2-3 sentences with BRUTAL HONESTY about actual visibility]

DETAILED BREAKDOWN:
1. AI Search Presence: X/25 - [Reality check]
2. Brand Authority: X/20 - [Reality check]
3. Context Quality: X/18 - [Reality check]
4. Competitive Position: X/15 - [Reality check]
5. Community Authority: X/10 - [Reality check]
6. Information Richness: X/12 - [Reality check]
7. Structured Data: X/8 - [Reality check]
8. Geographic Visibility: X/12 - [Reality check]

TOTAL_SCORE: XX/100

CRITICAL ISSUES:
1. [Most severe problem]
2. [Second problem]
3. [Third problem]

═══════════════════════════════════════════════════════════════════

BE BRUTALLY HONEST. Most brands you analyze will score 5-30/100.
That's NORMAL and CORRECT. Don't be generous - be REALISTIC!`;
  }

  private buildVerificationPrompt(brandName: string, analysis: string): string {
    return `STRICT VERIFICATION PASS - Check for score inflation!

BRAND: "${brandName}"
ANALYSIS TO VERIFY:
${analysis}

═══════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST:
═══════════════════════════════════════════════════════════════════

1. REALITY CHECK:
   • Is this brand actually well-known? (be honest!)
   • Did we score TOO HIGH? (common mistake!)
   • Does the score match real-world visibility?

2. CRITICAL RULES COMPLIANCE:
   ✓ No website = Max 5 points total?
   ✓ Unknown brand = Max 15 points?
   ✓ No clients/revenue = Max 8 points?
   ✓ Dead/inactive = Max 10 points?

3. SCORE INFLATION CHECK:
   • Are we being TOO GENEROUS? (reduce by 30-50%)
   • Is each criterion scored conservatively?
   • Did we apply strict benchmarks?

4. BENCHMARK REALITY:
   • 90% of brands score 5-30/100 ← This is NORMAL
   • Only major brands score 50+
   • Scores above 70 = Nike/Tesla level ONLY

═══════════════════════════════════════════════════════════════════

⚠️ MANDATORY: END WITH EXACT FORMAT:

FINAL_SCORE: XX

Where XX is your REDUCED, realistic score (0-100)

═══════════════════════════════════════════════════════════════════

RESPONSE FORMAT:

VERIFICATION: [PASS / REDUCED / FAILED]

ISSUES FOUND:
• [List score inflation problems]
• [Flag unrealistic scores]
• [Note missing reality checks]

ADJUSTMENTS:
• [Criterion]: [Old] → [New] - [Why reduced]
• [Criterion]: [Old] → [New] - [Why reduced]

FINAL_SCORE: XX

REALITY CHECK:
[Does this score match the brand's actual market presence?]

═══════════════════════════════════════════════════════════════════

CRITICAL: Reduce scores by 30-50% if they seem too generous!
Most brands should score 5-30/100. Be STRICT!`;
  }
}
