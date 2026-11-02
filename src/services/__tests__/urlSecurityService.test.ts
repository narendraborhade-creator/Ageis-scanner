import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('isAllowedUrl', () => {
  it('allows safe public URLs', () => {
    expect(isAllowedUrl('https://google.com')).toBe(true);
    expect(isAllowedUrl('http://example.com/api?q=1')).toBe(true);
    expect(isAllowedUrl('https://cloudflare-dns.com/dns-query')).toBe(true);
  });

  it('rejects loopback and localhost addresses', () => {
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('https://localhost/admin')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:5005')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
  });

  it('rejects cloud metadata link-local addresses', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('rejects private IPv4 subnets (RFC 1918)', () => {
    expect(isAllowedUrl('http://10.0.0.1/status')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1/admin')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
  });

  it('rejects IPv6 loopback, unspecified, and local addresses', () => {
    expect(isAllowedUrl('http://[::1]:8080')).toBe(false);
    expect(isAllowedUrl('http://[::]')).toBe(false);
    expect(isAllowedUrl('http://[fe80::1]')).toBe(false);
    expect(isAllowedUrl('http://[fc00::1]')).toBe(false);
  });

  it('rejects IPv4-mapped IPv6 loopback and private addresses normalized by URL', () => {
    expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:169.254.169.254]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:10.0.0.1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:192.168.1.1]')).toBe(false);
  });

  it('rejects non-http/https schemes and malformed URLs', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('data:text/html,<h1>test</h1>')).toBe(false);
    expect(isAllowedUrl('not-a-valid-url')).toBe(false);
    expect(isAllowedUrl('')).toBe(false);
  });

  it('rejects .local internal domain names', () => {
    expect(isAllowedUrl('http://gateway.local/secret')).toBe(false);
  });
});
