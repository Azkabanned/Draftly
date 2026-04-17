import React from 'react';
import { useSettingsStore } from '../store/settings';

export function PrivacyPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { privacy } = settings;

  const updatePrivacy = (partial: Partial<typeof privacy>) => {
    updateSettings({ privacy: { ...privacy, ...partial } });
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Privacy & Security</h1>
      <p className="mb-8 text-sm text-gray-500">
        Draftly is privacy-first. Control exactly what data is sent to AI providers and how
        sensitive information is handled.
      </p>

      {/* Redaction */}
      <section className="mb-6 rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">PII Redaction</h2>
        <p className="mb-4 text-xs text-gray-500">
          When enabled, Draftly will automatically strip sensitive data from text before sending
          it to AI providers.
        </p>

        <div className="space-y-3">
          <Toggle label="Enable redaction" checked={privacy.enabled} onChange={(v) => updatePrivacy({ enabled: v })} />
          <Toggle label="Redact email addresses" checked={privacy.redactEmails} onChange={(v) => updatePrivacy({ redactEmails: v })} />
          <Toggle label="Redact phone numbers" checked={privacy.redactPhoneNumbers} onChange={(v) => updatePrivacy({ redactPhoneNumbers: v })} />
          <Toggle label="Redact credit card numbers" checked={privacy.redactCreditCards} onChange={(v) => updatePrivacy({ redactCreditCards: v })} />
          <Toggle label="Redact Social Security numbers" checked={privacy.redactSSN} onChange={(v) => updatePrivacy({ redactSSN: v })} />
        </div>
      </section>

      {/* Tab Context */}
      <section className="mb-6 rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">Tab Context</h2>
        <p className="mb-4 text-xs text-gray-500">
          Allow Draftly to read content from your open browser tabs to provide better context for
          AI responses. Sensitive sites (banking, auth, healthcare) are always excluded.
        </p>

        <div className="space-y-3">
          <Toggle label="Enable tab context" checked={privacy.tabContextEnabled} onChange={(v) => updatePrivacy({ tabContextEnabled: v })} />
          <Toggle label="Always ask before reading tabs" checked={privacy.tabContextRequiresConsent} onChange={(v) => updatePrivacy({ tabContextRequiresConsent: v })} />
        </div>
      </section>

      {/* Audit */}
      <section className="rounded-lg border border-surface-dark-3 bg-surface-dark-1 p-4">
        <h2 className="mb-4 font-semibold">Audit Log</h2>
        <p className="mb-4 text-xs text-gray-500">
          Keep a local record of what text was sent, which provider was used, and what context
          was attached.
        </p>

        <Toggle label="Enable audit log" checked={privacy.auditLogEnabled} onChange={(v) => updatePrivacy({ auditLogEnabled: v })} />
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
