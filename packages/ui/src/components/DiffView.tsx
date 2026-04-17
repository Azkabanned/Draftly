import React from 'react';
import { simpleDiff } from '@draftly/shared';

interface DiffViewProps {
  original: string;
  modified: string;
  mode?: 'inline' | 'side-by-side';
}

export function DiffView({ original, modified, mode = 'inline' }: DiffViewProps) {
  const diff = simpleDiff(original, modified);

  if (mode === 'side-by-side') {
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/10">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            Original
          </div>
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {original}
          </div>
        </div>
        <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/10">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-400">
            Modified
          </div>
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {modified}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800/50">
      <div className="whitespace-pre-wrap leading-relaxed">
        {diff.map((segment, i) => (
          <span
            key={i}
            className={
              segment.type === 'removed'
                ? 'bg-red-100 text-red-700 line-through dark:bg-red-900/30 dark:text-red-400'
                : segment.type === 'added'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'text-gray-700 dark:text-gray-300'
            }
          >
            {segment.text}
          </span>
        ))}
      </div>
    </div>
  );
}
