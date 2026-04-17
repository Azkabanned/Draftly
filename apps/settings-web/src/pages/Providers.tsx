import React, { useState } from 'react';
import { useSettingsStore } from '../store/settings';
import { getRegistry, registerAllProviders } from '@draftly/providers';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude models', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', desc: 'GPT models', placeholder: 'sk-...' },
  { id: 'gemini', name: 'Google Gemini', desc: 'Gemini models', placeholder: 'AIza...' },
  { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-provider gateway', placeholder: 'sk-or-...' },
  { id: 'custom', name: 'Custom Endpoint', desc: 'OpenAI-compatible API (Ollama, LM Studio, etc.)', placeholder: 'API key (optional for local)' },
];

export function ProvidersPage() {
  const { apiKeys, setApiKey, settings, updateSettings } = useSettingsStore();
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});

  const handleTest = async (providerId: string) => {
    setTesting(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: null }));

    try {
      registerAllProviders();
      const registry = getRegistry();
      const provider = registry.get(providerId);
      if (!provider) throw new Error('Provider not found');

      const key = apiKeys[providerId];
      if (!key && providerId !== 'custom') throw new Error('No API key');

      provider.configure({ apiKey: key });
      const valid = await provider.validateConnection();
      setTestResult((prev) => ({ ...prev, [providerId]: valid }));
    } catch {
      setTestResult((prev) => ({ ...prev, [providerId]: false }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Providers</h1>
      <p className="mb-8 text-sm text-gray-500">
        Connect your own AI providers. API keys are stored locally on your device and are
        never sent to Draftly servers.
      </p>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const isDefault = settings.defaultProviderId === provider.id;
          const hasKey = !!apiKeys[provider.id];
          const result = testResult[provider.id];

          return (
            <div
              key={provider.id}
              className="rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{provider.name}</span>
                    {hasKey && (
                      <span className="rounded bg-green-900/30 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        Configured
                      </span>
                    )}
                    {isDefault && (
                      <span className="rounded bg-draftly-900/30 px-2 py-0.5 text-[10px] font-medium text-draftly-400">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{provider.desc}</p>
                </div>

                <div className="flex gap-2">
                  {hasKey && (
                    <button
                      onClick={() => handleTest(provider.id)}
                      disabled={testing === provider.id}
                      className="rounded-md border border-surface-dark-3 px-3 py-1 text-xs text-gray-400 transition hover:bg-surface-dark-2"
                    >
                      {testing === provider.id
                        ? 'Testing...'
                        : result === true
                          ? 'Connected'
                          : result === false
                            ? 'Failed'
                            : 'Test'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder={provider.placeholder}
                  value={apiKeys[provider.id] || ''}
                  onChange={(e) => setApiKey(provider.id, e.target.value)}
                  className="w-full rounded-md border border-surface-dark-3 bg-surface-dark-0 px-3 py-2 text-sm text-gray-200 outline-none focus:border-draftly-600"
                />

                {provider.id === 'custom' && (
                  <input
                    type="text"
                    placeholder="Base URL (e.g. http://localhost:11434/v1)"
                    value={settings.providers.custom?.config?.baseUrl || ''}
                    onChange={(e) =>
                      updateSettings({
                        providers: {
                          ...settings.providers,
                          custom: {
                            id: 'custom',
                            configured: true,
                            config: { baseUrl: e.target.value },
                          },
                        },
                      })
                    }
                    className="w-full rounded-md border border-surface-dark-3 bg-surface-dark-0 px-3 py-2 text-sm text-gray-200 outline-none focus:border-draftly-600"
                  />
                )}

                {hasKey && !isDefault && (
                  <button
                    onClick={() =>
                      updateSettings({ defaultProviderId: provider.id })
                    }
                    className="text-xs text-draftly-400 hover:text-draftly-300"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
