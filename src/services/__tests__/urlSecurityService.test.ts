import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('urlSecurityService', () => {
  describe('isAllowedUrl', () => {
    it('should block non-HTTP/HTTPS protocols', () => {
      expect(isAllowedUrl('javascript://%250aalert(1)')).toBe(false);
      expect(isAllowedUrl('data:text/html,<html>')).toBe(false);
      expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
      expect(isAllowedUrl('gopher://example.com')).toBe(false);
    });

    it('should block standard local IPs and hostnames', () => {
      expect(isAllowedUrl('http://localhost')).toBe(false);
      expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://169.254.169.254')).toBe(false); // AWS metadata
      expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
      expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
      expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
      expect(isAllowedUrl('http://test.local')).toBe(false);
      expect(isAllowedUrl('http://[::1]')).toBe(false); // IPv6 loopback
    });

    it('should block IPv4-mapped IPv6 loopback addresses', () => {
      // Exploit path where Node normalizes to [::ffff:7f00:1]
      expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
      expect(isAllowedUrl('http://[::ffff:7f00:1]')).toBe(false);
    });

    it('should allow valid external URLs', () => {
      expect(isAllowedUrl('https://example.com')).toBe(true);
      expect(isAllowedUrl('http://example.com')).toBe(true);
      expect(isAllowedUrl('https://www.google.com/path?query=1')).toBe(true);
      expect(isAllowedUrl('https://github.com')).toBe(true);
    });

    it('should block malformed URLs that cannot be parsed', () => {
      expect(isAllowedUrl('not-a-url')).toBe(false);
    });
  });
});
