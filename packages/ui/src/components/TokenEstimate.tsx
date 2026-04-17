import React from 'react';
import type { CostEstimate } from '@draftly/shared';

interface TokenEstimateProps {
  inputTokens: number;
  estimatedOutputTokens: number;
  costEstimate?: CostEstimate | null;
}

export function TokenEstimate({
  inputTokens,
  estimatedOutputTokens,
  costEstimate,
}: TokenEstimateProps) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-gray-400">
      <span title="Estimated input tokens">
        ~{formatNumber(inputTokens)} in
      </span>
      <span title="Estimated output tokens">
        ~{formatNumber(estimatedOutputTokens)} out
      </span>
      {costEstimate && (
        <span title="Estimated cost" className="font-medium">
          ~${costEstimate.totalCost.toFixed(4)}
        </span>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
