export interface PrivacySettings {
  enabled: boolean;
  redactEmails: boolean;
  redactPhoneNumbers: boolean;
  redactCreditCards: boolean;
  redactSSN: boolean;
  redactCustomPatterns: RedactionPattern[];
  sensitiveDomainsBlocklist: string[];
  customBlocklist: string[];
  customAllowlist: string[];
  privateMode: boolean;
  tabContextEnabled: boolean;
  tabContextRequiresConsent: boolean;
  auditLogEnabled: boolean;
  maxAuditLogEntries: number;
}

export interface RedactionPattern {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
}

export interface ConsentRecord {
  id: string;
  timestamp: number;
  type: 'tab-context' | 'text-send' | 'provider-auth';
  description: string;
  granted: boolean;
  domain?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  selectedText: string;
  contextAttached: boolean;
  contextSources: string[];
  providerId: string;
  modelId: string;
  redactionsApplied: number;
  tokensSent: number;
  tokensReceived: number;
}

export interface SitePermission {
  domain: string;
  allowed: boolean;
  tabContextAllowed: boolean;
  lastUsed?: number;
}
