import type { TabContext } from '@draftly/shared';

/**
 * Rank tab contexts by relevance to the selected text and user instruction.
 * Uses keyword overlap as a lightweight relevance signal.
 */
export function rankContextsByRelevance(
  contexts: TabContext[],
  selectedText: string,
  instruction?: string,
): TabContext[] {
  const queryTerms = extractKeywords(selectedText + ' ' + (instruction || ''));

  return contexts
    .map((ctx) => ({
      ...ctx,
      relevanceScore: computeRelevance(ctx, queryTerms),
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
}

function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
    'not', 'no', 'if', 'then', 'else', 'when', 'up', 'out', 'so', 'than',
    'that', 'this', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'she', 'they', 'them', 'their', 'what', 'which', 'who',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return new Set(words);
}

function computeRelevance(context: TabContext, queryTerms: Set<string>): number {
  const contextText = `${context.title} ${context.content}`.toLowerCase();
  const contextWords = new Set(contextText.split(/\s+/));

  let matches = 0;
  for (const term of queryTerms) {
    if (contextWords.has(term) || contextText.includes(term)) {
      matches++;
    }
  }

  // Normalise by query size
  const score = queryTerms.size > 0 ? matches / queryTerms.size : 0;

  // Boost if title matches
  const titleLower = context.title.toLowerCase();
  let titleBoost = 0;
  for (const term of queryTerms) {
    if (titleLower.includes(term)) titleBoost += 0.1;
  }

  return Math.min(1, score + titleBoost);
}
