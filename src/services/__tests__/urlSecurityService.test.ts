import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('isAllowedUrl SSRF Protection', () => {
  it('blocks localhost', () => {
    expect(isAllowedUrl('http://localhost')).toBe(false);
  });

  it('blocks IPv4 loopback', () => {
    expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('https://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
  });

  it('blocks IPv6 loopback variants', () => {
    expect(isAllowedUrl('http://[::1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:7f00:1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:7f00:2]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:7fff:ffff]')).toBe(false);
  });

  it('blocks metadata service IPs', () => {
    expect(isAllowedUrl('http://169.254.169.254')).toBe(false);
  });

  it('blocks private network IPs', () => {
    expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
  });

  it('allows public sites', () => {
    expect(isAllowedUrl('http://example.com')).toBe(true);
    expect(isAllowedUrl('https://google.com')).toBe(true);
  });

  it('blocks non-HTTP protocols', () => {
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('ftp://example.com')).toBe(false);
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
  });
});
