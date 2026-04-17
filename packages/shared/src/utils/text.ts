/** Rough token count estimate (~4 chars per token for English). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Truncate text to approximately `maxTokens` tokens. */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

/** Extract the readable text from HTML. */
export function extractTextFromHtml(html: string): string {
  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return stripped;
}

/** Get surrounding text context from a position in a larger text. */
export function getSurroundingContext(
  fullText: string,
  selectionStart: number,
  selectionEnd: number,
  contextChars: number = 500,
): string {
  const before = fullText.slice(Math.max(0, selectionStart - contextChars), selectionStart);
  const after = fullText.slice(selectionEnd, selectionEnd + contextChars);
  return `${before}[SELECTED]${after}`;
}

/** Check if text looks like it needs grammar fixes (very basic heuristic). */
export function hasObviousErrors(text: string): boolean {
  const doubleSpaces = /  +/.test(text);
  const missingCapitalAfterPeriod = /\.\s+[a-z]/.test(text);
  const doubleWords = /\b(\w+)\s+\1\b/i.test(text);
  return doubleSpaces || missingCapitalAfterPeriod || doubleWords;
}

/** Count words in text. */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Generate a simple diff between two strings for display. */
export function simpleDiff(
  original: string,
  modified: string,
): { type: 'unchanged' | 'removed' | 'added'; text: string }[] {
  const origWords = original.split(/(\s+)/);
  const modWords = modified.split(/(\s+)/);
  const result: { type: 'unchanged' | 'removed' | 'added'; text: string }[] = [];

  // Simple LCS-based word diff
  const m = origWords.length;
  const n = modWords.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === modWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m,
    j = n;
  const ops: { type: 'unchanged' | 'removed' | 'added'; text: string }[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === modWords[j - 1]) {
      ops.push({ type: 'unchanged', text: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'added', text: modWords[j - 1] });
      j--;
    } else {
      ops.push({ type: 'removed', text: origWords[i - 1] });
      i--;
    }
  }

  ops.reverse();

  // Merge consecutive same-type segments
  for (const op of ops) {
    if (result.length > 0 && result[result.length - 1].type === op.type) {
      result[result.length - 1].text += op.text;
    } else {
      result.push({ ...op });
    }
  }

  return result;
}
