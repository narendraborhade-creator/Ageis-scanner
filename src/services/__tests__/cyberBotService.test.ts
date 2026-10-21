import { describe, it, expect } from 'vitest';
import { calculateEntropy } from '../cyberBotService';

describe('calculateEntropy', () => {
  it('returns 0 for empty string', () => {
    expect(calculateEntropy('')).toBe(0);
  });

  it('returns 0 for single character string', () => {
    expect(calculateEntropy('a')).toBe(0);
    expect(calculateEntropy('aaaa')).toBe(0);
  });

  it('calculates correct entropy for string with 2 distinct equally distributed characters', () => {
    // 'ab' -> p(a)=0.5, p(b)=0.5 -> H = - (0.5*log2(0.5) + 0.5*log2(0.5)) = 1
    expect(calculateEntropy('ab')).toBe(1);
    expect(calculateEntropy('aabb')).toBe(1);
  });

  it('calculates correct entropy for string with 4 distinct equally distributed characters', () => {
    // 'abcd' -> p=0.25 -> H = -4*(0.25*log2(0.25)) = 2
    expect(calculateEntropy('abcd')).toBe(2);
  });
});
