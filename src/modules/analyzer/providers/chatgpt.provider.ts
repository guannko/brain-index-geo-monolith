import { AIProvider, AIRawResult } from './interface.js';
import { openai } from '../../../shared/openai.js';
import pRetry from 'p-retry';

export class ChatGPTProvider implements AIProvider {
  name = 'ChatGPT';
  enabled = true;
  
  async analyze(input: string): Promise<AIRawResult> {
    try {
      const result = await pRetry(
        async () => {
          const prompt = `Rate brand visibility (0-100) for "${input}" in general public awareness. Consider:
          1. Brand recognition
          2. Market presence
          3. Online mentions
          4. Industry influence
          Reply with a single number 0-100.`;
          
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 10
          });
          
          return response;
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 10000,
          onFailedAttempt: (error) => {
            console.log(`ChatGPT attempt ${error.attemptNumber} failed. Retrying...`);
          }
        }
      );
      
      return {
        success: true,
        data: result.choices[0]?.message?.content?.trim() || '0'
      };
    } catch (error) {
      console.error('ChatGPT provider error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  calculateScore(raw: AIRawResult): number {
    if (!raw.success || !raw.data) return 0;
    const num = Number(raw.data.match(/\d+/)?.[0] || 0);
    return Math.max(0, Math.min(100, num));
  }
}