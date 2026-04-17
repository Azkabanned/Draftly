/** Domains that should be blocked from tab context collection by default. */
export const SENSITIVE_DOMAINS: string[] = [
  // Banking & Finance
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'citi.com',
  'usbank.com',
  'capitalone.com',
  'discover.com',
  'americanexpress.com',
  'schwab.com',
  'fidelity.com',
  'vanguard.com',
  'etrade.com',
  'tdameritrade.com',
  'robinhood.com',
  'coinbase.com',
  'binance.com',
  'kraken.com',
  'paypal.com',
  'venmo.com',
  'zelle.com',
  'wise.com',
  'revolut.com',
  'monzo.com',
  'starlingbank.com',
  'hsbc.com',
  'barclays.co.uk',
  'lloydsbank.com',
  'natwest.com',
  'commbank.com.au',
  'westpac.com.au',
  'anz.com.au',
  'nab.com.au',

  // Password Managers
  '1password.com',
  'bitwarden.com',
  'lastpass.com',
  'dashlane.com',
  'keepersecurity.com',
  'vault.zoho.com',

  // Healthcare
  'mychart.com',
  'patient.myquest.com',
  'uhc.com',
  'anthem.com',
  'cigna.com',
  'aetna.com',
  'kaiser.com',

  // Government
  'irs.gov',
  'ssa.gov',
  'healthcare.gov',
  'login.gov',
  'id.me',
  'dmv.ca.gov',
  'gov.uk',
  'myGov.gov.au',

  // Auth & Identity
  'accounts.google.com',
  'login.microsoftonline.com',
  'login.live.com',
  'appleid.apple.com',
  'auth0.com',
  'okta.com',
  'onelogin.com',

  // Payment
  'stripe.com',
  'square.com',
  'braintreepayments.com',
  'checkout.shopify.com',
  'pay.google.com',

  // Email (login pages)
  'mail.google.com/mail/u/0/#settings',

  // Sensitive SaaS
  'app.gusto.com',
  'app.rippling.com',
  'workday.com',
  'adp.com',
];

/** URL patterns that suggest authentication / sensitive pages. */
export const SENSITIVE_URL_PATTERNS: RegExp[] = [
  /\/login/i,
  /\/signin/i,
  /\/sign-in/i,
  /\/auth/i,
  /\/oauth/i,
  /\/sso/i,
  /\/password/i,
  /\/reset-password/i,
  /\/2fa/i,
  /\/mfa/i,
  /\/checkout/i,
  /\/payment/i,
  /\/billing/i,
  /\/account\/security/i,
  /\/settings\/security/i,
];

export function isDomainSensitive(
  domain: string,
  customBlocklist: string[] = [],
  customAllowlist: string[] = [],
): boolean {
  const normalised = domain.toLowerCase().replace(/^www\./, '');

  if (customAllowlist.some((d) => normalised === d || normalised.endsWith(`.${d}`))) {
    return false;
  }

  if (customBlocklist.some((d) => normalised === d || normalised.endsWith(`.${d}`))) {
    return true;
  }

  return SENSITIVE_DOMAINS.some((d) => normalised === d || normalised.endsWith(`.${d}`));
}

export function isUrlSensitive(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some((p) => p.test(url));
}
