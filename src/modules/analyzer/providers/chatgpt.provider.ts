import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';

export class ChatGPTProvider implements AIProvider {
  name: 'chatgpt' = 'chatgpt';
  
  isEnabled() { 
    return process.env.PROVIDER_CHATGPT_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    try {
      // PASS 1: Detailed GEO Analysis
      const analysisPrompt = this.buildUltimateGEOPrompt(input);
      
      const analysisRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.2,
        max_tokens: 800
      });
      
      const analysisRaw = analysisRes.choices[0]?.message?.content?.trim() || '';
      
      // PASS 2: Verification & Self-Improvement
      const verifyPrompt = this.buildVerificationPrompt(input, analysisRaw);
      
      const verifyRes = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: verifyPrompt }],
        temperature: 0.1,
        max_tokens: 300
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
          promptVersion: '3.1-ultimate-pro'
        } 
      };
    } catch (error: any) {
      console.error('ChatGPT Provider Error:', error);
      throw error;
    }
  }

  private buildUltimateGEOPrompt(brandName: string): string {
    return `You are an elite Generative Engine Optimization (GEO) analyst. Analyze "${brandName}" comprehensively.

═══════════════════════════════════════════════════════════════════
ULTIMATE GEO SCORING FRAMEWORK (100 points):
═══════════════════════════════════════════════════════════════════

1. AI SEARCH PRESENCE & CITATION FREQUENCY (25 points)
   Evaluate:
   • Frequency in AI search results (ChatGPT, Perplexity, Gemini, Claude)
   • Position in AI-generated answers (top vs buried)
   • Citation types (informational/transactional/navigational)
   • Presence across platforms (Google AI Overviews, Bing Chat)
   
   Scoring:
   0-5:   Virtually invisible, rarely mentioned
   6-10:  Occasional niche mentions only
   11-15: Moderate category-specific presence
   16-20: Frequently cited in relevant queries
   21-25: Dominant, consistently top-mentioned

2. BRAND AUTHORITY & SOURCE TRUST (20 points)
   Evaluate:
   • Primary authoritative source vs secondary reference
   • AI treatment: expert/leader vs one-of-many
   • Trust signals: journalism, academic, official documentation
   • Knowledge depth: detailed vs superficial understanding
   
   Scoring:
   0-4:   Mentioned without context or authority
   5-8:   Generic mentions, no special recognition
   9-12:  Recognized category player
   13-16: Authoritative in specific domains
   17-20: Industry-defining, go-to reference

3. CITATION CONTEXT QUALITY & SENTIMENT (18 points)
   Evaluate:
   • Role: Solution provider / Case study / Warning / Neutral mention
   • Sentiment: Positive (recommendation) / Neutral (factual) / Negative (criticism)
   • Answer positioning: Core solution vs alternative vs comparison
   • Mention specificity: Detailed explanation vs passing reference
   
   Scoring:
   0-3:   Negative context, problematic associations
   4-7:   Neutral factual mentions, no value judgment
   8-11:  Positive but generic recommendations
   12-15: Recommended solution in specific contexts
   16-18: Consistently preferred/best choice positioning

4. COMPETITIVE POSITIONING (15 points)
   Evaluate:
   • Ranking vs competitors in AI lists
   • Share of voice: solo vs among 5+ competitors
   • Market positioning: premium/standard/budget framing
   • First-mover advantage in AI understanding
   
   Scoring:
   0-3:   Rarely mentioned, competitors dominate
   4-6:   Listed after several competitors
   7-9:   Among top 3-5 in mentions
   10-12: Top 2 category positioning
   13-15: Default first choice in responses

5. COMMUNITY SOURCE AUTHORITY (10 points)
   Evaluate:
   • Reddit, Quora, Stack Overflow, HackerNews presence
   • Community trust signals and recommendations
   • User-generated content quality and frequency
   • Forum/Discord/Slack community discussions
   
   Scoring:
   0-2:   No community presence or negative sentiment
   3-4:   Minimal community activity
   5-6:   Active discussions, mixed sentiment
   7-8:   Strong positive reputation
   9-10:  Community champion, highly recommended

6. INFORMATION RICHNESS & MULTI-SOURCE SYNTHESIS (7 points)
   Evaluate:
   • Breadth: Coverage across different brand aspects
   • Depth: Detail level in AI responses
   • Source diversity: Number of distinct sources AI combines
   • Recency: Current 2024-2025 vs outdated information
   
   Scoring:
   0-1:   Minimal, outdated, single-source info
   2-3:   Basic information from few sources
   4-5:   Good multi-source coverage
   6-7:   Comprehensive, current, rich synthesis

7. STRUCTURED DATA & AI PARSABILITY (5 points)
   Evaluate:
   • Schema markup: FAQ, Product, Organization, HowTo
   • Content structure: Headings, bullets, tables, comparisons
   • Technical docs quality and accessibility
   • API documentation, integration guides visibility
   
   Scoring:
   0-1:   Poor structure, hard to parse
   2-3:   Basic structure, some organization
   4-5:   Excellent structure, highly AI-parsable

═══════════════════════════════════════════════════════════════════

RESPONSE FORMAT:

BRAND: ${brandName}

[2-3 sentence executive summary of AI visibility]

DETAILED BREAKDOWN:
1. AI Search Presence: X/25 - [Justification]
2. Brand Authority: X/20 - [Justification]
3. Context Quality: X/18 - [Justification]
4. Competitive Position: X/15 - [Justification]
5. Community Authority: X/10 - [Justification]
6. Information Richness: X/7 - [Justification]
7. Structured Data: X/5 - [Justification]

TOTAL_SCORE: XX/100

KEY INSIGHTS:
• Strength: [Primary advantage]
• Weakness: [Critical gap]
• Opportunity: [Immediate action]

CONFIDENCE: [High/Medium/Low]

═══════════════════════════════════════════════════════════════════

CRITICAL RULES:
- Base scores on REAL market presence and AI behavior
- Unknown brands: 0-30, Niche: 31-60, Major: 61-100
- Consider competitive landscape realistically
- Prioritize 2024-2025 data over older information
- Be honest about limitations and data gaps`;
  }

  private buildVerificationPrompt(brandName: string, analysis: string): string {
    return `You are a GEO Verifier. Review this analysis for accuracy.

BRAND: "${brandName}"

ANALYSIS:
${analysis}

VERIFICATION CHECKLIST:
1. Score Realism: Are scores appropriate for brand's actual market presence?
2. Internal Consistency: Do scores align with justifications?
3. Competitive Context: Is positioning accurate vs competitors?
4. Data Quality: Any obvious gaps or assumptions?
5. Confidence Level: Does it match the analysis depth?

VERIFY & ADJUST:

ISSUES FOUND:
• [List any problems]

SCORE ADJUSTMENTS:
• [Category]: [Original] → [Adjusted] ([Reason])

FINAL_SCORE: XX/100

VERIFICATION STATUS: [VERIFIED / NEEDS_REVIEW]
CONFIDENCE: [High/Medium/Low]

Keep response under 200 words, be direct.`;
  }
}
