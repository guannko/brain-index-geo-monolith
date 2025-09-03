import { buildProviders } from '../modules/analyzer/provider-registry.js';
import { AIAnalyzerService } from '../modules/analyzer/analyzer.service.js';
import { redis } from './redis.js';

// Build providers from registry
const providers = buildProviders();

// Dependency Injection Container
export const container = {
  providers,
  analyzer: new AIAnalyzerService(providers, redis),
  
  // Log enabled providers on startup
  logProviders() {
    console.log('Enabled AI providers:', providers.map(p => p.name).join(', '));
  }
};

// Initialize
container.logProviders();