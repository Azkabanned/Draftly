import type { RedactionPattern, PrivacySettings } from '@draftly/shared';

/** Built-in redaction patterns for common PII. */
const BUILTIN_PATTERNS: RedactionPattern[] = [
  {
    id: 'email',
    name: 'Email addresses',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    replacement: '[EMAIL_REDACTED]',
    enabled: false,
  },
  {
    id: 'phone-us',
    name: 'US phone numbers',
    pattern: '(?:\\+?1[-\\s.]?)?\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}',
    replacement: '[PHONE_REDACTED]',
    enabled: false,
  },
  {
    id: 'phone-intl',
    name: 'International phone numbers',
    pattern: '\\+\\d{1,3}[-\\s.]?\\d{1,4}[-\\s.]?\\d{1,4}[-\\s.]?\\d{1,9}',
    replacement: '[PHONE_REDACTED]',
    enabled: false,
  },
  {
    id: 'credit-card',
    name: 'Credit card numbers',
    pattern: '\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b',
    replacement: '[CARD_REDACTED]',
    enabled: true,
  },
  {
    id: 'ssn',
    name: 'US Social Security numbers',
    pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
    replacement: '[SSN_REDACTED]',
    enabled: true,
  },
  {
    id: 'ip-address',
    name: 'IP addresses',
    pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b',
    replacement: '[IP_REDACTED]',
    enabled: false,
  },
  {
    id: 'api-key',
    name: 'API keys (common formats)',
    pattern: '(?:sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{20,}',
    replacement: '[KEY_REDACTED]',
    enabled: false,
  },
];

export interface RedactionResult {
  text: string;
  redactions: { pattern: string; count: number; replacement: string }[];
  totalRedactions: number;
}

/**
 * Apply PII redaction to text based on privacy settings.
 */
export function redactText(text: string, settings: PrivacySettings): RedactionResult {
  if (!settings.enabled) {
    return { text, redactions: [], totalRedactions: 0 };
  }

  const activePatterns = getActivePatterns(settings);
  let result = text;
  const redactions: { pattern: string; count: number; replacement: string }[] = [];
  let total = 0;

  for (const pattern of activePatterns) {
    try {
      const regex = new RegExp(pattern.pattern, 'g');
      const matches = result.match(regex);
      if (matches && matches.length > 0) {
        result = result.replace(regex, pattern.replacement);
        redactions.push({
          pattern: pattern.name,
          count: matches.length,
          replacement: pattern.replacement,
        });
        total += matches.length;
      }
    } catch {
      // Skip invalid regex patterns
    }
  }

  return { text: result, redactions, totalRedactions: total };
}

function getActivePatterns(settings: PrivacySettings): RedactionPattern[] {
  const patterns: RedactionPattern[] = [];

  // Check individual toggle overrides for built-in patterns
  for (const bp of BUILTIN_PATTERNS) {
    let enabled = bp.enabled;

    if (bp.id === 'email') enabled = settings.redactEmails;
    else if (bp.id === 'phone-us' || bp.id === 'phone-intl') enabled = settings.redactPhoneNumbers;
    else if (bp.id === 'credit-card') enabled = settings.redactCreditCards;
    else if (bp.id === 'ssn') enabled = settings.redactSSN;

    if (enabled) patterns.push(bp);
  }

  // Add custom patterns
  for (const cp of settings.redactCustomPatterns) {
    if (cp.enabled) patterns.push(cp);
  }

  return patterns;
}

/** Get the built-in patterns for display in settings. */
export function getBuiltinPatterns(): RedactionPattern[] {
  return [...BUILTIN_PATTERNS];
}
