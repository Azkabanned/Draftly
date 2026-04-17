import type { ProviderState } from './provider';
import type { PrivacySettings, SitePermission } from './privacy';
import type { WritingStyle, PromptTemplate } from './prompt';

export interface DraftlySettings {
  version: number;
  providers: Record<string, ProviderState>;
  defaultProviderId: string;
  defaultModelId: string;
  privacy: PrivacySettings;
  sitePermissions: SitePermission[];
  customPrompts: PromptTemplate[];
  writingStyles: WritingStyle[];
  activeWritingStyleId?: string;
  favouriteActions: string[];
  keyboardShortcut: string;
  showFloatingButton: boolean;
  showContextMenu: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  localOnlyMode: boolean;
}

export const DEFAULT_SETTINGS: DraftlySettings = {
  version: 1,
  providers: {},
  defaultProviderId: '',
  defaultModelId: '',
  privacy: {
    enabled: true,
    redactEmails: false,
    redactPhoneNumbers: false,
    redactCreditCards: true,
    redactSSN: true,
    redactCustomPatterns: [],
    sensitiveDomainsBlocklist: [],
    customBlocklist: [],
    customAllowlist: [],
    privateMode: false,
    tabContextEnabled: false,
    tabContextRequiresConsent: true,
    auditLogEnabled: true,
    maxAuditLogEntries: 500,
  },
  sitePermissions: [],
  customPrompts: [],
  writingStyles: [],
  activeWritingStyleId: undefined,
  favouriteActions: ['fix', 'rewrite', 'sharpen', 'shorten'],
  keyboardShortcut: 'Ctrl+Shift+D',
  showFloatingButton: true,
  showContextMenu: true,
  theme: 'system',
  compactMode: false,
  localOnlyMode: false,
};
