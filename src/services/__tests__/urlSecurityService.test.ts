import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('isAllowedUrl SSRF Protection', () => {
  it('allows valid public URLs', () => {
    expect(isAllowedUrl('https://google.com')).toBe(true);
    expect(isAllowedUrl('https://cloudflare.com/security')).toBe(true);
    expect(isAllowedUrl('http://example.org')).toBe(true);
    expect(isAllowedUrl('https://127.0.0.1.example.com')).toBe(true);
    expect(isAllowedUrl('https://10.0.0.1.nip.io')).toBe(true);
  });

  it('blocks localhost and loopback IPv4 addresses', () => {
    expect(isAllowedUrl('http://localhost')).toBe(false);
    expect(isAllowedUrl('http://localhost:3000')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://127.0.0.1:5005')).toBe(false);
    expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
    // Obfuscated octal/hex/decimal representations normalize to 127.0.0.1 in Node URL
    expect(isAllowedUrl('http://0177.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://2130706433')).toBe(false);
  });

  it('blocks private subnets (RFC 1918) and 0.0.0.0', () => {
    expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
    expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
    expect(isAllowedUrl('http://10.255.255.255')).toBe(false);
    expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
    expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
    expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
  });

  it('blocks cloud metadata service (169.254.x.x)', () => {
    expect(isAllowedUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isAllowedUrl('http://169.254.1.1')).toBe(false);
  });

  it('blocks IPv6 loopbacks and mapped IPv4 addresses', () => {
    expect(isAllowedUrl('http://[::1]')).toBe(false);
    expect(isAllowedUrl('http://[::1]:5005')).toBe(false);
    expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
  });

  it('blocks .local mdns domains', () => {
    expect(isAllowedUrl('http://mydevice.local')).toBe(false);
    expect(isAllowedUrl('http://internal.service.local:8080')).toBe(false);
  });

  it('blocks invalid schemes, pseudo-protocols, and malformed strings', () => {
    expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
    expect(isAllowedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isAllowedUrl('about:blank')).toBe(false);
    expect(isAllowedUrl('not a url')).toBe(false);
    expect(isAllowedUrl('')).toBe(false);
  });
});
