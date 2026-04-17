import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  truncateToTokens,
  extractTextFromHtml,
  wordCount,
  simpleDiff,
} from './text';

describe('estimateTokens', () => {
  it('estimates ~1 token per 4 characters', () => {
    expect(estimateTokens('1234')).toBe(1);
    expect(estimateTokens('12345678')).toBe(2);
    expect(estimateTokens('')).toBe(0);
  });
});

describe('truncateToTokens', () => {
  it('returns full text if under limit', () => {
    expect(truncateToTokens('hello', 100)).toBe('hello');
  });

  it('truncates text over limit', () => {
    const long = 'a'.repeat(1000);
    const result = truncateToTokens(long, 10); // 10 tokens = ~40 chars
    expect(result.length).toBeLessThan(1000);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('extractTextFromHtml', () => {
  it('strips HTML tags', () => {
    expect(extractTextFromHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('removes script and style tags', () => {
    const html = '<p>Text</p><script>alert("xss")</script><style>.x{}</style>';
    expect(extractTextFromHtml(html)).toBe('Text');
  });

  it('decodes HTML entities', () => {
    expect(extractTextFromHtml('&amp; &lt; &gt; &quot;')).toBe('& < > "');
  });
});

describe('wordCount', () => {
  it('counts words', () => {
    expect(wordCount('hello world')).toBe(2);
    expect(wordCount('  one  two  three  ')).toBe(3);
    expect(wordCount('')).toBe(0);
  });
});

describe('simpleDiff', () => {
  it('identifies unchanged text', () => {
    const diff = simpleDiff('hello world', 'hello world');
    expect(diff.every((d) => d.type === 'unchanged')).toBe(true);
  });

  it('identifies added and removed text', () => {
    const diff = simpleDiff('hello world', 'hello beautiful world');
    const types = diff.map((d) => d.type);
    expect(types).toContain('added');
  });

  it('handles completely different text', () => {
    const diff = simpleDiff('abc', 'xyz');
    const types = diff.map((d) => d.type);
    expect(types).toContain('removed');
    expect(types).toContain('added');
  });
});
