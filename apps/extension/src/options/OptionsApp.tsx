import React, { useState, useEffect } from 'react';
import type { DraftlySettings } from '@draftly/shared';
import { DEFAULT_SETTINGS } from '@draftly/shared';
import { loadSettings, saveSettings, storeApiKey, getApiKey, removeApiKey } from '../stores/settings';

type Tab = 'providers' | 'privacy' | 'prompts' | 'general';

const PROVIDERS_INFO = [
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude Opus, Sonnet, Haiku', placeholder: 'sk-ant-api03-...', color: '#d97757', url: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4o, GPT-4 Turbo', placeholder: 'sk-proj-...', color: '#10a37f', url: 'https://platform.openai.com/api-keys' },
  { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 2.5 Pro, Flash', placeholder: 'AIza...', color: '#4285f4', url: 'https://aistudio.google.com/apikey' },
  { id: 'openrouter', name: 'OpenRouter', desc: 'Multi-provider gateway', placeholder: 'sk-or-v1-...', color: '#b46efa', url: 'https://openrouter.ai/keys' },
  { id: 'custom', name: 'Local / Custom Inference', desc: 'Use Ollama, LM Studio, vLLM, or any OpenAI-compatible endpoint', placeholder: 'API key (optional for local models)', color: '#71717a', url: '' },
];

const LOCAL_PROVIDERS = [
  { name: 'Ollama', url: 'https://ollama.com', defaultUrl: 'http://localhost:11434/v1' },
  { name: 'LM Studio', url: 'https://lmstudio.ai', defaultUrl: 'http://localhost:1234/v1' },
  { name: 'vLLM', url: 'https://docs.vllm.ai', defaultUrl: 'http://localhost:8000/v1' },
];

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: 'providers', label: 'Providers', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'privacy', label: 'Privacy', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'prompts', label: 'Prompts', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { id: 'general', label: 'General', icon: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z M12 8a4 4 0 100 8 4 4 0 000-8z' },
];

export function OptionsApp() {
  const [settings, setSettings] = useState<DraftlySettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>('providers');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<false | 'saving' | 'saved' | 'error'>(false);
  const [saveError, setSaveError] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      // Restore custom base URL from saved settings
      const savedUrl = s.providers?.custom?.config?.baseUrl;
      if (savedUrl) setCustomBaseUrl(savedUrl);
    });
    Promise.all(
      PROVIDERS_INFO.map(async (p) => {
        const key = await getApiKey(p.id);
        return [p.id, key || ''] as const;
      }),
    ).then((entries) => setApiKeys(Object.fromEntries(entries)));
  }, []);

  const handleSave = async () => {
    setSaved('saving');
    setSaveError('');
    try {
      for (const [id, key] of Object.entries(apiKeys)) {
        if (key) await storeApiKey(id, key);
        else await removeApiKey(id);
      }

      const updatedSettings = { ...settings };

      if (customBaseUrl) {
        updatedSettings.providers = {
          ...updatedSettings.providers,
          custom: {
            id: 'custom',
            configured: true,
            config: { baseUrl: customBaseUrl },
          },
        };
      }

      if (!updatedSettings.defaultProviderId) {
        const firstConfigured = PROVIDERS_INFO.find((p) => apiKeys[p.id]);
        if (firstConfigured) updatedSettings.defaultProviderId = firstConfigured.id;
      }

      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setSaved('saved');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setSaved('error');
      setSaveError(err.message || 'Failed to save settings');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220,
        background: '#18181b',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 12px',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #4c6ef5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Draftly</div>
            <div style={{ fontSize: 10, color: '#52525b', fontWeight: 500 }}>Settings</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                border: 'none',
                background: tab === item.id ? 'rgba(76, 110, 245, 0.1)' : 'transparent',
                color: tab === item.id ? '#818cf8' : '#71717a',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'left' as const,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '0 4px' }}>
          <div style={{
            padding: '12px',
            borderRadius: 8,
            background: 'rgba(76, 110, 245, 0.06)',
            border: '1px solid rgba(76, 110, 245, 0.1)',
          }}>
            <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.5 }}>
              API keys are stored locally on your device. Nothing is ever sent to Draftly servers.
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, padding: '40px 48px', maxWidth: 720, minHeight: '100vh' }}>
        <div className="page-content" key={tab}>
          {tab === 'providers' && <ProvidersTab apiKeys={apiKeys} setApiKeys={setApiKeys} settings={settings} setSettings={setSettings} customBaseUrl={customBaseUrl} setCustomBaseUrl={setCustomBaseUrl} />}
          {tab === 'privacy' && <PrivacyTab settings={settings} setSettings={setSettings} />}
          {tab === 'prompts' && <PromptsTab />}
          {tab === 'general' && <GeneralTab settings={settings} setSettings={setSettings} />}
        </div>

        {/* Save bar */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          padding: '20px 0',
          background: 'linear-gradient(to top, #111113 60%, transparent)',
          marginTop: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleSave} disabled={saved === 'saving'} style={{
              padding: '10px 32px',
              borderRadius: 8,
              border: 'none',
              background: saved === 'saved' ? '#22c55e' : saved === 'error' ? '#ef4444' : 'linear-gradient(135deg, #4c6ef5, #6366f1)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: saved === 'saving' ? 'wait' : 'pointer',
              transition: 'all 200ms',
              boxShadow: '0 2px 12px rgba(76, 110, 245, 0.25)',
              opacity: saved === 'saving' ? 0.7 : 1,
            }}>
              {saved === 'saving' ? 'Saving...' : saved === 'saved' ? 'Saved!' : saved === 'error' ? 'Error — Retry' : 'Save Settings'}
            </button>
            {saveError && (
              <span style={{ fontSize: 12, color: '#fca5a5' }}>{saveError}</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ---- Tabs ----

function ProvidersTab({ apiKeys, setApiKeys, settings, setSettings, customBaseUrl, setCustomBaseUrl }: {
  apiKeys: Record<string, string>;
  setApiKeys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  settings: DraftlySettings;
  setSettings: React.Dispatch<React.SetStateAction<DraftlySettings>>;
  customBaseUrl: string;
  setCustomBaseUrl: (v: string) => void;
}) {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});
  const [models, setModels] = useState<Record<string, { id: string; name: string }[]>>({});
  const [expandedModels, setExpandedModels] = useState<string | null>(null);

  const handleTest = async (providerId: string) => {
    setTesting(providerId);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'VALIDATE_PROVIDER', providerId });
      setTestResults((prev) => ({ ...prev, [providerId]: { ok: response.valid, error: response.error } }));
      if (response.valid) {
        // Fetch models
        const modelsResp = await chrome.runtime.sendMessage({ type: 'GET_MODELS' });
        const providerModels = modelsResp?.providers?.find((p: any) => p.providerId === providerId);
        if (providerModels) {
          setModels((prev) => ({ ...prev, [providerId]: providerModels.models }));
          setExpandedModels(providerId);
        }
      }
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [providerId]: { ok: false, error: err.message } }));
    }
    setTesting(null);
  };

  const [scanning, setScanning] = useState(false);

  const handleScanModels = async () => {
    if (!customBaseUrl) return;
    setScanning(true);
    try {
      const resp = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'SCAN_MODELS', baseUrl: customBaseUrl, apiKey: apiKeys['custom'] || undefined },
          (r) => chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve(r),
        );
      });
      if (resp?.ok && resp.models?.length > 0) {
        setModels((prev) => ({ ...prev, custom: resp.models }));
        setExpandedModels('custom');
        setTestResults((prev) => ({ ...prev, custom: { ok: true } }));
      } else {
        setTestResults((prev) => ({ ...prev, custom: { ok: false, error: resp?.error || 'No models found' } }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, custom: { ok: false, error: err.message } }));
    }
    setScanning(false);
  };

  return (
    <div>
      <h1 style={st.heading}>Providers</h1>
      <p style={st.desc}>Connect your AI accounts. Each provider needs an API key from their dashboard.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {PROVIDERS_INFO.map((provider) => {
          const hasKey = !!apiKeys[provider.id];
          const isDefault = settings.defaultProviderId === provider.id;
          const testResult = testResults[provider.id];
          const providerModels = models[provider.id] || [];
          const isExpanded = expandedModels === provider.id;
          const selectedModel = settings.providers[provider.id]?.selectedModel || settings.defaultModelId;

          return (
            <div key={provider.id} style={{
              ...st.card,
              borderLeft: `3px solid ${hasKey ? provider.color : 'transparent'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: hasKey ? provider.color : '#3f3f46',
                  }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{provider.name}</div>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{provider.desc}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {provider.url && (
                    <a
                      href={provider.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 11, color: '#52525b', textDecoration: 'none',
                        padding: '3px 8px', borderRadius: 4,
                        border: '1px solid #27272a',
                        transition: 'color 150ms',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#52525b')}
                    >
                      Get API key
                    </a>
                  )}
                  {hasKey && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                      padding: '3px 8px', borderRadius: 4,
                      background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80',
                    }}>
                      ACTIVE
                    </span>
                  )}
                  {isDefault && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
                      padding: '3px 8px', borderRadius: 4,
                      background: 'rgba(76, 110, 245, 0.1)', color: '#818cf8',
                    }}>
                      DEFAULT
                    </span>
                  )}
                </div>
              </div>

              <input
                type="password"
                placeholder={provider.placeholder}
                value={apiKeys[provider.id] || ''}
                onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                style={st.input}
              />

              {provider.id === 'custom' && (
                <>
                  <input
                    type="text"
                    placeholder="Base URL (e.g. http://localhost:11434/v1)"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    style={{ ...st.input, marginTop: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {LOCAL_PROVIDERS.map((lp) => (
                      <button
                        key={lp.name}
                        onClick={() => setCustomBaseUrl(lp.defaultUrl)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 10px', borderRadius: 6,
                          border: '1px solid #27272a', background: '#09090b',
                          color: '#a1a1aa', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          transition: 'all 150ms',
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#d4d4d8'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#a1a1aa'; }}
                      >
                        {lp.name}
                        <span style={{ fontSize: 9, color: '#52525b' }}>{lp.defaultUrl.replace('http://localhost:', ':')}</span>
                      </button>
                    ))}
                    {/* Scan models button */}
                    <button
                      onClick={handleScanModels}
                      disabled={scanning || !customBaseUrl}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 6,
                        border: '1px solid #27272a',
                        background: scanning ? '#18181b' : 'linear-gradient(135deg, rgba(76,110,245,0.1), rgba(124,58,237,0.1))',
                        color: scanning ? '#52525b' : '#818cf8',
                        fontSize: 11, fontWeight: 600, cursor: scanning ? 'wait' : 'pointer',
                        transition: 'all 150ms',
                      }}
                    >
                      {scanning ? 'Scanning...' : 'Scan for Models'}
                    </button>
                  </div>
                </>
              )}

              {/* Action buttons row */}
              {(hasKey || provider.id === 'custom') && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => handleTest(provider.id)}
                    disabled={testing === provider.id}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: '1px solid #27272a',
                      background: testResult?.ok ? 'rgba(34, 197, 94, 0.08)' : '#09090b',
                      color: testing === provider.id ? '#52525b' : testResult?.ok ? '#4ade80' : testResult?.ok === false ? '#f87171' : '#a1a1aa',
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: testing === provider.id ? 'wait' : 'pointer',
                      transition: 'all 150ms',
                    }}
                  >
                    {testing === provider.id ? 'Testing...' : testResult?.ok ? 'Connected' : testResult?.ok === false ? 'Failed — Retry' : 'Test Connection'}
                  </button>

                  {!isDefault && (
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, defaultProviderId: provider.id }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid rgba(76, 110, 245, 0.2)',
                        background: 'rgba(76, 110, 245, 0.06)',
                        color: '#818cf8',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Set as default
                    </button>
                  )}

                  {providerModels.length > 0 && (
                    <button
                      onClick={() => setExpandedModels(isExpanded ? null : provider.id)}
                      style={{
                        marginLeft: 'auto',
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #27272a',
                        background: '#09090b',
                        color: '#a1a1aa',
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? 'Hide models' : `${providerModels.length} models`}
                    </button>
                  )}
                </div>
              )}

              {/* Test error */}
              {testResult?.ok === false && testResult.error && (
                <div style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(248, 113, 113, 0.06)',
                  border: '1px solid rgba(248, 113, 113, 0.1)',
                  fontSize: 11,
                  color: '#fca5a5',
                }}>
                  {testResult.error}
                </div>
              )}

              {/* Model selector */}
              {isExpanded && providerModels.length > 0 && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: '#09090b',
                  border: '1px solid #27272a',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#71717a', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    Select model
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {providerModels.map((model: any) => {
                      const isSelected = selectedModel === model.id || settings.defaultModelId === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSettings((prev) => ({ ...prev, defaultModelId: model.id }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: isSelected ? 'rgba(76, 110, 245, 0.1)' : 'transparent',
                            color: isSelected ? '#818cf8' : '#a1a1aa',
                            fontSize: 12,
                            fontWeight: isSelected ? 600 : 400,
                            cursor: 'pointer',
                            textAlign: 'left' as const,
                            transition: 'all 100ms',
                          }}
                        >
                          <span>{model.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {model.costPer1kInput != null && (
                              <span style={{ fontSize: 10, color: '#52525b' }}>
                                ${model.costPer1kInput}/1K in
                              </span>
                            )}
                            {isSelected && (
                              <span style={{ fontSize: 10, color: '#4ade80' }}>Selected</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrivacyTab({ settings, setSettings }: {
  settings: DraftlySettings;
  setSettings: React.Dispatch<React.SetStateAction<DraftlySettings>>;
}) {
  const updatePrivacy = (partial: Partial<DraftlySettings['privacy']>) => {
    setSettings((prev) => ({ ...prev, privacy: { ...prev.privacy, ...partial } }));
  };

  return (
    <div>
      <h1 style={st.heading}>Privacy & Security</h1>
      <p style={st.desc}>Control what data is sent and how sensitive information is handled.</p>

      <Section title="PII Redaction" subtitle="Strip sensitive data from text before it reaches any AI provider.">
        <Toggle label="Enable redaction pipeline" checked={settings.privacy.enabled} onChange={(v) => updatePrivacy({ enabled: v })} />
        <Toggle label="Redact email addresses" checked={settings.privacy.redactEmails} onChange={(v) => updatePrivacy({ redactEmails: v })} />
        <Toggle label="Redact phone numbers" checked={settings.privacy.redactPhoneNumbers} onChange={(v) => updatePrivacy({ redactPhoneNumbers: v })} />
        <Toggle label="Redact credit card numbers" checked={settings.privacy.redactCreditCards} onChange={(v) => updatePrivacy({ redactCreditCards: v })} />
        <Toggle label="Redact Social Security numbers" checked={settings.privacy.redactSSN} onChange={(v) => updatePrivacy({ redactSSN: v })} />
      </Section>

      <Section title="Tab Context" subtitle="Let Draftly read open tabs for better AI responses. Sensitive sites are always excluded.">
        <Toggle label="Enable tab context" checked={settings.privacy.tabContextEnabled} onChange={(v) => updatePrivacy({ tabContextEnabled: v })} />
        <Toggle label="Always ask before reading tabs" checked={settings.privacy.tabContextRequiresConsent} onChange={(v) => updatePrivacy({ tabContextRequiresConsent: v })} />
      </Section>

      <Section title="Audit Log" subtitle="Keep a local record of every AI request for transparency.">
        <Toggle label="Enable audit log" checked={settings.privacy.auditLogEnabled} onChange={(v) => updatePrivacy({ auditLogEnabled: v })} />
      </Section>
    </div>
  );
}

function PromptsTab() {
  const actions = ['Fix', 'Rewrite', 'Sharpen', 'Shorten', 'Expand', 'Professional', 'Friendly', 'Persuasive', 'Simplify', 'Reply', 'Summarise'];

  return (
    <div>
      <h1 style={st.heading}>Prompt Templates</h1>
      <p style={st.desc}>Built-in prompts for each writing action. Custom prompt editor coming soon.</p>

      <div style={st.card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {actions.map((a) => (
            <span key={a} style={{
              padding: '5px 12px',
              borderRadius: 6,
              background: '#27272a',
              color: '#a1a1aa',
              fontSize: 12,
              fontWeight: 500,
            }}>
              /{a.toLowerCase()}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#52525b', marginTop: 16, lineHeight: 1.6 }}>
          Each action uses a carefully tuned prompt template. You can also type any custom instruction
          in the command box. Editable templates are planned for the next release.
        </p>
      </div>
    </div>
  );
}

function GeneralTab({ settings, setSettings }: {
  settings: DraftlySettings;
  setSettings: React.Dispatch<React.SetStateAction<DraftlySettings>>;
}) {
  return (
    <div>
      <h1 style={st.heading}>General</h1>
      <p style={st.desc}>Interface preferences and data management.</p>

      <Section title="Interface">
        <Toggle label="Show floating button on text selection" checked={settings.showFloatingButton} onChange={(v) => setSettings((prev) => ({ ...prev, showFloatingButton: v }))} />
        <Toggle label="Show context menu item" checked={settings.showContextMenu} onChange={(v) => setSettings((prev) => ({ ...prev, showContextMenu: v }))} />
      </Section>

      <Section title="Keyboard Shortcut">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <kbd style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: '#27272a',
            border: '1px solid #3f3f46',
            color: '#d4d4d8',
            fontSize: 13,
            fontFamily: "'Inter', monospace",
            fontWeight: 500,
          }}>
            {navigator.platform.includes('Mac') ? '⌘⇧D' : 'Ctrl+Shift+D'}
          </kbd>
          <span style={{ fontSize: 12, color: '#52525b' }}>
            Change at <span style={{ color: '#818cf8' }}>chrome://extensions/shortcuts</span>
          </span>
        </div>
      </Section>

      <Section title="Data">
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {
            const data = JSON.stringify(settings, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'draftly-settings.json'; a.click();
            URL.revokeObjectURL(url);
          }} style={st.secondaryBtn}>
            Export settings
          </button>
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              try { setSettings(JSON.parse(await file.text())); } catch {}
            };
            input.click();
          }} style={st.secondaryBtn}>
            Import settings
          </button>
        </div>
      </Section>
    </div>
  );
}

// ---- Components ----

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={st.card}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 11, color: '#52525b', marginTop: 2, lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 13, color: '#d4d4d8' }}>{label}</span>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? '#4c6ef5' : '#3f3f46',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 150ms',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          background: 'white',
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          transition: 'left 150ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </label>
  );
}

// ---- Styles ----

const st: Record<string, React.CSSProperties> = {
  heading: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 28,
    lineHeight: 1.6,
  },
  card: {
    background: '#18181b',
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
    border: '1px solid rgba(255,255,255,0.04)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid #27272a',
    background: '#09090b',
    color: '#e4e4e7',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 150ms, box-shadow 150ms',
  },
  secondaryBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #27272a',
    background: '#18181b',
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms',
  },
};
