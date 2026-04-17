import { describe, it, expect } from 'vitest';
import { redactText } from './redactor';
import type { PrivacySettings } from '@draftly/shared';

const baseSettings: PrivacySettings = {
  enabled: true,
  redactEmails: true,
  redactPhoneNumbers: true,
  redactCreditCards: true,
  redactSSN: true,
  redactCustomPatterns: [],
  sensitiveDomainsBlocklist: [],
  customBlocklist: [],
  customAllowlist: [],
  privateMode: false,
  tabContextEnabled: false,
  tabContextRequiresConsent: true,
  auditLogEnabled: false,
  maxAuditLogEntries: 100,
};

describe('redactText', () => {
  it('redacts email addresses', () => {
    const result = redactText('Contact me at john@example.com please', baseSettings);
    expect(result.text).toBe('Contact me at [EMAIL_REDACTED] please');
    expect(result.totalRedactions).toBe(1);
  });

  it('redacts multiple emails', () => {
    const result = redactText('john@test.com and jane@test.com', baseSettings);
    expect(result.text).toBe('[EMAIL_REDACTED] and [EMAIL_REDACTED]');
    expect(result.totalRedactions).toBe(2);
  });

  it('redacts US phone numbers', () => {
    const result = redactText('Call me at (555) 123-4567 or 555-987-6543', baseSettings);
    expect(result.text).toContain('[PHONE_REDACTED]');
    expect(result.totalRedactions).toBeGreaterThanOrEqual(2);
  });

  it('redacts credit card numbers', () => {
    const result = redactText('Card: 4111 1111 1111 1111', baseSettings);
    expect(result.text).toContain('[CARD_REDACTED]');
    expect(result.totalRedactions).toBe(1);
  });

  it('redacts SSNs', () => {
    const result = redactText('SSN: 123-45-6789', baseSettings);
    expect(result.text).toContain('[SSN_REDACTED]');
    expect(result.totalRedactions).toBe(1);
  });

  it('does nothing when disabled', () => {
    const disabled = { ...baseSettings, enabled: false };
    const result = redactText('john@example.com', disabled);
    expect(result.text).toBe('john@example.com');
    expect(result.totalRedactions).toBe(0);
  });

  it('respects individual toggles', () => {
    const noEmail = { ...baseSettings, redactEmails: false };
    const result = redactText('john@example.com', noEmail);
    expect(result.text).toBe('john@example.com');
  });

  it('applies custom patterns', () => {
    const withCustom: PrivacySettings = {
      ...baseSettings,
      redactCustomPatterns: [
        {
          id: 'project-code',
          name: 'Project codes',
          pattern: 'PRJ-\\d{4}',
          replacement: '[PROJECT_REDACTED]',
          enabled: true,
        },
      ],
    };
    const result = redactText('Working on PRJ-1234 today', withCustom);
    expect(result.text).toBe('Working on [PROJECT_REDACTED] today');
  });

  it('handles text with no sensitive data', () => {
    const result = redactText('Just a normal sentence.', baseSettings);
    expect(result.text).toBe('Just a normal sentence.');
    expect(result.totalRedactions).toBe(0);
  });
});
