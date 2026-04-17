import type {
  LLMProvider,
  ProviderConfig,
  Model,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  CostEstimate,
  AuthType,
} from '@draftly/shared';

/**
 * Base class for LLM provider adapters.
 * Each provider extends this and implements the abstract methods.
 */
export abstract class BaseProvider implements LLMProvider {
  abstract id: string;
  abstract name: string;
  abstract icon: string;
  abstract authType: AuthType;
  abstract defaultBaseUrl: string;

  protected config: ProviderConfig = {};
  protected _models: Model[] = [];

  configure(config: ProviderConfig): void {
    this.config = { ...this.config, ...config };
  }

  get baseUrl(): string {
    return this.config.baseUrl || this.defaultBaseUrl;
  }

  get apiKey(): string | undefined {
    return this.config.apiKey;
  }

  abstract listModels(): Model[];
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;

  estimateCost(request: CompletionRequest): CostEstimate | null {
    const model = this.listModels().find((m) => m.id === request.model);
    if (!model?.costPer1kInput || !costPer1kOutput(model)) return null;

    const inputTokens = estimateMessageTokens(request);
    const outputTokens = request.maxTokens || 1000;

    const inputCost = (inputTokens / 1000) * model.costPer1kInput;
    const outputCost = (outputTokens / 1000) * model.costPer1kOutput!;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD',
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      const models = this.listModels();
      if (models.length === 0) return false;
      const response = await this.complete({
        model: models[0].id,
        messages: [{ role: 'user', content: 'Say "ok"' }],
        maxTokens: 5,
      });
      return response.content.length > 0;
    } catch {
      return false;
    }
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.customHeaders,
    };
    return headers;
  }
}

function costPer1kOutput(model: Model): number | undefined {
  return model.costPer1kOutput;
}

function estimateMessageTokens(request: CompletionRequest): number {
  let chars = 0;
  if (request.systemPrompt) chars += request.systemPrompt.length;
  for (const msg of request.messages) {
    chars += msg.content.length;
  }
  return Math.ceil(chars / 4);
}
