import React from 'react';

interface LoadingStateProps {
  text?: string;
  partial?: string;
}

export function LoadingState({ text = 'Thinking...', partial }: LoadingStateProps) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-draftly-500 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-draftly-500 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-draftly-500 [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-gray-400">{text}</span>
      </div>

      {partial && (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
          <div className="whitespace-pre-wrap">{partial}</div>
          <span className="inline-block h-4 w-0.5 animate-pulse bg-draftly-500" />
        </div>
      )}
    </div>
  );
}

export function Shimmer() {
  return (
    <div className="space-y-2 py-3">
      <div className="h-3 w-3/4 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
      <div className="h-3 w-full rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
      <div className="h-3 w-2/3 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
    </div>
  );
}
