import { describe, expect, it } from 'vitest';
import { hasDevanagari, isDevanagari, toEnglishDigits, toNepaliDigits } from '../src/numerals/index.js';

describe('toNepaliDigits', () => {
  it('converts every digit and keeps other characters', () => {
    expect(toNepaliDigits('0123456789')).toBe('०१२३४५६७८९');
    expect(toNepaliDigits('Rs. 1,234.50')).toBe('Rs. १,२३४.५०');
  });
  it('accepts numbers and bigints', () => {
    expect(toNepaliDigits(2081)).toBe('२०८१');
    expect(toNepaliDigits(10n)).toBe('१०');
  });
});

describe('toEnglishDigits', () => {
  it('converts every digit and keeps other characters', () => {
    expect(toEnglishDigits('०१२३४५६७८९')).toBe('0123456789');
    expect(toEnglishDigits('रु. १२,३४५')).toBe('रु. 12,345');
  });
  it('round-trips with toNepaliDigits', () => {
    expect(toEnglishDigits(toNepaliDigits('9841234567'))).toBe('9841234567');
  });
});

describe('hasDevanagari / isDevanagari', () => {
  it('detects Devanagari anywhere', () => {
    expect(hasDevanagari('hello नमस्ते')).toBe(true);
    expect(hasDevanagari('hello')).toBe(false);
  });
  it('accepts Devanagari text with spaces and punctuation', () => {
    expect(isDevanagari('नमस्ते, संसार!')).toBe(true);
    expect(isDevanagari('१२३')).toBe(true);
    expect(isDevanagari('काठमाडौँ।')).toBe(true);
  });
  it('rejects mixed-script or empty text', () => {
    expect(isDevanagari('नमस्ते world')).toBe(false);
    expect(isDevanagari('नमस्ते 123')).toBe(false);
    expect(isDevanagari('')).toBe(false);
    expect(isDevanagari('   ')).toBe(false);
  });
});
