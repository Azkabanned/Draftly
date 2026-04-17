import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export function useKeyboard(combo: KeyCombo, callback: () => void, enabled = true) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const matches =
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        !!e.ctrlKey === !!combo.ctrl &&
        !!e.shiftKey === !!combo.shift &&
        !!e.altKey === !!combo.alt &&
        !!e.metaKey === !!combo.meta;

      if (matches) {
        e.preventDefault();
        e.stopPropagation();
        callback();
      }
    },
    [combo, callback, enabled],
  );

  useEffect(() => {
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [handler]);
}

/** Parse a keyboard shortcut string like "Ctrl+Shift+D" into a KeyCombo. */
export function parseShortcut(shortcut: string): KeyCombo {
  const parts = shortcut.split('+').map((p) => p.trim().toLowerCase());
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  };
}
