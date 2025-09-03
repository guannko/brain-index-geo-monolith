export type ProviderName = 'chatgpt' | 'google' | 'perplexity' | 'claude' | 'mistral';

export type ProviderResult = {
  name: ProviderName;
  score: number;        // 0..100
  meta?: Record<string, unknown>;
};

export interface AIProvider {
  name: ProviderName;
  isEnabled(): boolean;
  analyze(input: string): Promise<ProviderResult>;
}