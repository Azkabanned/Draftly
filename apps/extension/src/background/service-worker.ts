import { registerAllProviders, getRegistry } from '@draftly/providers';
import { transformText, transformTextStream, redactText } from '@draftly/core';
import { gatherTabContexts, rankContextsByRelevance } from '@draftly/core';
import type { ActionId, PromptContext, AuditEntry, DraftlySettings } from '@draftly/shared';
import { DEFAULT_SETTINGS } from '@draftly/shared';

// Service worker accesses storage directly — NOT through the message-based store
async function loadSettings(): Promise<DraftlySettings> {
  const data = await chrome.storage.local.get('draftly_settings');
  return { ...DEFAULT_SETTINGS, ...(data.draftly_settings || {}) };
}

async function getApiKey(providerId: string): Promise<string | undefined> {
  const data = await chrome.storage.local.get(`draftly_key_${providerId}`);
  return data[`draftly_key_${providerId}`] || undefined;
}

// Initialise providers on startup
registerAllProviders();

// ---- Message handling ----

type MessageRequest =
  | { type: 'EXECUTE_ACTION'; action: ActionId; selectedText: string; customInstruction?: string; tabContextIds?: number[] }
  | { type: 'GET_MODELS' }
  | { type: 'VALIDATE_PROVIDER'; providerId: string }
  | { type: 'GET_TAB_LIST' }
  | { type: 'SAVE_SETTINGS'; settings: any }
  | { type: 'LOAD_SETTINGS' }
  | { type: 'STORE_API_KEY'; providerId: string; apiKey: string }
  | { type: 'GET_API_KEY'; providerId: string }
  | { type: 'REMOVE_API_KEY'; providerId: string }
  | { type: 'SCAN_MODELS'; baseUrl: string; apiKey?: string }
  | { type: 'ANALYZE_GRAMMAR'; text: string }
  | { type: 'PING' };

chrome.runtime.onMessage.addListener((message: MessageRequest, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message || 'Unknown error' });
  });
  return true; // Indicates async response
});

async function handleMessage(message: MessageRequest) {
  switch (message.type) {
    case 'PING':
      return { ok: true };

    case 'GET_MODELS':
      return handleGetModels();

    case 'VALIDATE_PROVIDER':
      return handleValidateProvider(message.providerId);

    case 'GET_TAB_LIST':
      return handleGetTabList();

    case 'SAVE_SETTINGS':
      return handleSaveSettings(message.settings);

    case 'LOAD_SETTINGS':
      return handleLoadSettings();

    case 'STORE_API_KEY':
      return handleStoreApiKey(message.providerId, message.apiKey);

    case 'GET_API_KEY':
      return handleGetApiKey(message.providerId);

    case 'REMOVE_API_KEY':
      return handleRemoveApiKey(message.providerId);

    case 'SCAN_MODELS':
      return handleScanModels(message.baseUrl, message.apiKey);

    case 'ANALYZE_GRAMMAR':
      return handleAnalyzeGrammar(message.text);

    case 'EXECUTE_ACTION':
      return handleExecuteAction(message);

    default:
      throw new Error(`Unknown message type`);
  }
}

// ---- Storage handlers (service worker always has chrome.storage access) ----

const SETTINGS_KEY = 'draftly_settings';

async function handleSaveSettings(settings: any) {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  return { ok: true };
}

async function handleLoadSettings() {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return { settings: data[SETTINGS_KEY] || null };
}

async function handleStoreApiKey(providerId: string, apiKey: string) {
  await chrome.storage.local.set({ [`draftly_key_${providerId}`]: apiKey });
  return { ok: true };
}

async function handleGetApiKey(providerId: string) {
  const data = await chrome.storage.local.get(`draftly_key_${providerId}`);
  return { apiKey: data[`draftly_key_${providerId}`] || null };
}

async function handleRemoveApiKey(providerId: string) {
  await chrome.storage.local.remove(`draftly_key_${providerId}`);
  return { ok: true };
}

/** Scan an OpenAI-compatible endpoint for available models. */
async function handleScanModels(baseUrl: string, apiKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  // Normalise URL: strip trailing slash, try /models and /v1/models
  const base = baseUrl.replace(/\/+$/, '');
  const urls = [
    `${base}/models`,
    base.endsWith('/v1') ? `${base}/models` : `${base}/v1/models`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      if (!resp.ok) continue;
      const data = await resp.json();

      // OpenAI format: { data: [{ id, ... }] }
      const modelList = data.data || data.models || [];
      const models = modelList.map((m: any) => ({
        id: m.id || m.name || m.model,
        name: m.id || m.name || m.model,
        provider: 'custom',
        maxTokens: m.max_tokens || 4096,
        contextWindow: m.context_length || m.context_window || 8192,
        supportsStreaming: true,
      }));

      return { ok: true, models, endpoint: url };
    } catch {
      // Try next URL
    }
  }

  // Try Ollama-specific /api/tags endpoint
  try {
    const ollamaBase = base.replace(/\/v1$/, '');
    const resp = await fetch(`${ollamaBase}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      const models = (data.models || []).map((m: any) => ({
        id: m.name || m.model,
        name: m.name || m.model,
        provider: 'custom',
        maxTokens: 4096,
        contextWindow: m.context_length || 8192,
        supportsStreaming: true,
        size: m.size,
      }));
      return { ok: true, models, endpoint: `${ollamaBase}/api/tags` };
    }
  } catch {}

  return { ok: false, error: `Could not reach ${baseUrl}. Make sure the server is running.`, models: [] };
}

// ---- Grammar analysis ----

const GRAMMAR_PROMPT = `Check this text for errors. Return JSON only.

Example — for text "He dont like it":
{"errors":[{"start":3,"end":7,"type":"grammar","message":"should be doesn't","suggestion":"doesn't"}]}

If no errors found, return: {"errors":[]}

Rules: start/end are 0-indexed character positions. Types: spelling, grammar, style.
Do NOT explain. Do NOT wrap in markdown. Return ONLY the JSON object.

Text:
`;

async function handleAnalyzeGrammar(text: string) {
  const settings = await loadSettings();
  const registry = getRegistry();

  const providerId = settings.defaultProviderId || 'custom';
  const provider = registry.get(providerId);
  if (!provider) return { errors: [] };

  const apiKey = await getApiKey(providerId);
  const providerConfig = settings.providers[providerId]?.config || {};
  provider.configure({ ...providerConfig, ...(apiKey ? { apiKey } : {}) });

  const modelId = settings.defaultModelId || provider.listModels()[0]?.id;
  if (!modelId) return { errors: [] };

  try {
    const response = await provider.complete({
      model: modelId,
      messages: [{ role: 'user', content: GRAMMAR_PROMPT + text }],
      systemPrompt: 'Return only valid JSON. No explanation, no markdown, no code fences.',
      temperature: 0.1,
      maxTokens: 1500,
    });

    console.log('[Draftly Grammar] Raw response:', response.content.slice(0, 300));

    // Extract JSON from response — handle many model output styles
    let jsonStr = response.content.trim();

    // Strip markdown code fences
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    // Find the first { ... } block in the response
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    const errors = (parsed.errors || []).filter(
      (e: any) =>
        typeof e.start === 'number' &&
        typeof e.end === 'number' &&
        e.start >= 0 &&
        e.end > e.start &&
        e.end <= text.length + 5 && // small tolerance
        e.suggestion,
    );

    console.log('[Draftly Grammar] Found', errors.length, 'errors');
    return { errors };
  } catch (err: any) {
    console.warn('[Draftly Grammar] Failed:', err.message);
    return { errors: [] };
  }
}

// ---- Provider/model handlers ----

async function handleGetModels() {
  const settings = await loadSettings();
  const registry = getRegistry();
  const result: { providerId: string; providerName: string; models: any[] }[] = [];

  for (const provider of registry.getAll()) {
    // Configure with stored API key
    const apiKey = await getApiKey(provider.id);
    if (apiKey) {
      const config = settings.providers[provider.id]?.config || {};
      provider.configure({ ...config, apiKey });
    }

    result.push({
      providerId: provider.id,
      providerName: provider.name,
      models: provider.listModels(),
    });
  }

  return {
    providers: result,
    defaultProviderId: settings.defaultProviderId,
    defaultModelId: settings.defaultModelId,
  };
}

async function handleValidateProvider(providerId: string) {
  const registry = getRegistry();
  const provider = registry.get(providerId);
  if (!provider) return { valid: false, error: 'Provider not found' };

  const apiKey = await getApiKey(providerId);
  if (!apiKey) return { valid: false, error: 'No API key configured' };

  provider.configure({ apiKey });
  const valid = await provider.validateConnection();
  return { valid };
}

async function handleGetTabList() {
  const settings = await loadSettings();
  const { listOpenTabs } = await import('@draftly/core');
  const tabs = await listOpenTabs(settings.privacy);
  return { tabs };
}

async function handleExecuteAction(message: {
  action: ActionId;
  selectedText: string;
  customInstruction?: string;
  tabContextIds?: number[];
}) {
  const settings = await loadSettings();
  const registry = getRegistry();

  // Determine provider and model
  const providerId = settings.defaultProviderId || 'anthropic';
  const provider = registry.get(providerId);
  if (!provider) throw new Error(`Provider "${providerId}" not found`);

  const apiKey = await getApiKey(providerId);

  // API key is required for cloud providers, optional for custom/local
  if (!apiKey && providerId !== 'custom') {
    throw new Error(`No API key configured for ${provider.name}. Open Draftly settings to add one.`);
  }

  const providerConfig = settings.providers[providerId]?.config || {};
  provider.configure({ ...providerConfig, ...(apiKey ? { apiKey } : {}) });

  const modelId =
    settings.defaultModelId ||
    settings.providers[providerId]?.selectedModel ||
    provider.listModels()[0]?.id;

  if (!modelId) throw new Error('No model selected');

  // Apply redaction if enabled
  let textToSend = message.selectedText;
  let redactionCount = 0;
  if (settings.privacy.enabled && !settings.privacy.privateMode) {
    const redacted = redactText(message.selectedText, settings.privacy);
    textToSend = redacted.text;
    redactionCount = redacted.totalRedactions;
  }

  // Build context
  const context: PromptContext = {
    selectedText: textToSend,
    customInstruction: message.customInstruction,
  };

  // Gather tab context if enabled and tabs are specified
  if (
    settings.privacy.tabContextEnabled &&
    message.tabContextIds &&
    message.tabContextIds.length > 0
  ) {
    const tabContexts = await gatherTabContexts(settings.privacy, message.tabContextIds);
    context.tabContexts = rankContextsByRelevance(
      tabContexts,
      textToSend,
      message.customInstruction,
    );
  }

  // Execute
  const result = await transformText({
    action: message.action,
    context,
    provider,
    model: modelId,
  });

  // Audit log
  if (settings.privacy.auditLogEnabled) {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: message.action,
      selectedText: message.selectedText.slice(0, 200),
      contextAttached: (context.tabContexts?.length || 0) > 0,
      contextSources: context.tabContexts?.map((t) => t.url) || [],
      providerId,
      modelId,
      redactionsApplied: redactionCount,
      tokensSent: result.usage?.inputTokens || 0,
      tokensReceived: result.usage?.outputTokens || 0,
    };
    await appendAuditEntry(entry);
  }

  return { result };
}

async function appendAuditEntry(entry: AuditEntry) {
  const data = await chrome.storage.local.get('draftly_audit_log');
  const log: AuditEntry[] = data.draftly_audit_log || [];
  log.push(entry);
  // Keep only the last N entries
  const maxEntries = 500;
  const trimmed = log.slice(-maxEntries);
  await chrome.storage.local.set({ draftly_audit_log: trimmed });
}

// ---- Context menu ----

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'draftly-rewrite',
    title: 'Rewrite with Draftly',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'draftly-rewrite' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'OPEN_COMMAND_BOX',
      selectedText: info.selectionText || '',
    });
  }
});

// ---- Keyboard shortcut ----

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-draftly') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_DRAFTLY' });
      }
    });
  }
});
