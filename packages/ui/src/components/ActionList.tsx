import React, { useState, useRef, useEffect } from 'react';
import type { WritingAction, ActionCategory } from '@draftly/shared';
import { WRITING_ACTIONS, ACTION_CATEGORIES } from '@draftly/shared';

interface ActionListProps {
  onSelect: (action: WritingAction) => void;
  favourites?: string[];
  filter?: string;
}

export function ActionList({ onSelect, favourites = [], filter = '' }: ActionListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = WRITING_ACTIONS.filter((action) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      action.label.toLowerCase().includes(q) ||
      action.slash.toLowerCase().includes(q) ||
      action.description.toLowerCase().includes(q)
    );
  });

  // Separate favourites from rest
  const favouriteActions = filtered.filter((a) => favourites.includes(a.id));
  const otherActions = filtered.filter((a) => !favourites.includes(a.id));

  // Group other actions by category
  const grouped = new Map<ActionCategory, WritingAction[]>();
  for (const action of otherActions) {
    const existing = grouped.get(action.category) || [];
    existing.push(action);
    grouped.set(action.category, existing);
  }

  const allVisible = [...favouriteActions, ...otherActions];

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, allVisible.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allVisible[selectedIndex]) {
          onSelect(allVisible[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allVisible, onSelect]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  let globalIndex = 0;

  return (
    <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
      {allVisible.length === 0 && (
        <div className="px-3 py-4 text-center text-sm text-gray-400">
          No matching actions
        </div>
      )}

      {favouriteActions.length > 0 && (
        <div className="mb-1">
          <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Favourites
          </div>
          {favouriteActions.map((action) => {
            const idx = globalIndex++;
            return (
              <ActionItem
                key={action.id}
                action={action}
                selected={idx === selectedIndex}
                index={idx}
                onClick={() => onSelect(action)}
                onHover={() => setSelectedIndex(idx)}
              />
            );
          })}
        </div>
      )}

      {Array.from(grouped.entries())
        .sort(
          ([a], [b]) =>
            (ACTION_CATEGORIES[a]?.order ?? 99) - (ACTION_CATEGORIES[b]?.order ?? 99),
        )
        .map(([category, actions]) => (
          <div key={category} className="mb-1">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              {ACTION_CATEGORIES[category]?.label || category}
            </div>
            {actions.map((action) => {
              const idx = globalIndex++;
              return (
                <ActionItem
                  key={action.id}
                  action={action}
                  selected={idx === selectedIndex}
                  index={idx}
                  onClick={() => onSelect(action)}
                  onHover={() => setSelectedIndex(idx)}
                />
              );
            })}
          </div>
        ))}
    </div>
  );
}

function ActionItem({
  action,
  selected,
  index,
  onClick,
  onHover,
}: {
  action: WritingAction;
  selected: boolean;
  index: number;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      data-index={index}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
        selected
          ? 'bg-draftly-600/10 text-draftly-600 dark:bg-draftly-400/10 dark:text-draftly-400'
          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded text-base">
        {action.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{action.label}</div>
        <div className="text-xs text-gray-400 truncate">{action.description}</div>
      </div>
      <span className="text-xs text-gray-400 font-mono">{action.slash}</span>
    </button>
  );
}
