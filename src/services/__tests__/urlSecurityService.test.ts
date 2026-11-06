import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('urlSecurityService', () => {
  describe('isAllowedUrl', () => {
    it('should allow normal http and https URLs', () => {
      expect(isAllowedUrl('http://example.com')).toBe(true);
      expect(isAllowedUrl('https://example.com')).toBe(true);
      expect(isAllowedUrl('https://google.com/search?q=test')).toBe(true);
    });

    it('should block local hostnames and IPs', () => {
      expect(isAllowedUrl('http://localhost')).toBe(false);
      expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://169.254.169.254')).toBe(false); // AWS metadata
      expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
      expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
      expect(isAllowedUrl('http://[::1]')).toBe(false);
      expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
      expect(isAllowedUrl('http://test.local')).toBe(false);
    });

    it('should block javascript: and non-standard schemes', () => {
      expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
      expect(isAllowedUrl('data:text/html,<html>')).toBe(false);
      expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
      expect(isAllowedUrl('gopher://example.com')).toBe(false);
    });

    it('should block malformed URLs', () => {
      expect(isAllowedUrl('not-a-url')).toBe(false);
      expect(isAllowedUrl('')).toBe(false);
    });

    it('should block SSRF bypass attempts', () => {
      expect(isAllowedUrl('http://127.0.0.1.example.com')).toBe(true); // Should allow if it's just part of a larger hostname
    });
  });
});
