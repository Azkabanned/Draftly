export { BaseProvider } from './base';
export { ProviderRegistry, getRegistry, resetRegistry } from './registry';
export {
  AnthropicProvider,
  OpenAIProvider,
  GeminiProvider,
  OpenRouterProvider,
  CustomProvider,
} from './adapters';

import { getRegistry } from './registry';
import { AnthropicProvider } from './adapters/anthropic';
import { OpenAIProvider } from './adapters/openai';
import { GeminiProvider } from './adapters/gemini';
import { OpenRouterProvider } from './adapters/openrouter';
import { CustomProvider } from './adapters/custom';

/** Register all built-in providers with the global registry. */
export function registerAllProviders(): void {
  const registry = getRegistry();
  registry.register(new AnthropicProvider());
  registry.register(new OpenAIProvider());
  registry.register(new GeminiProvider());
  registry.register(new OpenRouterProvider());
  registry.register(new CustomProvider());
}
