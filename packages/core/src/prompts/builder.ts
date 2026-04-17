import type {
  PromptContext,
  CompletionRequest,
  Message,
  TabContext,
} from '@draftly/shared';
import { estimateTokens, truncateToTokens } from '@draftly/shared';
import { getTemplate, PROMPT_TEMPLATES } from './templates';

const DEFAULT_SYSTEM_PROMPT = `You are Draftly, a precise writing assistant. You help users improve their writing by following instructions exactly. You return only the requested output — no explanations, no meta-commentary, no preamble. Keep the output in the same language as the input. Do not translate.`;

const MAX_CONTEXT_TOKENS = 4000;
const MAX_TAB_CONTEXT_TOKENS = 2000;

export interface BuildPromptOptions {
  templateId: string;
  context: PromptContext;
  customTemplates?: typeof PROMPT_TEMPLATES;
  maxContextTokens?: number;
}

export function buildPrompt(options: BuildPromptOptions): CompletionRequest {
  const {
    templateId,
    context,
    customTemplates = [],
    maxContextTokens = MAX_CONTEXT_TOKENS,
  } = options;

  // Find template: check custom first, then built-in
  const template =
    customTemplates.find((t) => t.id === templateId) || getTemplate(templateId);

  if (!template) {
    throw new Error(`Unknown template: ${templateId}`);
  }

  // Build the user prompt from template
  let userPrompt = template.template;
  userPrompt = userPrompt.replace(/\{\{text\}\}/g, context.selectedText);
  userPrompt = userPrompt.replace(
    /\{\{customInstruction\}\}/g,
    context.customInstruction || '',
  );

  // Handle conditional blocks
  userPrompt = userPrompt.replace(
    /\{\{#if customInstruction\}\}([\s\S]*?)\{\{\/if\}\}/g,
    context.customInstruction ? '$1' : '',
  );

  // Build system prompt
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;

  if (context.writingStyle?.systemPrompt) {
    systemPrompt += `\n\nWriting style: ${context.writingStyle.systemPrompt}`;
  }

  // Add surrounding context if available
  if (context.surroundingText) {
    const truncated = truncateToTokens(context.surroundingText, 500);
    userPrompt += `\n\nSurrounding context for reference (do not include in output):\n${truncated}`;
  }

  // Add tab contexts if available
  if (context.tabContexts && context.tabContexts.length > 0) {
    const tabContextStr = buildTabContextString(
      context.tabContexts,
      maxContextTokens > MAX_TAB_CONTEXT_TOKENS ? MAX_TAB_CONTEXT_TOKENS : maxContextTokens / 2,
    );
    if (tabContextStr) {
      userPrompt += `\n\nAdditional context from open tabs (use as reference only):\n${tabContextStr}`;
    }
  }

  // Truncate if total exceeds limit
  const totalTokens = estimateTokens(systemPrompt + userPrompt);
  if (totalTokens > maxContextTokens) {
    userPrompt = truncateToTokens(userPrompt, maxContextTokens - estimateTokens(systemPrompt));
  }

  const messages: Message[] = [{ role: 'user', content: userPrompt }];

  return {
    model: '', // Set by the caller based on selected model
    messages,
    systemPrompt,
    temperature: template.category === 'fix' ? 0.3 : 0.7,
    maxTokens: estimateOutputTokens(context.selectedText, templateId),
  };
}

function buildTabContextString(tabs: TabContext[], maxTokens: number): string {
  // Sort by relevance score if available
  const sorted = [...tabs].sort(
    (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
  );

  let result = '';
  let tokensUsed = 0;

  for (const tab of sorted) {
    const entry = `[${tab.title}] (${tab.url})\n${tab.content}\n\n`;
    const entryTokens = estimateTokens(entry);

    if (tokensUsed + entryTokens > maxTokens) {
      // Try to fit a truncated version
      const remaining = maxTokens - tokensUsed;
      if (remaining > 100) {
        result += truncateToTokens(entry, remaining);
      }
      break;
    }

    result += entry;
    tokensUsed += entryTokens;
  }

  return result;
}

function estimateOutputTokens(inputText: string, templateId: string): number {
  const inputTokens = estimateTokens(inputText);

  switch (templateId) {
    case 'shorten':
    case 'summarise':
      return Math.max(100, Math.ceil(inputTokens * 0.6));
    case 'expand':
      return Math.max(200, Math.ceil(inputTokens * 2));
    case 'generate-reply':
      return Math.max(200, Math.ceil(inputTokens * 1.5));
    default:
      return Math.max(100, Math.ceil(inputTokens * 1.2));
  }
}
