import { describe, it, expect } from 'vitest';
import { isAllowedUrl } from '../urlSecurityService';

describe('urlSecurityService', () => {
  describe('isAllowedUrl', () => {
    it('allows valid external URLs', () => {
      expect(isAllowedUrl('https://example.com')).toBe(true);
      expect(isAllowedUrl('http://google.com')).toBe(true);
    });

    it('blocks localhost', () => {
      expect(isAllowedUrl('http://localhost:8080')).toBe(false);
      expect(isAllowedUrl('https://localhost')).toBe(false);
    });

    it('blocks loopback IP addresses', () => {
      expect(isAllowedUrl('http://127.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://127.1.2.3')).toBe(false);
      expect(isAllowedUrl('http://[::1]')).toBe(false);
      expect(isAllowedUrl('http://[::ffff:7f00:1]')).toBe(false);
      expect(isAllowedUrl('http://[::ffff:127.0.0.1]')).toBe(false);
    });

    it('blocks internal/private IP addresses', () => {
      expect(isAllowedUrl('http://10.0.0.1')).toBe(false);
      expect(isAllowedUrl('http://192.168.1.1')).toBe(false);
      expect(isAllowedUrl('http://172.16.0.1')).toBe(false);
      expect(isAllowedUrl('http://172.31.255.255')).toBe(false);
      expect(isAllowedUrl('http://169.254.169.254')).toBe(false);
    });

    it('blocks 0.0.0.0', () => {
      expect(isAllowedUrl('http://0.0.0.0')).toBe(false);
    });

    it('blocks .local domains', () => {
      expect(isAllowedUrl('http://myserver.local')).toBe(false);
    });

    it('blocks non-http/https protocols', () => {
      expect(isAllowedUrl('ftp://example.com')).toBe(false);
      expect(isAllowedUrl('file:///etc/passwd')).toBe(false);
      expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
      expect(isAllowedUrl('data:text/html,<html>')).toBe(false);
    });

    it('blocks malformed URLs', () => {
      expect(isAllowedUrl('not-a-url')).toBe(false);
      expect(isAllowedUrl('')).toBe(false);
    });
  });
});
