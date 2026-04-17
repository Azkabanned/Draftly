import type { DraftlySettings } from '@draftly/shared';
import { DEFAULT_SETTINGS } from '@draftly/shared';

const SETTINGS_KEY = 'draftly_settings';

function hasDirectStorage(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.storage?.local;
  } catch { return false; }
}

function hasRuntime(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome?.runtime?.sendMessage;
  } catch { return false; }
}

function msg(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (resp) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(resp);
    });
  });
}

function readLocal(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeLocal(key: string, value: any): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ---- Settings ----

export async function loadSettings(): Promise<DraftlySettings> {
  // Try all sources and take the first one that has real data
  // (i.e. has a 'version' field which all saved settings have)

  // 1. Direct chrome.storage.local
  if (hasDirectStorage()) {
    try {
      const data = await chrome.storage.local.get(SETTINGS_KEY);
      if (data[SETTINGS_KEY]?.version) {
        return { ...DEFAULT_SETTINGS, ...data[SETTINGS_KEY] };
      }
    } catch {}
  }

  // 2. Service worker via message
  if (hasRuntime()) {
    try {
      const resp = await msg({ type: 'LOAD_SETTINGS' });
      if (resp?.settings?.version) {
        return { ...DEFAULT_SETTINGS, ...resp.settings };
      }
    } catch {}
  }

  // 3. localStorage
  const local = readLocal(SETTINGS_KEY);
  if (local?.version) {
    return { ...DEFAULT_SETTINGS, ...local };
  }

  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: DraftlySettings): Promise<void> {
  // Always write to localStorage first — it's synchronous and reliable
  writeLocal(SETTINGS_KEY, settings);

  // Then try chrome storage
  if (hasDirectStorage()) {
    try {
      await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
      return; // success
    } catch {}
  }

  if (hasRuntime()) {
    try {
      const resp = await msg({ type: 'SAVE_SETTINGS', settings });
      if (resp?.ok) return;
    } catch {}
  }
}

// ---- API Keys ----

export async function storeApiKey(providerId: string, apiKey: string): Promise<void> {
  const key = `draftly_key_${providerId}`;
  writeLocal(key, apiKey);

  if (hasDirectStorage()) {
    try { await chrome.storage.local.set({ [key]: apiKey }); return; } catch {}
  }
  if (hasRuntime()) {
    try { await msg({ type: 'STORE_API_KEY', providerId, apiKey }); } catch {}
  }
}

export async function getApiKey(providerId: string): Promise<string | undefined> {
  const key = `draftly_key_${providerId}`;

  if (hasDirectStorage()) {
    try {
      const data = await chrome.storage.local.get(key);
      if (data[key]) return data[key];
    } catch {}
  }

  if (hasRuntime()) {
    try {
      const resp = await msg({ type: 'GET_API_KEY', providerId });
      if (resp?.apiKey) return resp.apiKey;
    } catch {}
  }

  // localStorage stores the JSON-encoded string
  const local = readLocal(key);
  return local || undefined;
}

export async function removeApiKey(providerId: string): Promise<void> {
  const key = `draftly_key_${providerId}`;
  try { localStorage.removeItem(key); } catch {}

  if (hasDirectStorage()) {
    try { await chrome.storage.local.remove(key); } catch {}
  }
  if (hasRuntime()) {
    try { await msg({ type: 'REMOVE_API_KEY', providerId }); } catch {}
  }
}
