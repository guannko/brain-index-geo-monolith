import { openai } from '../shared/openai.js';

interface GEvalInput {
  claim: string;
  context: string;
}

interface GEvalResult {
  groundedness: number; // 0-1 score
  reasoning: string;
  isGrounded: boolean;
}

export class GEvalService {
  /**
   * Evaluate groundedness using LLM-as-Judge (G-Eval)
   * Returns a score from 0-1 indicating how well the claim is supported by context
   */
  async evaluateGroundedness(input: GEvalInput): Promise<GEvalResult> {
    const { claim, context } = input;

    const prompt = `You are an expert fact-checker evaluating whether a claim is grounded in the provided context.

CONTEXT:
${context}

CLAIM:
${claim}

TASK:
Evaluate how well the claim is supported by the context. Assign a groundedness score:
- 1.0: Claim is fully supported by context with direct evidence
- 0.7-0.9: Claim is mostly supported with minor extrapolations
- 0.4-0.6: Claim is partially supported but has unsupported elements
- 0.1-0.3: Claim has minimal support in context
- 0.0: Claim is not supported or contradicts context

Respond in JSON format:
{
  "groundedness": <score 0-1>,
  "reasoning": "<brief explanation>",
  "isGrounded": <boolean>
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a factual accuracy evaluator. Always respond with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content);

      return {
        groundedness: result.groundedness || 0,
        reasoning: result.reasoning || 'No reasoning provided',
        isGrounded: result.isGrounded ?? result.groundedness >= 0.7,
      };
    } catch (error) {
      console.error('❌ G-Eval failed:', error);
      throw error;
    }
  }

  /**
   * Batch evaluate multiple claims
   */
  async evaluateBatch(
    inputs: GEvalInput[]
  ): Promise<GEvalResult[]> {
    return Promise.all(
      inputs.map((input) => this.evaluateGroundedness(input))
    );
  }

  /**
   * Calculate average groundedness for a set of claims
   */
  calculateAverageGroundedness(results: GEvalResult[]): number {
    if (results.length === 0) return 0;

    const sum = results.reduce(
      (acc, result) => acc + result.groundedness,
      0
    );
    return sum / results.length;
  }
}

// Singleton instance
export const gEvalService = new GEvalService();
