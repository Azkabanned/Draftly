export type AuthType = 'api-key' | 'oauth' | 'none';

export interface Model {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  contextWindow: number;
  supportsStreaming: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
  customHeaders?: Record<string, string>;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: 'stop' | 'length' | 'error';
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: TokenUsage;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  icon: string;
  authType: AuthType;
  defaultBaseUrl: string;

  configure(config: ProviderConfig): void;
  listModels(): Model[];
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  stream(request: CompletionRequest): AsyncGenerator<StreamChunk>;
  estimateCost(request: CompletionRequest): CostEstimate | null;
  validateConnection(): Promise<boolean>;
}

export interface ProviderState {
  id: string;
  configured: boolean;
  config: ProviderConfig;
  selectedModel?: string;
}
