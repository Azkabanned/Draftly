import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { WritingAction, ActionId, Model, CostEstimate } from '@draftly/shared';
import type { TransformResult } from '@draftly/core';
import { estimateTokens } from '@draftly/shared';
import { ActionList } from './ActionList';
import { ResultView } from './ResultView';
import { LoadingState } from './LoadingState';
import { ModelSwitcher } from './ModelSwitcher';
import { TokenEstimate } from './TokenEstimate';

export type CommandBoxState = 'idle' | 'loading' | 'result' | 'error';

interface CommandBoxProps {
  selectedText: string;
  models: Model[];
  selectedModel: string;
  providers?: { id: string; name: string }[];
  favouriteActions?: string[];
  costEstimate?: CostEstimate | null;
  onSelectModel: (modelId: string) => void;
  onExecuteAction: (action: ActionId, customInstruction?: string) => void;
  onReplace: (text: string) => void;
  onInsertBelow: (text: string) => void;
  onCopy: (text: string) => void;
  onDismiss: () => void;
  state: CommandBoxState;
  partialResult?: string;
  result?: TransformResult;
  error?: string;
}

export function CommandBox({
  selectedText,
  models,
  selectedModel,
  providers,
  favouriteActions = [],
  costEstimate,
  onSelectModel,
  onExecuteAction,
  onReplace,
  onInsertBelow,
  onCopy,
  onDismiss,
  state,
  partialResult,
  result,
  error,
}: CommandBoxProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onDismiss]);

  const handleActionSelect = useCallback(
    (action: WritingAction) => {
      if (action.id === 'custom') {
        // Focus the input for custom instruction
        inputRef.current?.focus();
        setInput('/custom ');
      } else {
        onExecuteAction(action.id);
      }
    },
    [onExecuteAction],
  );

  const handleInputSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Check for slash commands
    if (trimmed.startsWith('/')) {
      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const rest = parts.slice(1).join(' ');

      const action = ['fix', 'rewrite', 'sharpen', 'shorten', 'expand', 'professional', 'friendly', 'persuasive', 'confident', 'formal', 'academic', 'simplify', 'paraphrase', 'vocabulary', 'tone-detect', 'tone', 'reply', 'summarise', 'brainstorm', 'draft', 'custom'].find(
        (a) => `/${a}` === cmd,
      );

      if (action) {
        onExecuteAction(action as ActionId, rest || undefined);
        return;
      }
    }

    // Treat as custom instruction
    onExecuteAction('custom', trimmed);
  }, [input, onExecuteAction]);

  const inputTokens = estimateTokens(selectedText);
  const estimatedOutput = Math.max(100, Math.ceil(inputTokens * 1.2));

  const box: Record<string, React.CSSProperties> = {
    container: {
      width: 380, overflow: 'hidden', borderRadius: 12,
      border: '1px solid #e5e7eb', background: 'white',
      boxShadow: '0 8px 40px -8px rgba(0,0,0,0.16), 0 4px 16px -4px rgba(0,0,0,0.1)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      animation: 'draftly-fade-in 150ms ease-out',
      pointerEvents: 'auto',
    },
    header: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid #f3f4f6', padding: '8px 12px',
    },
    searchRow: {
      display: 'flex', alignItems: 'center', gap: 8,
      borderBottom: '1px solid #f3f4f6', padding: '8px 12px',
    },
    input: {
      flex: 1, border: 'none', outline: 'none', background: 'transparent',
      fontSize: 13, color: '#374151',
    },
    content: { padding: '4px 12px' },
    footer: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderTop: '1px solid #f3f4f6', padding: '6px 12px',
      fontSize: 10, color: '#d1d5db',
    },
    error: {
      padding: 12, borderRadius: 8,
      background: '#fef2f2', border: '1px solid #fecaca',
      fontSize: 13, color: '#dc2626', whiteSpace: 'pre-wrap' as const,
      maxHeight: 150, overflowY: 'auto' as const,
    },
  };

  return (
    <div style={box.container}>
      {/* Header */}
      <div style={box.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Draftly</span>
          <span style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedText.length > 40 ? selectedText.slice(0, 40) + '...' : selectedText}
          </span>
        </div>
        <ModelSwitcher
          models={models}
          selectedModel={selectedModel}
          onSelect={onSelectModel}
          providers={providers}
        />
      </div>

      {/* Search / Command Input */}
      <div style={box.searchRow}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#d1d5db', flexShrink: 0 }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              handleInputSubmit();
            }
          }}
          placeholder="Type a command or instruction..."
          style={box.input}
        />
      </div>

      {/* Content area */}
      <div style={box.content}>
        {state === 'idle' && (
          <ActionList
            onSelect={handleActionSelect}
            favourites={favouriteActions}
            filter={input.startsWith('/') ? '' : input}
          />
        )}

        {state === 'loading' && (
          <LoadingState text="Generating..." partial={partialResult} />
        )}

        {state === 'result' && result && (
          <ResultView
            result={result}
            onReplace={() => onReplace(result.result)}
            onInsertBelow={() => onInsertBelow(result.result)}
            onCopy={() => onCopy(result.result)}
            onRegenerate={() => onExecuteAction(result.action)}
            onDismiss={onDismiss}
          />
        )}

        {state === 'error' && (
          <div style={{ padding: '12px 0' }}>
            <div style={box.error}>
              {error || 'Something went wrong. Please try again.'}
            </div>
            <button
              onClick={onDismiss}
              style={{ marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={box.footer}>
        <TokenEstimate
          inputTokens={inputTokens}
          estimatedOutputTokens={estimatedOutput}
          costEstimate={costEstimate}
        />
        <span>Esc to close</span>
      </div>
    </div>
  );
}
