import React, { useEffect, useState } from 'react';
import { useSettingsStore } from './store/settings';
import { ProvidersPage } from './pages/Providers';
import { PrivacyPage } from './pages/Privacy';
import { HistoryPage } from './pages/History';
import { SettingsPage } from './pages/Settings';

type Page = 'providers' | 'privacy' | 'history' | 'settings';

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: 'providers', label: 'Providers', icon: '⚡' },
  { id: 'privacy', label: 'Privacy', icon: '🛡' },
  { id: 'history', label: 'History', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export function App() {
  const [page, setPage] = useState<Page>('providers');
  const { load, loaded, save } = useSettingsStore();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    await save();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <nav className="fixed top-0 left-0 bottom-0 w-52 border-r border-surface-dark-2 bg-surface-dark-0 p-4">
        <div className="mb-8 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#4c6ef5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-lg font-bold">Draftly</span>
        </div>

        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                page === item.id
                  ? 'bg-surface-dark-2 text-white'
                  : 'text-gray-500 hover:bg-surface-dark-1 hover:text-gray-300'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-draftly-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-draftly-700"
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="ml-52 flex-1 p-8">
        <div className="mx-auto max-w-2xl">
          {page === 'providers' && <ProvidersPage />}
          {page === 'privacy' && <PrivacyPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
