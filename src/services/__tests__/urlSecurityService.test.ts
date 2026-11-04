import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService.ts';

describe('urlSecurityService (SSRF Protection)', () => {
  it('allows valid external public HTTP and HTTPS URLs', () => {
    expect(isAllowedUrl('https://example.com')).toBe(true);
    expect(isAllowedUrl('http://example.com/path?query=1')).toBe(true);
    expect(isAllowedUrl('https://google.com')).toBe(true);
    expect(isAllowedUrl('https://cloudflare-dns.com')).toBe(true);
  });

  it('blocks loopback and localhost variants', () => {
    expect(isAllowedUrl('http://localhost')).toBe(false);
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.2')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3:8080')).toBe(false);
    expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
    expect(isAllowedUrl('http://[::1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:7f00:1]')).toBe(false);
  });

  it('blocks private network ranges (RFC 1918)', () => {
    expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://10.255.255.255')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
  });

  it('blocks link-local / cloud metadata IP (169.254.169.254)', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isAllowedUrl('http://169.254.1.1')).toBe(false);
  });

  it('blocks .local mDNS hostnames', () => {
    expect(isAllowedUrl('http://printer.local')).toBe(false);
    expect(isAllowedUrl('http://nas.device.local:8000')).toBe(false);
  });

  it('blocks non-http/https schemes and malformed inputs', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('')).toBe(false);
    expect(isAllowedUrl('not-a-valid-url')).toBe(false);
  });
});
