import type { ConsentRecord, SitePermission } from '@draftly/shared';

const CONSENT_STORAGE_KEY = 'draftly_consent_records';
const SITE_PERMISSIONS_KEY = 'draftly_site_permissions';

/**
 * Manage user consent records for privacy transparency.
 */
export class ConsentManager {
  private records: ConsentRecord[] = [];
  private sitePermissions: Map<string, SitePermission> = new Map();

  async load(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const data = await chrome.storage.local.get([CONSENT_STORAGE_KEY, SITE_PERMISSIONS_KEY]);
      this.records = data[CONSENT_STORAGE_KEY] || [];
      const perms: SitePermission[] = data[SITE_PERMISSIONS_KEY] || [];
      this.sitePermissions = new Map(perms.map((p) => [p.domain, p]));
    }
  }

  async save(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        [CONSENT_STORAGE_KEY]: this.records.slice(-500), // Keep last 500
        [SITE_PERMISSIONS_KEY]: Array.from(this.sitePermissions.values()),
      });
    }
  }

  recordConsent(
    type: ConsentRecord['type'],
    description: string,
    granted: boolean,
    domain?: string,
  ): ConsentRecord {
    const record: ConsentRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      description,
      granted,
      domain,
    };
    this.records.push(record);
    this.save(); // Fire and forget
    return record;
  }

  getRecords(limit = 50): ConsentRecord[] {
    return this.records.slice(-limit).reverse();
  }

  // Site permissions

  getSitePermission(domain: string): SitePermission | undefined {
    return this.sitePermissions.get(normalise(domain));
  }

  setSitePermission(domain: string, allowed: boolean, tabContextAllowed: boolean): void {
    const norm = normalise(domain);
    this.sitePermissions.set(norm, {
      domain: norm,
      allowed,
      tabContextAllowed,
      lastUsed: Date.now(),
    });
    this.save();
  }

  removeSitePermission(domain: string): void {
    this.sitePermissions.delete(normalise(domain));
    this.save();
  }

  getAllSitePermissions(): SitePermission[] {
    return Array.from(this.sitePermissions.values());
  }

  isSiteAllowed(domain: string): boolean {
    const perm = this.getSitePermission(domain);
    return perm?.allowed ?? true; // Default to allowed unless explicitly blocked
  }

  isTabContextAllowed(domain: string): boolean {
    const perm = this.getSitePermission(domain);
    return perm?.tabContextAllowed ?? false; // Default to not allowed
  }
}

function normalise(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, '');
}
