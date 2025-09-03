// AI Provider Interface
export interface AIProvider {
  name: string;
  enabled: boolean;
  analyze(input: string): Promise<AIRawResult>;
  calculateScore(raw: AIRawResult): number;
}

export interface AIRawResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
}