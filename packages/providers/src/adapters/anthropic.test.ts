import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from './anthropic';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider();
  });

  it('has correct metadata', () => {
    expect(provider.id).toBe('anthropic');
    expect(provider.name).toBe('Anthropic');
    expect(provider.authType).toBe('api-key');
  });

  it('lists models', () => {
    const models = provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].provider).toBe('anthropic');
    expect(models[0].supportsStreaming).toBe(true);
  });

  it('estimates cost for known models', () => {
    provider.configure({ apiKey: 'test' });
    const models = provider.listModels();
    const estimate = provider.estimateCost({
      model: models[0].id,
      messages: [{ role: 'user', content: 'Hello world, this is a test message.' }],
      maxTokens: 100,
    });
    expect(estimate).not.toBeNull();
    expect(estimate!.currency).toBe('USD');
    expect(estimate!.totalCost).toBeGreaterThan(0);
  });

  it('builds correct headers', () => {
    provider.configure({ apiKey: 'sk-test-key-123' });
    // Access private method through prototype trick for testing
    const headers = (provider as any).buildHeaders();
    expect(headers['x-api-key']).toBe('sk-test-key-123');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('throws on API error', async () => {
    provider.configure({ apiKey: 'invalid-key' });

    // Mock fetch to simulate API error
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Invalid API key'),
    });
    globalThis.fetch = mockFetch;

    await expect(
      provider.complete({
        model: 'claude-sonnet-4-6',
        messages: [{ role: 'user', content: 'test' }],
      }),
    ).rejects.toThrow('Anthropic API error (401)');
  });

  it('parses successful response', async () => {
    provider.configure({ apiKey: 'test' });

    const mockResponse = {
      content: [{ type: 'text', text: 'Hello! How can I help?' }],
      model: 'claude-sonnet-4-6',
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 8 },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await provider.complete({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'Hi' }],
    });

    expect(result.content).toBe('Hello! How can I help?');
    expect(result.usage.inputTokens).toBe(10);
    expect(result.usage.outputTokens).toBe(8);
    expect(result.finishReason).toBe('stop');
  });
});
