import { describe, it, expect } from 'vitest';
import { buildPrompt } from './builder';
import type { PromptContext } from '@draftly/shared';

describe('buildPrompt', () => {
  const baseContext: PromptContext = {
    selectedText: 'This is a test sentense with erors.',
  };

  it('builds a prompt for fix-grammar template', () => {
    const result = buildPrompt({
      templateId: 'fix-grammar',
      context: baseContext,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content).toContain('This is a test sentense with erors.');
    expect(result.messages[0].content).toContain('Fix the grammar');
    expect(result.systemPrompt).toContain('Draftly');
    expect(result.temperature).toBe(0.3); // Fix actions use lower temperature
  });

  it('builds a prompt for rewrite template', () => {
    const result = buildPrompt({
      templateId: 'rewrite-clarity',
      context: baseContext,
    });

    expect(result.messages[0].content).toContain('Rewrite');
    expect(result.temperature).toBe(0.7);
  });

  it('includes custom instruction for custom template', () => {
    const result = buildPrompt({
      templateId: 'custom',
      context: {
        ...baseContext,
        customInstruction: 'Make it sound like Shakespeare',
      },
    });

    expect(result.messages[0].content).toContain('Make it sound like Shakespeare');
  });

  it('includes tab context when provided', () => {
    const result = buildPrompt({
      templateId: 'rewrite-clarity',
      context: {
        ...baseContext,
        tabContexts: [
          {
            tabId: 1,
            title: 'Relevant Article',
            url: 'https://example.com/article',
            content: 'Some relevant context about the topic.',
            relevanceScore: 0.8,
          },
        ],
      },
    });

    expect(result.messages[0].content).toContain('Relevant Article');
    expect(result.messages[0].content).toContain('Some relevant context');
  });

  it('includes writing style when set', () => {
    const result = buildPrompt({
      templateId: 'rewrite-clarity',
      context: {
        ...baseContext,
        writingStyle: {
          id: 'formal',
          name: 'Formal',
          description: 'Formal academic style',
          systemPrompt: 'Write in a formal academic style.',
        },
      },
    });

    expect(result.systemPrompt).toContain('formal academic style');
  });

  it('throws for unknown template', () => {
    expect(() =>
      buildPrompt({
        templateId: 'nonexistent-template',
        context: baseContext,
      }),
    ).toThrow('Unknown template');
  });

  it('sets appropriate maxTokens for shorten action', () => {
    const result = buildPrompt({
      templateId: 'shorten',
      context: {
        selectedText: 'A'.repeat(400), // ~100 tokens
      },
    });

    expect(result.maxTokens).toBeLessThanOrEqual(100); // Should be ~60-70% of input
  });

  it('sets appropriate maxTokens for expand action', () => {
    const result = buildPrompt({
      templateId: 'expand',
      context: {
        selectedText: 'A'.repeat(400), // ~100 tokens
      },
    });

    expect(result.maxTokens).toBeGreaterThanOrEqual(200); // Should be ~2x input
  });
});
