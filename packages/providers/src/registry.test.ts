import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry } from './registry';
import { AnthropicProvider } from './adapters/anthropic';
import { OpenAIProvider } from './adapters/openai';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  it('registers and retrieves providers', () => {
    registry.register(new AnthropicProvider());
    registry.register(new OpenAIProvider());

    expect(registry.get('anthropic')).toBeDefined();
    expect(registry.get('openai')).toBeDefined();
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('lists all registered providers', () => {
    registry.register(new AnthropicProvider());
    registry.register(new OpenAIProvider());

    const all = registry.getAll();
    expect(all).toHaveLength(2);
  });

  it('lists available providers with metadata', () => {
    registry.register(new AnthropicProvider());
    registry.register(new OpenAIProvider());

    const available = registry.listAvailable();
    expect(available).toHaveLength(2);
    expect(available[0]).toHaveProperty('id');
    expect(available[0]).toHaveProperty('name');
    expect(available[0]).toHaveProperty('authType');
  });

  it('configures a provider', () => {
    const provider = new AnthropicProvider();
    registry.register(provider);

    const result = registry.configure('anthropic', { apiKey: 'test-key' });
    expect(result).toBe(true);

    const nonExistent = registry.configure('unknown', { apiKey: 'test' });
    expect(nonExistent).toBe(false);
  });

  it('unregisters a provider', () => {
    registry.register(new AnthropicProvider());
    expect(registry.get('anthropic')).toBeDefined();

    registry.unregister('anthropic');
    expect(registry.get('anthropic')).toBeUndefined();
  });
});
