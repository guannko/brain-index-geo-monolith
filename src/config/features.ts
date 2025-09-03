// Feature Flags Configuration
export const FEATURE_FLAGS = {
  // AI Providers
  ENABLE_CHATGPT: process.env.ENABLE_CHATGPT !== 'false', // Default true
  ENABLE_GOOGLE: process.env.ENABLE_GOOGLE !== 'false',   // Default true
  ENABLE_PERPLEXITY: process.env.ENABLE_PERPLEXITY === 'true',
  ENABLE_CLAUDE: process.env.ENABLE_CLAUDE === 'true',
  ENABLE_MISTRAL: process.env.ENABLE_MISTRAL === 'true',
  
  // Features
  ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET === 'true',
  ENABLE_SSE: process.env.ENABLE_SSE === 'true',
  ENABLE_MULTI_TENANCY: process.env.ENABLE_MULTI_TENANCY === 'true',
  ENABLE_AUDIT_LOG: process.env.ENABLE_AUDIT_LOG === 'true',
  ENABLE_WHITE_LABEL: process.env.ENABLE_WHITE_LABEL === 'true',
  
  // Rate Limiting
  DYNAMIC_RATE_LIMIT: process.env.DYNAMIC_RATE_LIMIT === 'true',
  
  // Monitoring
  ENABLE_METRICS: process.env.ENABLE_METRICS === 'true',
  ENABLE_TRACING: process.env.ENABLE_TRACING === 'true',
};

// Get enabled AI providers
export function getEnabledProviders(): string[] {
  const providers = [];
  if (FEATURE_FLAGS.ENABLE_CHATGPT) providers.push('ChatGPT');
  if (FEATURE_FLAGS.ENABLE_GOOGLE) providers.push('Google');
  if (FEATURE_FLAGS.ENABLE_PERPLEXITY) providers.push('Perplexity');
  if (FEATURE_FLAGS.ENABLE_CLAUDE) providers.push('Claude');
  if (FEATURE_FLAGS.ENABLE_MISTRAL) providers.push('Mistral');
  return providers;
}