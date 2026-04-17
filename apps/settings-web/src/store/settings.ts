import { create } from 'zustand';
import type { DraftlySettings, ProviderState } from '@draftly/shared';
import { DEFAULT_SETTINGS } from '@draftly/shared';

interface SettingsStore {
  settings: DraftlySettings;
  loaded: boolean;
  apiKeys: Record<string, string>;

  load: () => Promise<void>;
  save: () => Promise<void>;
  updateSettings: (partial: Partial<DraftlySettings>) => void;
  setApiKey: (providerId: string, key: string) => void;
  removeApiKey: (providerId: string) => void;
  setDefaultProvider: (providerId: string, modelId?: string) => void;
}

const isChromeExtension =
  typeof chrome !== 'undefined' && !!chrome.storage;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  apiKeys: {},

  load: async () => {
    if (isChromeExtension) {
      const data = await chrome.storage.sync.get('draftly_settings');
      const settings = { ...DEFAULT_SETTINGS, ...(data.draftly_settings || {}) };

      // Load API keys
      const providerIds = ['anthropic', 'openai', 'gemini', 'openrouter', 'custom'];
      const keyData = await chrome.storage.local.get(
        providerIds.map((id) => `draftly_key_${id}`),
      );
      const apiKeys: Record<string, string> = {};
      for (const id of providerIds) {
        apiKeys[id] = keyData[`draftly_key_${id}`] || '';
      }

      set({ settings, loaded: true, apiKeys });
    } else {
      // Fallback for standalone web usage
      const stored = localStorage.getItem('draftly_settings');
      const settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
      const apiKeys = JSON.parse(localStorage.getItem('draftly_api_keys') || '{}');
      set({ settings, loaded: true, apiKeys });
    }
  },

  save: async () => {
    const { settings, apiKeys } = get();

    if (isChromeExtension) {
      await chrome.storage.sync.set({ draftly_settings: settings });
      for (const [id, key] of Object.entries(apiKeys)) {
        if (key) await chrome.storage.local.set({ [`draftly_key_${id}`]: key });
        else await chrome.storage.local.remove(`draftly_key_${id}`);
      }
    } else {
      localStorage.setItem('draftly_settings', JSON.stringify(settings));
      localStorage.setItem('draftly_api_keys', JSON.stringify(apiKeys));
    }
  },

  updateSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  setApiKey: (providerId, key) => {
    set((state) => ({
      apiKeys: { ...state.apiKeys, [providerId]: key },
    }));
  },

  removeApiKey: (providerId) => {
    set((state) => {
      const { [providerId]: _, ...rest } = state.apiKeys;
      return { apiKeys: rest };
    });
  },

  setDefaultProvider: (providerId, modelId) => {
    set((state) => ({
      settings: {
        ...state.settings,
        defaultProviderId: providerId,
        ...(modelId ? { defaultModelId: modelId } : {}),
      },
    }));
  },
}));
