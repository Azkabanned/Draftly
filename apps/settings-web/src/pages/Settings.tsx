import React from 'react';
import { useSettingsStore } from '../store/settings';

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();

  const exportSettings = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'draftly-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        updateSettings(imported);
      } catch {
        alert('Invalid settings file');
      }
    };
    input.click();
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">General Settings</h1>
      <p className="mb-8 text-sm text-gray-500">
        Configure Draftly's behaviour and appearance.
      </p>

      {/* UI Settings */}
      <section className="mb-6 rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">Interface</h2>

        <div className="space-y-4">
          <Toggle
            label="Show floating button on text selection"
            checked={settings.showFloatingButton}
            onChange={(v) => updateSettings({ showFloatingButton: v })}
          />
          <Toggle
            label="Show context menu item"
            checked={settings.showContextMenu}
            onChange={(v) => updateSettings({ showContextMenu: v })}
          />
          <Toggle
            label="Compact mode"
            checked={settings.compactMode}
            onChange={(v) => updateSettings({ compactMode: v })}
          />

          <div>
            <label className="mb-1 block text-sm">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) =>
                updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })
              }
              className="rounded-md border border-surface-dark-3 bg-surface-dark-0 px-3 py-2 text-sm text-gray-200"
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm">Keyboard shortcut</label>
            <input
              type="text"
              value={settings.keyboardShortcut}
              onChange={(e) => updateSettings({ keyboardShortcut: e.target.value })}
              className="rounded-md border border-surface-dark-3 bg-surface-dark-0 px-3 py-2 text-sm text-gray-200"
              placeholder="Ctrl+Shift+D"
            />
            <p className="mt-1 text-[11px] text-gray-600">
              Chrome shortcuts are configured at chrome://extensions/shortcuts
            </p>
          </div>
        </div>
      </section>

      {/* Favourite Actions */}
      <section className="mb-6 rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">Favourite Actions</h2>
        <p className="mb-3 text-xs text-gray-500">
          These appear at the top of the command box for quick access.
        </p>
        <div className="flex flex-wrap gap-2">
          {['fix', 'rewrite', 'sharpen', 'shorten', 'expand', 'professional', 'friendly', 'simplify', 'summarise', 'reply'].map(
            (action) => {
              const isFav = settings.favouriteActions.includes(action);
              return (
                <button
                  key={action}
                  onClick={() => {
                    const favs = isFav
                      ? settings.favouriteActions.filter((a) => a !== action)
                      : [...settings.favouriteActions, action];
                    updateSettings({ favouriteActions: favs });
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    isFav
                      ? 'bg-draftly-600 text-white'
                      : 'border border-surface-dark-3 text-gray-400 hover:bg-surface-dark-2'
                  }`}
                >
                  /{action}
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* Data */}
      <section className="rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">Data</h2>
        <div className="flex gap-3">
          <button
            onClick={exportSettings}
            className="rounded-md border border-surface-dark-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-surface-dark-2"
          >
            Export settings
          </button>
          <button
            onClick={importSettings}
            className="rounded-md border border-surface-dark-3 px-4 py-2 text-sm text-gray-300 transition hover:bg-surface-dark-2"
          >
            Import settings
          </button>
        </div>
      </section>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="text-sm">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? 'bg-draftly-600' : 'bg-surface-dark-3'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </button>
    </label>
  );
}
