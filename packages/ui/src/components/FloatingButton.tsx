import React from 'react';

interface FloatingButtonProps {
  position: { x: number; y: number };
  onClick: () => void;
  visible: boolean;
}

export function FloatingButton({ position, onClick, visible }: FloatingButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        background: '#4c6ef5',
        color: 'white',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        cursor: 'pointer',
        pointerEvents: 'auto',
        boxShadow: '0 4px 24px -4px rgba(0,0,0,0.25), 0 2px 8px -2px rgba(0,0,0,0.15)',
        transition: 'all 150ms ease',
        animation: 'draftly-fade-in 150ms ease-out',
      }}
      title="Rewrite with Draftly (Ctrl+Shift+D)"
    >
      <DraftlyIcon size={14} />
      <span>Draftly</span>
    </button>
  );
}

function DraftlyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { DraftlyIcon };
