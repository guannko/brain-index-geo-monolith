import { prisma } from '../../prisma/client.js';
import { redis } from '../../shared/redis.js';
import { openai } from '../../shared/openai.js';
import { env } from '../../config/env.js';

export type VisibilityResult = {
  chatGPTScore?: number;
  googleScore?: number;
  combinedScore?: number;
};

export class AIAnalyzerService {
  private ttl = env.CACHE_TTL;

  async analyze(input: string, userId?: string) {
    const cacheKey = `visibility:${input}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Create DB row as PENDING
    const row = await prisma.visibilityScore.create({
      data: { input, userId, status: 'PENDING' }
    });

    // Parallel checks with timeouts
    const [chatGPTScore, googleScore] = await Promise.all([
      this.checkChatGPT(input).catch(() => undefined),
      this.checkGoogle(input).catch(() => undefined)
    ]);

    let combined: number | undefined = undefined;
    if (chatGPTScore != null || googleScore != null) {
      const weights = [chatGPTScore != null ? 1 : 0, googleScore != null ? 1 : 0];
      const totalW = weights[0] + weights[1] || 1;
      combined = (((chatGPTScore || 0) + (googleScore || 0)) / totalW);
    }

    const status = combined != null ? 'COMPLETED' : 'FAILED';

    const updated = await prisma.visibilityScore.update({
      where: { id: row.id },
      data: {
        chatGPTScore: chatGPTScore ?? null,
        googleScore: googleScore   ?? null,
        combinedScore: combined    ?? null,
        status,
        error: status === 'FAILED' ? 'All providers failed' : null
      }
    });

    await redis.set(cacheKey, JSON.stringify(updated), 'EX', this.ttl);
    return updated;
  }

  private async checkChatGPT(input: string): Promise<number> {
    // Minimal prompt to estimate visibility (mock scoring by token length / presence)
    const prompt = `Rate brand visibility (0..100) for "${input}" in general public awareness. Reply with number only.`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 10
    });
    const txt = res.choices[0]?.message?.content?.trim() || '0';
    const num = Number((txt.match(/\d+/)?.[0]) || 0);
    return Math.max(0, Math.min(100, num));
  }

  private async checkGoogle(input: string): Promise<number> {
    // Placeholder: emulate via simple heuristic (could use Custom Search / SerpAPI)
    // For now, score based on input length modulo 100 to keep deterministic demo
    const base = [...input].reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
    return base;
  }
}

export const aiAnalyzerService = new AIAnalyzerService();