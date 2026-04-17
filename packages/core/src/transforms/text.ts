import type {
  ActionId,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  PromptContext,
} from '@draftly/shared';
import { getActionById } from '@draftly/shared';
import type { LLMProvider } from '@draftly/shared';
import { buildPrompt } from '../prompts/builder';

export interface TransformResult {
  original: string;
  result: string;
  action: ActionId;
  model: string;
  provider: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface TransformOptions {
  action: ActionId;
  context: PromptContext;
  provider: LLMProvider;
  model: string;
  customInstruction?: string;
}

/**
 * Execute a text transformation using the given provider and action.
 */
export async function transformText(options: TransformOptions): Promise<TransformResult> {
  const { action, context, provider, model, customInstruction } = options;
  const actionDef = getActionById(action);
  if (!actionDef) throw new Error(`Unknown action: ${action}`);

  const mergedContext: PromptContext = {
    ...context,
    customInstruction: customInstruction || context.customInstruction,
  };

  const request = buildPrompt({
    templateId: actionDef.promptTemplate,
    context: mergedContext,
  });
  request.model = model;

  const response = await provider.complete(request);

  return {
    original: context.selectedText,
    result: response.content.trim(),
    action,
    model: response.model,
    provider: provider.id,
    usage: response.usage,
  };
}

/**
 * Execute a text transformation with streaming.
 * Yields partial results as they arrive.
 */
export async function* transformTextStream(
  options: TransformOptions,
): AsyncGenerator<{ partial: string; done: boolean; result?: TransformResult }> {
  const { action, context, provider, model, customInstruction } = options;
  const actionDef = getActionById(action);
  if (!actionDef) throw new Error(`Unknown action: ${action}`);

  const mergedContext: PromptContext = {
    ...context,
    customInstruction: customInstruction || context.customInstruction,
  };

  const request = buildPrompt({
    templateId: actionDef.promptTemplate,
    context: mergedContext,
  });
  request.model = model;

  let fullContent = '';

  for await (const chunk of provider.stream(request)) {
    fullContent += chunk.content;

    if (chunk.done) {
      yield {
        partial: fullContent,
        done: true,
        result: {
          original: context.selectedText,
          result: fullContent.trim(),
          action,
          model,
          provider: provider.id,
          usage: chunk.usage,
        },
      };
      return;
    }

    yield { partial: fullContent, done: false };
  }
}
