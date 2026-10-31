import { describe, it, expect } from 'vitest';

import { isAllowedUrl } from '../urlValidation';

describe('isAllowedUrl - SSRF Protection', () => {
  it('allows valid external public URLs', () => {
    expect(isAllowedUrl('https://example.com')).toBe(true);
    expect(isAllowedUrl('https://github.com/narendraborhade-creator')).toBe(true);
    expect(isAllowedUrl('https://cloudflare.com')).toBe(true);
  });

  it('blocks localhost and loopback IPv4 addresses', () => {
    expect(isAllowedUrl('http://localhost')).toBe(false);
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:5005')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
  });

  it('blocks cloud metadata IP (169.254.169.254)', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('blocks private IPv4 networks (RFC 1918)', () => {
    expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://10.255.255.255')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
    expect(isAllowedUrl('http://192.168.0.254')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
  });

  it('allows public 172.x IPs outside RFC 1918 range', () => {
    expect(isAllowedUrl('http://172.15.0.1')).toBe(true);
    expect(isAllowedUrl('http://172.32.0.1')).toBe(true);
  });

  it('blocks 0.0.0.0 and IPv6 loopback', () => {
    expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
    expect(isAllowedUrl('http://[::1]')).toBe(false);
  });

  it('blocks .local mDNS domains', () => {
    expect(isAllowedUrl('http://gateway.local')).toBe(false);
    expect(isAllowedUrl('http://printer.local:8080')).toBe(false);
  });

  it('rejects malformed or invalid URLs', () => {
    expect(isAllowedUrl('not-a-url')).toBe(false);
    expect(isAllowedUrl('')).toBe(false);
  });
});
