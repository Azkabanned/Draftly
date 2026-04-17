import type {
  Model,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  AuthType,
} from '@draftly/shared';
import { BaseProvider } from '../base';

/** Popular models available on OpenRouter. Updated list fetched dynamically when possible. */
const DEFAULT_OPENROUTER_MODELS: Model[] = [
  {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6 (via OpenRouter)',
    provider: 'openrouter',
    maxTokens: 16384,
    contextWindow: 200000,
    supportsStreaming: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (via OpenRouter)',
    provider: 'openrouter',
    maxTokens: 16384,
    contextWindow: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (via OpenRouter)',
    provider: 'openrouter',
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsStreaming: true,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B (via OpenRouter)',
    provider: 'openrouter',
    maxTokens: 4096,
    contextWindow: 128000,
    supportsStreaming: true,
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
  },
];

export class OpenRouterProvider extends BaseProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  icon = 'openrouter';
  authType: AuthType = 'api-key';
  defaultBaseUrl = 'https://openrouter.ai/api';

  private cachedModels: Model[] | null = null;

  listModels(): Model[] {
    return this.cachedModels || DEFAULT_OPENROUTER_MODELS;
  }

  protected buildHeaders(): Record<string, string> {
    return {
      ...super.buildHeaders(),
      Authorization: `Bearer ${this.apiKey}`,
      'HTTP-Referer': 'https://draftly.app',
      'X-Title': 'Draftly',
    };
  }

  // OpenRouter uses the OpenAI-compatible API format
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = this.buildRequestBody(request);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content || '',
      model: data.model,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason === 'stop' ? 'stop' : 'length',
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(request);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const event = JSON.parse(data);
            const delta = event.choices?.[0]?.delta;

            if (delta?.content) {
              yield { content: delta.content, done: false };
            }

            if (event.choices?.[0]?.finish_reason) {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private buildRequestBody(request: CompletionRequest) {
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system' as const, content: request.systemPrompt });
    }
    messages.push(...request.messages);

    return {
      model: request.model,
      messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7,
    };
  }
}
