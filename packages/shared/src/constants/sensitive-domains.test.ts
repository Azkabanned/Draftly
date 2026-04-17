import { describe, it, expect } from 'vitest';
import { isDomainSensitive, isUrlSensitive } from './sensitive-domains';

describe('isDomainSensitive', () => {
  it('detects known banking domains', () => {
    expect(isDomainSensitive('chase.com')).toBe(true);
    expect(isDomainSensitive('www.chase.com')).toBe(true);
    expect(isDomainSensitive('bankofamerica.com')).toBe(true);
  });

  it('detects password managers', () => {
    expect(isDomainSensitive('1password.com')).toBe(true);
    expect(isDomainSensitive('bitwarden.com')).toBe(true);
  });

  it('allows normal domains', () => {
    expect(isDomainSensitive('google.com')).toBe(false);
    expect(isDomainSensitive('github.com')).toBe(false);
    expect(isDomainSensitive('example.com')).toBe(false);
  });

  it('respects custom blocklist', () => {
    expect(isDomainSensitive('internal.company.com', ['internal.company.com'])).toBe(true);
  });

  it('respects custom allowlist', () => {
    expect(isDomainSensitive('chase.com', [], ['chase.com'])).toBe(false);
  });

  it('allowlist takes priority over blocklist', () => {
    expect(isDomainSensitive('example.com', ['example.com'], ['example.com'])).toBe(false);
  });
});

describe('isUrlSensitive', () => {
  it('detects login pages', () => {
    expect(isUrlSensitive('https://example.com/login')).toBe(true);
    expect(isUrlSensitive('https://example.com/signin')).toBe(true);
    expect(isUrlSensitive('https://example.com/sign-in')).toBe(true);
  });

  it('detects payment pages', () => {
    expect(isUrlSensitive('https://example.com/checkout')).toBe(true);
    expect(isUrlSensitive('https://example.com/payment')).toBe(true);
  });

  it('allows normal pages', () => {
    expect(isUrlSensitive('https://example.com/blog/post')).toBe(false);
    expect(isUrlSensitive('https://example.com/')).toBe(false);
  });
});
