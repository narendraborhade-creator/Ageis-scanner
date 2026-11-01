import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../../../server';

describe('isAllowedUrl SSRF Protection', () => {
  it('allows valid external HTTP and HTTPS URLs', () => {
    expect(isAllowedUrl('https://example.com')).toBe(true);
    expect(isAllowedUrl('https://google.com/search?q=test')).toBe(true);
    expect(isAllowedUrl('http://cloudflare.com')).toBe(true);
    expect(isAllowedUrl('https://sub.domain.org/path#hash')).toBe(true);
  });

  it('blocks loopback and localhost addresses', () => {
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('http://localhost')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:5005')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
    expect(isAllowedUrl('http://0.0.0.0:80')).toBe(false);
    expect(isAllowedUrl('http://[::1]:8080')).toBe(false);
  });

  it('blocks private IP ranges (RFC 1918)', () => {
    expect(isAllowedUrl('http://10.0.0.1/admin')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1/router')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.20.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
  });

  it('blocks cloud metadata endpoint (169.254.169.254)', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  it('blocks .local internal domains', () => {
    expect(isAllowedUrl('http://gateway.local')).toBe(false);
  });

  it('rejects malformed and non-HTTP protocols', () => {
    expect(isAllowedUrl('malformed:foo')).toBe(false);
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('data:text/html,<h1>XSS</h1>')).toBe(false);
    expect(isAllowedUrl('not-a-valid-url')).toBe(false);
  });
});
