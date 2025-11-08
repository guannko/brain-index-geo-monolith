import { AIProvider, ProviderResult } from './types.js';
import { openai } from '../../../shared/openai.js';
import { env } from '../../../config/env.js';

export class ChatGPTProvider implements AIProvider {
  name: 'chatgpt' = 'chatgpt';
  
  isEnabled() { 
    return process.env.PROVIDER_CHATGPT_ENABLED !== 'false'; 
  }

  async analyze(input: string): Promise<ProviderResult> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || 15000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = this.buildGEOPrompt(input);
      
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
        // @ts-ignore: openai fetch supports signal
        signal: (controller as any).signal
      });
      
      const raw = res.choices[0]?.message?.content?.trim() || '0';
      const num = Math.max(0, Math.min(100, Number(raw.match(/\d+/)?.[0] || 0)));
      
      return { 
        name: this.name, 
        score: num, 
        meta: { raw, model: 'gpt-4o-mini', promptVersion: '2.0' } 
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`ChatGPT timeout after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  private buildGEOPrompt(brandName: string): string {
    return `You are a Generative Engine Optimization (GEO) analyst. Analyze brand visibility for "${brandName}" in AI-generated content.

ANALYSIS CRITERIA:

1. AI SEARCH PRESENCE (30 points)
   - How often does this brand appear in AI search results?
   - Position in AI-generated answers (top/middle/bottom/absent)
   - Frequency of mentions across different queries

2. BRAND AUTHORITY (25 points)
   - Is this brand cited as an authoritative source?
   - Does AI present it as an industry leader or expert?
   - Quality of associations (premium/standard/low)

3. CONTEXT QUALITY (20 points)
   - Positive/neutral/negative context in AI responses
   - Is brand mentioned as solution or just referenced?
   - Depth of information provided about the brand

4. COMPETITIVE POSITIONING (15 points)
   - How does it compare to competitors in AI responses?
   - Is it mentioned first, among others, or overlooked?
   - Market share perception in AI-generated content

5. INFORMATION RICHNESS (10 points)
   - Amount of detailed information AI has about the brand
   - Recency of information (current/outdated)
   - Coverage across different aspects (products/services/values)

SCORING GUIDELINES:
- 0-20: Virtually invisible in AI-generated content
- 21-40: Minimal presence, rarely mentioned
- 41-60: Moderate visibility, occasional mentions
- 61-80: Strong presence, frequently appears in relevant contexts
- 81-100: Dominant visibility, consistently appears as top authority

Consider the brand's actual market presence, online footprint, and how AI models would likely represent it based on their training data.

Respond with ONLY a number (0-100) representing the total GEO visibility score.`;
  }
}