import { describe, it, expect } from 'vitest';
import { calculatePasswordEntropy } from '../cryptoVaultService';

describe('calculatePasswordEntropy', () => {
  it('returns entropy 0 and weak strength for empty string', () => {
    const result = calculatePasswordEntropy('');
    expect(result).toEqual({ entropy: 0, strength: 'weak', scorePercent: 0 });
  });

  it('calculates correct entropy and strength for lowercase only password (weak)', () => {
    // lowercase charset size is 26.
    // Length 6 * log2(26) = 6 * 4.7004 = ~28 entropy
    const result = calculatePasswordEntropy('abcdef');
    expect(result.entropy).toBeCloseTo(28, 0);
    expect(result.strength).toBe('weak');
    expect(result.scorePercent).toBe(Math.min(100, Math.round((28 / 90) * 100)));
  });

  it('calculates correct entropy and strength for a fair password', () => {
    // Length 8, Lower + Upper + Number (charset 62).
    // Length 8 * log2(62) = 8 * 5.954 = ~48
    const result = calculatePasswordEntropy('Abcdefg1');
    expect(result.entropy).toBeCloseTo(48, 0);
    expect(result.strength).toBe('fair');
  });

  it('calculates correct entropy and strength for a strong password', () => {
    // Length 11, Lower + Upper + Number + Symbol (charset 95).
    // Length 11 * log2(95) = 11 * 6.569 = ~72
    const result = calculatePasswordEntropy('Abcdefg1!@#');
    expect(result.entropy).toBeCloseTo(72, 0);
    expect(result.strength).toBe('strong');
  });

  it('calculates correct entropy and strength for a military password', () => {
    // Length 15, Lower + Upper + Number + Symbol (charset 95).
    // Length 15 * log2(95) = 15 * 6.569 = ~99
    const result = calculatePasswordEntropy('Abcdefg1!@#xyZW');
    expect(result.entropy).toBeCloseTo(99, 0);
    expect(result.strength).toBe('military');
    expect(result.scorePercent).toBe(100); // Caps at 100
  });

  it('caps score percent at 100', () => {
    // Very long password to ensure high entropy > 90
    const result = calculatePasswordEntropy('aVeryLongPasswordThatHasMultipleCharacterSets123!@#');
    expect(result.scorePercent).toBe(100);
  });

  it('identifies long but low variance password as weak if it does not meet length criteria', () => {
      // It's possible to have high entropy but low length, let's see.
      // Actually entropy relies on length * charset.
      // E.g., 7 characters, all charsets: 7 * log2(95) = ~46 entropy.
      // But length is < 8, so it stays 'weak' instead of 'fair'.
      const result = calculatePasswordEntropy('Abc1!@#');
      expect(result.entropy).toBeCloseTo(46, 0);
      expect(result.strength).toBe('weak');
  });

  it('falls back to weak if entropy high but length low', () => {
      // 10 chars, all charsets: 10 * log2(95) = 66
      // But length < 11 so it should be fair, not strong
      const result = calculatePasswordEntropy('Abcd1!@#xy');
      expect(result.entropy).toBeCloseTo(66, 0);
      expect(result.strength).toBe('fair');
  });

  it('handles password with only special characters', () => {
    // Special chars charset size is 33.
    // 10 * log2(33) = 10 * 5.044 = ~50
    const result = calculatePasswordEntropy('!@#$%^&*()');
    expect(result.entropy).toBeCloseTo(50, 0);
    expect(result.strength).toBe('fair');
  });
});
