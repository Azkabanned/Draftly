import React, { useEffect, useState } from 'react';
import type { AuditEntry } from '@draftly/shared';

export function HistoryPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory().then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  const clearHistory = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ draftly_audit_log: [] });
    } else {
      localStorage.removeItem('draftly_audit_log');
    }
    setEntries([]);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold">Request History</h1>
          <p className="text-sm text-gray-500">
            Local audit log of AI requests. Nothing is sent externally.
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearHistory}
            className="rounded-md border border-red-800 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-900/20"
          >
            Clear history
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-8 text-center text-sm text-gray-500">
          No requests yet. Use Draftly on any page to see history here.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-draftly-900/30 px-2 py-0.5 text-[10px] font-medium text-draftly-400">
                    {entry.action}
                  </span>
                  <span className="text-xs text-gray-500">
                    {entry.providerId} / {entry.modelId}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="mb-1 truncate text-sm text-gray-300">
                {entry.selectedText}
              </p>

              <div className="flex gap-4 text-[10px] text-gray-600">
                <span>{entry.tokensSent} tokens sent</span>
                <span>{entry.tokensReceived} tokens received</span>
                {entry.redactionsApplied > 0 && (
                  <span className="text-yellow-600">
                    {entry.redactionsApplied} redactions
                  </span>
                )}
                {entry.contextAttached && (
                  <span className="text-blue-500">
                    +{entry.contextSources.length} tab(s) context
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadHistory(): Promise<AuditEntry[]> {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const data = await chrome.storage.local.get('draftly_audit_log');
    return (data.draftly_audit_log || []).reverse();
  }
  const stored = localStorage.getItem('draftly_audit_log');
  return stored ? JSON.parse(stored).reverse() : [];
}
