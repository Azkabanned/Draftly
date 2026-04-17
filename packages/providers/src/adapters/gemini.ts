import type {
  Model,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  AuthType,
} from '@draftly/shared';
import { BaseProvider } from '../base';

const GEMINI_MODELS: Model[] = [
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsStreaming: true,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsStreaming: true,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    maxTokens: 8192,
    contextWindow: 1000000,
    supportsStreaming: true,
    costPer1kInput: 0.0001,
    costPer1kOutput: 0.0004,
  },
];

export class GeminiProvider extends BaseProvider {
  id = 'gemini';
  name = 'Google Gemini';
  icon = 'gemini';
  authType: AuthType = 'api-key';
  defaultBaseUrl = 'https://generativelanguage.googleapis.com';

  listModels(): Model[] {
    return GEMINI_MODELS;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = this.buildRequestBody(request);
    const url = `${this.baseUrl}/v1beta/models/${request.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((p: { text: string }) => p.text).join('') || '';

    return {
      content,
      model: request.model,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: candidate?.finishReason === 'STOP' ? 'stop' : 'length',
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const body = this.buildRequestBody(request);
    const url = `${this.baseUrl}/v1beta/models/${request.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
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

          try {
            const event = JSON.parse(data);
            const text = event.candidates?.[0]?.content?.parts
              ?.map((p: { text: string }) => p.text)
              .join('');

            if (text) {
              yield { content: text, done: false };
            }

            if (event.candidates?.[0]?.finishReason) {
              yield {
                content: '',
                done: true,
                usage: event.usageMetadata
                  ? {
                      inputTokens: event.usageMetadata.promptTokenCount || 0,
                      outputTokens: event.usageMetadata.candidatesTokenCount || 0,
                      totalTokens: event.usageMetadata.totalTokenCount || 0,
                    }
                  : undefined,
              };
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
    const contents = request.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    return {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
      },
      ...(request.systemPrompt
        ? { systemInstruction: { parts: [{ text: request.systemPrompt }] } }
        : {}),
    };
  }
}
