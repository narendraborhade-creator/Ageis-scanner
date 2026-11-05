import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('isAllowedUrl SSRF Protection', () => {
  it('allows safe public URLs', () => {
    expect(isAllowedUrl('https://example.com')).toBe(true);
    expect(isAllowedUrl('https://google.com/search?q=test')).toBe(true);
    expect(isAllowedUrl('http://github.com')).toBe(true);
    expect(isAllowedUrl('https://8.8.8.8')).toBe(true);
  });

  it('blocks loopback and private IPv4 addresses', () => {
    expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:8080/admin')).toBe(false);
    expect(isAllowedUrl('http://127.1')).toBe(false);
    expect(isAllowedUrl('http://localhost')).toBe(false);
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
    expect(isAllowedUrl('http://169.254.169.254')).toBe(false);
    expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
    expect(isAllowedUrl('http://internal.local')).toBe(false);
  });

  it('blocks IPv6 loopback and unspecified addresses', () => {
    expect(isAllowedUrl('http://[::1]')).toBe(false);
    expect(isAllowedUrl('http://[::]')).toBe(false);
    expect(isAllowedUrl('http://[0000:0000:0000:0000:0000:0000:0000:0001]')).toBe(false);
  });

  it('blocks IPv4-mapped IPv6 loopback addresses', () => {
    expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:7f00:1]')).toBe(false);
  });

  it('rejects non-HTTP protocols and malformed URLs', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('ftp://example.com')).toBe(false);
    expect(isAllowedUrl('not-a-valid-url')).toBe(false);
    expect(isAllowedUrl('')).toBe(false);
  });
});
