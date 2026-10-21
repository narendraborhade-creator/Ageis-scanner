import { describe, it, expect } from 'vitest';
import { analyzeUrlThreats } from './threatEngine';

describe('analyzeUrlThreats', () => {
  it('should categorize a safe HTTPS url as Clean', () => {
    const result = analyzeUrlThreats('https://example.com');
    expect(result.isBlocked).toBe(false);
    expect(result.category).toBe('Clean');
    expect(result.riskScore).toBe(0);
    expect(result.threats).toHaveLength(0);
  });

  it('should categorize an insecure HTTP url as Suspicious and identify it as an insecure_http threat', () => {
    const result = analyzeUrlThreats('http://example.com');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Suspicious');
    expect(result.riskScore).toBe(30);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('insecure_http');
  });

  it('should categorize an XSS payload url as Dangerous and identify it as an xss threat', () => {
    const result = analyzeUrlThreats('https://example.com?q=<script>alert("xss")</script>');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Dangerous');
    expect(result.riskScore).toBe(50);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('xss');
  });

  it('should categorize a phishing url as Dangerous and identify it as a phishing threat', () => {
    const result = analyzeUrlThreats('https://paypal-secure.com');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Dangerous');
    expect(result.riskScore).toBe(50);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('phishing');
  });

  it('should categorize a punycode url as Suspicious and identify it as a typosquatting threat', () => {
    const result = analyzeUrlThreats('https://xn--example.com');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Suspicious');
    expect(result.riskScore).toBe(30);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('typosquatting');
  });

  it('should categorize a suspicious TLD as Suspicious and identify it as a malware threat', () => {
    const result = analyzeUrlThreats('https://example.xyz');
    expect(result.isBlocked).toBe(false);
    expect(result.category).toBe('Suspicious');
    expect(result.riskScore).toBe(15);
    expect(result.threats).toHaveLength(1);
    expect(result.threats[0].type).toBe('malware');
  });

  it('should calculate accumulated risk score up to 100 and block if critical or high severity threats exist', () => {
    // Insecure HTTP (high: 30), Phishing keyword (critical: 50), Suspicious TLD (medium: 15) -> Total: 95
    const result = analyzeUrlThreats('http://paypal-secure.xyz');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Malicious');
    expect(result.riskScore).toBe(95);
    expect(result.threats).toHaveLength(3);
  });

  it('should cap the risk score at 100', () => {
    // Insecure HTTP (30), XSS (50), Phishing (50), Typosquatting (30), Suspicious TLD (15) -> Total 175, capped at 100
    const result = analyzeUrlThreats('http://xn--paypal-secure.xyz?q=<script>alert("xss")</script>');
    expect(result.isBlocked).toBe(true);
    expect(result.category).toBe('Malicious');
    expect(result.riskScore).toBe(100);
  });
});
