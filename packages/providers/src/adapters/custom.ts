import type {
  Model,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  AuthType,
  ProviderConfig,
} from '@draftly/shared';
import { BaseProvider } from '../base';

/** Extract content from various response formats (OpenAI, Ollama, thinking models, etc.) */
function extractContent(data: any): string {
  const msg = data.choices?.[0]?.message;

  if (msg) {
    // Standard: message.content is the answer
    if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
      return msg.content;
    }
    // Thinking models (Gemma4, QwQ, etc.): content is empty, reasoning has the chain-of-thought
    // The actual answer may be at the end of reasoning, or the model ran out of tokens
    if (msg.reasoning && typeof msg.reasoning === 'string') {
      // Try to extract the final answer from reasoning if it contains one
      // Look for patterns like "corrected text:" or "**Result:**" etc.
      const reasoning = msg.reasoning;
      const answerPatterns = [
        /(?:corrected|revised|rewritten|final|result|output|answer)[^:]*:\s*[""]?([\s\S]+?)[""]?\s*$/i,
        /(?:\n\n|\*\*)([\s\S]{20,})$/,  // last substantial paragraph
      ];
      for (const pat of answerPatterns) {
        const match = reasoning.match(pat);
        if (match?.[1]?.trim()) return match[1].trim();
      }
      // Fallback: return the reasoning itself (the model spent all tokens thinking)
      return reasoning;
    }
  }

  // Ollama /api/chat: message.content
  if (data.message?.content && String(data.message.content).trim()) {
    return String(data.message.content);
  }
  // Ollama thinking models: message.thinking (when content is empty)
  if (data.message?.thinking && String(data.message.thinking).trim()) {
    return String(data.message.thinking);
  }
  // Ollama /api/generate: response
  if (data.response) {
    return String(data.response);
  }
  // Direct content/text/output fields
  if (typeof data.content === 'string' && data.content) return data.content;
  if (typeof data.text === 'string' && data.text) return data.text;
  if (typeof data.output === 'string' && data.output) return data.output;
  // Older completions format
  if (data.choices?.[0]?.text) return String(data.choices[0].text);

  console.warn('[Draftly] Could not extract content:', JSON.stringify(data).slice(0, 500));
  return '';
}

/**
 * Custom provider for any OpenAI-compatible API endpoint.
 * Works with Ollama, LM Studio, vLLM, LocalAI, and others.
 */
export class CustomProvider extends BaseProvider {
  id = 'custom';
  name = 'Custom (OpenAI-compatible)';
  icon = 'custom';
  authType: AuthType = 'api-key';
  defaultBaseUrl = 'http://localhost:11434/v1'; // Ollama default

  private customModels: Model[] = [];

  configure(config: ProviderConfig & { models?: Model[] }): void {
    super.configure(config);
    if (config.models) {
      this.customModels = config.models;
    }
  }

  listModels(): Model[] {
    if (this.customModels.length > 0) return this.customModels;

    // Default models for common local providers
    return [
      {
        id: 'default',
        name: 'Default Model',
        provider: 'custom',
        maxTokens: 4096,
        contextWindow: 8192,
        supportsStreaming: true,
      },
    ];
  }

  /** Attempt to fetch available models from the endpoint. */
  async fetchModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.buildHeaders(),
      });
      if (!response.ok) return this.listModels();

      const data = await response.json();
      this.customModels = (data.data || []).map(
        (m: { id: string; owned_by?: string; context_window?: number }) => ({
          id: m.id,
          name: m.id,
          provider: 'custom',
          maxTokens: 4096,
          contextWindow: m.context_window || 8192,
          supportsStreaming: true,
        }),
      );
      return this.customModels;
    } catch {
      return this.listModels();
    }
  }

  protected buildHeaders(): Record<string, string> {
    const headers = super.buildHeaders();
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private isOllamaUrl(): boolean {
    return this.baseUrl.includes('localhost:11434') || this.baseUrl.includes('127.0.0.1:11434');
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const isOllama = this.isOllamaUrl();
    console.log('[Draftly] complete() called, baseUrl:', this.baseUrl, 'isOllama:', isOllama);

    // For Ollama: use native /api/chat which supports think:false properly
    if (isOllama) {
      const response = await this.tryOllamaNative(request);
      console.log('[Draftly] Ollama native response status:', response.status);

      if (response.status === 403) {
        throw new Error(
          `Ollama returned 403 Forbidden.\n\nFix: restart Ollama with:\n  OLLAMA_ORIGINS="chrome-extension://*" ollama serve`
        );
      }
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      console.log('[Draftly] Ollama native response keys:', Object.keys(data));
      console.log('[Draftly] message.content:', data.message?.content?.slice?.(0, 100));

      const content = extractContent(data);
      console.log('[Draftly] Extracted content length:', content.length);

      // If content is still empty, include debug info
      const finalContent = content || `[DEBUG: Model returned no content. Response keys: ${Object.keys(data).join(', ')}. message keys: ${data.message ? Object.keys(data.message).join(', ') : 'N/A'}]`;

      return {
        content: finalContent,
        model: data.model || request.model,
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? 'stop' : 'length',
      };
    }

    // OpenAI-compatible endpoint (LM Studio, vLLM, non-Ollama, or Ollama fallback)
    const body = this.buildRequestBody(request);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(`Could not connect to ${this.baseUrl}. Make sure the server is running.`);
    }

    if (response.status === 403) {
      throw new Error(
        `Server returned 403 Forbidden.\n\n` +
        `If using Ollama, restart with:\n` +
        `  OLLAMA_ORIGINS="chrome-extension://*" ollama serve`
      );
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom provider error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const content = extractContent(data);

    console.log('[Draftly] Raw response keys:', Object.keys(data));
    console.log('[Draftly] Extracted content length:', content.length);

    const usage = data.usage
      ? { inputTokens: data.usage.prompt_tokens || 0, outputTokens: data.usage.completion_tokens || 0, totalTokens: data.usage.total_tokens || 0 }
      : { inputTokens: data.prompt_eval_count || 0, outputTokens: data.eval_count || 0, totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0) };

    return {
      content,
      model: data.model || request.model,
      usage,
      finishReason: (data.choices?.[0]?.finish_reason === 'stop' || data.done) ? 'stop' : 'length',
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(request);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom provider error (${response.status}): ${error}`);
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

  /** Fallback: use Ollama's native /api/chat endpoint instead of OpenAI-compat. */
  private async tryOllamaNative(request: CompletionRequest): Promise<Response> {
    const ollamaBase = this.baseUrl.replace(/\/v1\/?$/, '');
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push(...request.messages.map((m) => ({ role: m.role, content: m.content })));

    return fetch(`${ollamaBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages,
        stream: false,
        think: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens || 4096,
        },
      }),
    });
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
      // Disable thinking/reasoning for writing tasks — we want direct output
      think: false,
    };
  }
}
