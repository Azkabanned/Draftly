import React, { useState } from 'react';
import type { TransformResult } from '@draftly/core';

interface ResultViewProps {
  result: TransformResult;
  onReplace: () => void;
  onInsertBelow: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
}

const S = {
  tab: (active: boolean): React.CSSProperties => ({
    padding: '3px 8px',
    borderRadius: 4,
    border: 'none',
    background: active ? 'rgba(76,110,245,0.12)' : 'transparent',
    color: active ? '#4c6ef5' : '#9ca3af',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  }),
  resultBox: {
    borderRadius: 8,
    background: '#f3f4f6',
    padding: 12,
    fontSize: 13,
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap' as const,
    color: '#1f2937',
    maxHeight: 200,
    overflowY: 'auto' as const,
    border: '1px solid #e5e7eb',
  },
  primaryBtn: {
    flex: 1,
    padding: '7px 12px',
    borderRadius: 6,
    border: 'none',
    background: '#4c6ef5',
    color: 'white',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '7px 12px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    background: 'white',
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  iconBtn: {
    padding: '5px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    background: 'white',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
  },
};

export function ResultView({
  result,
  onReplace,
  onInsertBelow,
  onCopy,
  onRegenerate,
  onDismiss,
}: ResultViewProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ animation: 'draftly-fade-in 200ms ease-out' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setShowDiff(false)} style={S.tab(!showDiff)}>Result</button>
          <button onClick={() => setShowDiff(true)} style={S.tab(showDiff)}>Compare</button>
        </div>
        {result.usage && (
          <span style={{ fontSize: 10, color: '#9ca3af' }}>
            {result.usage.totalTokens} tokens
          </span>
        )}
      </div>

      {/* Content */}
      {showDiff ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ ...S.resultBox, background: '#fef2f2', borderColor: '#fecaca' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#f87171', marginBottom: 4, textTransform: 'uppercase' as const }}>Original</div>
            {result.original}
          </div>
          <div style={{ ...S.resultBox, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#4ade80', marginBottom: 4, textTransform: 'uppercase' as const }}>Rewritten</div>
            {result.result}
          </div>
        </div>
      ) : (
        <div style={S.resultBox}>
          {result.result || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No output returned from model</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <button onClick={onReplace} style={S.primaryBtn}>Replace</button>
        <button onClick={onInsertBelow} style={S.secondaryBtn}>Insert below</button>
        <button onClick={handleCopy} style={S.secondaryBtn}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button onClick={onRegenerate} style={S.iconBtn} title="Regenerate">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M2 8a6 6 0 0110.89-3.48M14 8a6 6 0 01-10.89 3.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={onDismiss} style={S.iconBtn} title="Dismiss">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
