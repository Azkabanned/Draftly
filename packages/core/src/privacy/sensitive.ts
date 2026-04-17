import { isDomainSensitive, isUrlSensitive } from '@draftly/shared';
import type { PrivacySettings } from '@draftly/shared';

export interface SensitivityCheck {
  isSensitive: boolean;
  reasons: string[];
}

/**
 * Check whether a URL / domain should be treated as sensitive.
 */
export function checkSensitivity(
  url: string,
  settings: PrivacySettings,
): SensitivityCheck {
  const reasons: string[] = [];

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    if (isDomainSensitive(domain, settings.customBlocklist, settings.customAllowlist)) {
      reasons.push(`Domain "${domain}" is in the sensitive blocklist`);
    }

    if (isUrlSensitive(url)) {
      reasons.push('URL pattern matches a sensitive page (login, payment, etc.)');
    }
  } catch {
    // If URL parsing fails, treat as potentially sensitive
    reasons.push('Unable to parse URL');
  }

  return {
    isSensitive: reasons.length > 0,
    reasons,
  };
}

/**
 * Filter a list of tab URLs, removing sensitive ones.
 */
export function filterSensitiveTabs<T extends { url: string }>(
  tabs: T[],
  settings: PrivacySettings,
): { allowed: T[]; blocked: { tab: T; reasons: string[] }[] } {
  const allowed: T[] = [];
  const blocked: { tab: T; reasons: string[] }[] = [];

  for (const tab of tabs) {
    const check = checkSensitivity(tab.url, settings);
    if (check.isSensitive) {
      blocked.push({ tab, reasons: check.reasons });
    } else {
      allowed.push(tab);
    }
  }

  return { allowed, blocked };
}
