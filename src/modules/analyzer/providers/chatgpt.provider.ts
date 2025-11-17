import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';

export class ChatGPTProvider implements AIProvider {
  name: 'chatgpt' = 'chatgpt';
  
  isEnabled() { 
    return process.env.PROVIDER_CHATGPT_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    try {
      // PASS 1: Detailed GEO Analysis with strict calibration
      const analysisPrompt = this.buildUltimateGEOPrompt(input);
      
      const analysisRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.2,
        max_tokens: 1200
      });
      
      const analysisRaw = analysisRes.choices[0]?.message?.content?.trim() || '';
      
      // PASS 2: Verification & Self-Improvement
      const verifyPrompt = this.buildVerificationPrompt(input, analysisRaw);
      
      const verifyRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: verifyPrompt }],
        temperature: 0.1,
        max_tokens: 400
      });
      
      const verificationRaw = verifyRes.choices[0]?.message?.content?.trim() || '';
      
      // Extract final score
      const scoreMatch = verificationRaw.match(/FINAL[_\s]+SCORE[:\s]+(\d+)/i) || 
                        analysisRaw.match(/TOTAL[_\s]+SCORE[:\s]+(\d+)/i) || 
                        analysisRaw.match(/(\d+)\/100/);
      const score = scoreMatch ? Math.max(0, Math.min(100, Number(scoreMatch[1]))) : 50;
      
      return { 
        name: this.name, 
        score, 
        meta: { 
          analysis: analysisRaw,
          verification: verificationRaw,
          model: 'gpt-4o-mini',
          promptVersion: '3.2-ultimate-pro-calibrated'
        } 
      };
    } catch (error: any) {
      console.error('ChatGPT Provider Error:', error);
      throw error;
    }
  }

  private buildUltimateGEOPrompt(brandName: string): string {
    return `You are an elite Generative Engine Optimization (GEO) analyst. Analyze "${brandName}" with STRICT CALIBRATION.

═══════════════════════════════════════════════════════════════════
ULTIMATE GEO SCORING FRAMEWORK (100 points):
═══════════════════════════════════════════════════════════════════

⚠️ CRITICAL CALIBRATION RULES (READ FIRST):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NO ACTIVE WEBSITE = Maximum 8 points total (regardless of other factors)
2. INACTIVE SOCIAL MEDIA (6+ months) = Reduce all scores by 60%
3. NOT FOUND IN AI SEARCH = 0-5 points maximum in AI Presence
4. NO COMMUNITY PRESENCE = 0 points in Community Authority
5. UNKNOWN BRANDS realistically score 5-25/100 (be honest!)
6. MAJOR BRANDS (Nike, Tesla, Apple) score 75-95/100
7. VERIFY REAL PRESENCE before scoring above 30 points
8. Default to LOWER scores when uncertain
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. AI SEARCH PRESENCE & CITATION FREQUENCY (25 points)
   Evaluate:
   • Frequency in AI search results (ChatGPT, Perplexity, Gemini, Claude)
   • Position in AI-generated answers (top vs buried)
   • Citation types (informational/transactional/navigational)
   • Presence across platforms (Google AI Overviews, Bing Chat)
   
   Realistic Scoring:
   0-3:   Unknown - AI has never heard of this brand
   4-7:   Rare mentions - Only in very specific niche queries
   8-12:  Occasional - Appears in category searches but not prominent
   13-17: Regular - Frequently cited in relevant queries
   18-22: Strong - Consistently mentioned, good positioning
   23-25: Dominant - Default answer, industry leader

2. BRAND AUTHORITY & SOURCE TRUST (20 points)
   Evaluate:
   • Primary authoritative source vs secondary reference
   • AI treatment: expert/leader vs one-of-many
   • Trust signals: journalism, academic, official documentation
   • Knowledge depth: detailed vs superficial understanding
   
   Realistic Scoring:
   0-3:   No authority - Generic or no mentions
   4-7:   Basic recognition - Listed among many alternatives
   8-12:  Growing authority - Recognized in specific contexts
   13-16: Strong authority - Cited as credible source
   17-20: Industry authority - Go-to reference, expert positioning

3. CITATION CONTEXT QUALITY & SENTIMENT (18 points)
   Evaluate:
   • Role: Solution provider / Case study / Warning / Neutral mention
   • Sentiment: Positive (recommendation) / Neutral (factual) / Negative (criticism)
   • Answer positioning: Core solution vs alternative vs comparison
   • Mention specificity: Detailed explanation vs passing reference
   
   Realistic Scoring:
   0-3:   Negative or missing context
   4-7:   Neutral factual mentions only
   8-11:  Positive but generic
   12-15: Recommended in specific contexts
   16-18: Preferred choice, highly recommended

4. COMPETITIVE POSITIONING (15 points)
   Evaluate:
   • Ranking vs competitors in AI lists
   • Share of voice: solo vs among 5+ competitors
   • Market positioning: premium/standard/budget framing
   • First-mover advantage in AI understanding
   
   Realistic Scoring:
   0-2:   Not mentioned when competitors are
   3-5:   Listed after 5+ competitors
   6-9:   Among top 5 in category
   10-12: Top 3 positioning
   13-15: #1 or #2 default choice

5. COMMUNITY SOURCE AUTHORITY (10 points)
   Evaluate:
   • Reddit, Quora, Stack Overflow, HackerNews presence
   • Community trust signals and recommendations
   • User-generated content quality and frequency
   • Forum/Discord/Slack community discussions
   
   Realistic Scoring:
   0:     Zero community presence
   1-2:   Minimal mentions, no engagement
   3-4:   Some discussions, mixed sentiment
   5-7:   Active positive community
   8-10:  Community champion, highly recommended

6. INFORMATION RICHNESS & MULTI-SOURCE SYNTHESIS (12 points)
   Evaluate:
   • Breadth: Coverage across different brand aspects
   • Depth: Detail level in AI responses
   • Source diversity: Number of distinct sources AI combines
   • Recency: Current 2024-2025 vs outdated information
   
   Realistic Scoring:
   0-2:   Minimal or outdated information
   3-5:   Basic single-source info
   6-8:   Good multi-source coverage
   9-10:  Rich, current information
   11-12: Comprehensive, authoritative sources

7. STRUCTURED DATA & AI PARSABILITY (8 points)
   Evaluate:
   • Schema markup: FAQ, Product, Organization, HowTo
   • Content structure: Headings, bullets, tables, comparisons
   • Technical docs quality and accessibility
   • API documentation, integration guides visibility
   
   Realistic Scoring:
   0-1:   No structure or website
   2-3:   Basic website, poor structure
   4-5:   Decent structure, some schema
   6-7:   Good structure, comprehensive schema
   8:     Excellent AI-optimized content

8. GEOGRAPHIC VISIBILITY (12 points) 🌍
   Evaluate:
   • USA market presence and AI visibility
   • European market presence and AI visibility
   • Asian market presence and AI visibility
   • Multi-language coverage and localization
   
   Realistic Scoring:
   0-2:   No geographic visibility data
   3-5:   Single market, weak presence
   6-8:   2-3 markets, moderate presence
   9-10:  Multi-market, strong in 1-2 regions
   11-12: Global presence, strong across all regions

═══════════════════════════════════════════════════════════════════

RESPONSE FORMAT:

BRAND: ${brandName}

[2-3 sentence executive summary of AI visibility - be brutally honest]

DETAILED BREAKDOWN:
1. AI Search Presence: X/25 - [Brief justification with reality check]
2. Brand Authority: X/20 - [Brief justification]
3. Context Quality: X/18 - [Brief justification]
4. Competitive Position: X/15 - [Brief justification]
5. Community Authority: X/10 - [Brief justification]
6. Information Richness: X/12 - [Brief justification]
7. Structured Data: X/8 - [Brief justification]
8. Geographic Visibility: X/12 - [Brief justification]

GEO BREAKDOWN:
🇺🇸 USA: [High/Medium/Low/None] (XX% of mentions)
🇪🇺 Europe: [High/Medium/Low/None] (XX% of mentions)
🌏 Asia: [High/Medium/Low/None] (XX% of mentions)
PRIMARY MARKET: [Region or "None identified"]
LANGUAGES: [List or "English only" or "None"]

TOTAL_SCORE: XX/100

CRITICAL ISSUES (top 3 problems):
1. [Most critical problem]
2. [Second critical problem]
3. [Third critical problem]

KEY OPPORTUNITY:
[One actionable recommendation]

CONFIDENCE: [High/Medium/Low]

═══════════════════════════════════════════════════════════════════

SCORING REALITY CHECK:
• Dead/inactive brands: 0-15
• Unknown startups: 5-25
• Local businesses: 10-35
• Regional players: 25-50
• National brands: 45-70
• Major brands: 65-85
• Global leaders: 80-95

BE HONEST. LOW SCORES ARE EXPECTED FOR MOST BRANDS.`;
  }

  private buildVerificationPrompt(brandName: string, analysis: string): string {
    return `You are a STRICT GEO Verifier. Review this analysis for REALISM and HONESTY.

BRAND: "${brandName}"

ANALYSIS TO VERIFY:
${analysis}

═══════════════════════════════════════════════════════════════════
VERIFICATION CHECKLIST:
═══════════════════════════════════════════════════════════════════

1. REALITY CHECK:
   • Is the score realistic for this brand's actual market presence?
   • Are we being TOO GENEROUS? (Common mistake!)
   • Does score match the justifications?

2. CALIBRATION CHECK:
   • No website = Should be under 10 points
   • Unknown brand = Should be under 25 points
   • Local business = Should be 10-35 points
   • Are we following strict calibration rules?

3. GEO VERIFICATION:
   • Are geographic claims verifiable?
   • Do percentages make sense?
   • Is primary market correctly identified?

4. CRITICAL ISSUES:
   • Are the top 3 problems actually critical?
   • Do they explain the low score?
   • Are they actionable?

5. INTERNAL CONSISTENCY:
   • Do individual scores add up to total?
   • Do justifications match scores?
   • Are we being consistent across criteria?

═══════════════════════════════════════════════════════════════════

VERIFIED RESPONSE FORMAT:

VERIFICATION STATUS: [VERIFIED / ADJUSTED / MAJOR_REVISION_NEEDED]

ISSUES FOUND:
• [List any problems with scoring]
• [Note any unrealistic scores]
• [Flag any calibration violations]

SCORE ADJUSTMENTS (if needed):
• [Criterion]: [Original] → [Adjusted] - [Reason]
• [Criterion]: [Original] → [Adjusted] - [Reason]

FINAL_SCORE: XX/100

CONFIDENCE: [High/Medium/Low]

CALIBRATION NOTES:
[Brief comment on whether this score matches brand's real-world presence]

═══════════════════════════════════════════════════════════════════

CRITICAL: Be STRICT. It's better to underscore than overscore.
Most brands should score 10-40. Only truly visible brands score 60+.`;
  }
}
