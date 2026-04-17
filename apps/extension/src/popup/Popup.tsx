import React, { useEffect, useState } from 'react';
import type { DraftlySettings } from '@draftly/shared';
import { loadSettings } from '../stores/settings';

export function Popup() {
  const [settings, setSettings] = useState<DraftlySettings | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'no-provider'>('loading');

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setStatus(s.defaultProviderId ? 'ready' : 'no-provider');
    });
  }, []);

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#4c6ef5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: '16px', fontWeight: 700 }}>Draftly</span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: status === 'ready' ? '#2b8a3e20' : '#e03131aa',
          color: status === 'ready' ? '#51cf66' : '#ff6b6b',
        }}>
          {status === 'loading' ? '...' : status === 'ready' ? 'Ready' : 'Setup needed'}
        </span>
      </div>

      {/* Quick info */}
      <div style={{
        fontSize: '12px',
        color: '#868e96',
        lineHeight: '1.5',
        marginBottom: '16px',
      }}>
        {status === 'ready' ? (
          <>
            <p style={{ marginBottom: '8px' }}>
              Select text on any page and click the <strong style={{ color: '#4c6ef5' }}>Draftly</strong> button, or press{' '}
              <kbd style={{
                padding: '1px 4px',
                borderRadius: '3px',
                background: '#2c2e33',
                fontSize: '11px',
              }}>
                {navigator.platform.includes('Mac') ? '⌘⇧D' : 'Ctrl+Shift+D'}
              </kbd>
            </p>
            <p>
              Provider: <strong style={{ color: '#e9ecef' }}>
                {settings?.defaultProviderId || 'None'}
              </strong>
              {settings?.defaultModelId && (
                <> &middot; Model: <strong style={{ color: '#e9ecef' }}>
                  {settings.defaultModelId}
                </strong></>
              )}
            </p>
          </>
        ) : (
          <p>Add an API key for at least one provider to get started.</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={openSettings}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: '#4c6ef5',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {status === 'ready' ? 'Settings' : 'Configure Providers'}
        </button>
        <div style={{ fontSize: '10px', color: '#495057', textAlign: 'center' }}>
          Your API keys stay local. Nothing is sent without your action.
        </div>
      </div>
    </div>
  );
}
