import React, { useState, useRef, useEffect } from 'react';
import type { Model } from '@draftly/shared';

interface ModelSwitcherProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  providers?: { id: string; name: string }[];
}

export function ModelSwitcher({ models, selectedModel, onSelect, providers = [] }: ModelSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = models.find((m) => m.id === selectedModel);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group models by provider
  const grouped = new Map<string, Model[]>();
  for (const model of models) {
    const existing = grouped.get(model.provider) || [];
    existing.push(model);
    grouped.set(model.provider, existing);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-750"
      >
        <ModelIcon provider={current?.provider || ''} />
        <span className="max-w-[120px] truncate">{current?.name || 'Select model'}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-draftly-lg dark:border-gray-700 dark:bg-gray-800 animate-scale-in">
          <div className="max-h-64 overflow-y-auto py-1">
            {Array.from(grouped.entries()).map(([providerId, providerModels]) => {
              const providerName = providers.find((p) => p.id === providerId)?.name || providerId;
              return (
                <div key={providerId}>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {providerName}
                  </div>
                  {providerModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelect(model.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                        model.id === selectedModel
                          ? 'bg-draftly-50 text-draftly-700 dark:bg-draftly-900/20 dark:text-draftly-400'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-750'
                      }`}
                    >
                      <span className="flex-1 truncate font-medium">{model.name}</span>
                      {model.costPer1kInput !== undefined && (
                        <span className="text-[10px] text-gray-400">
                          ${model.costPer1kInput}/1K
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelIcon({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    anthropic: 'bg-orange-100 text-orange-600',
    openai: 'bg-emerald-100 text-emerald-600',
    gemini: 'bg-blue-100 text-blue-600',
    openrouter: 'bg-purple-100 text-purple-600',
    custom: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold ${
        colors[provider] || colors.custom
      }`}
    >
      {provider.charAt(0).toUpperCase()}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
