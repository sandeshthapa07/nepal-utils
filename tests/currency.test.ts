import { describe, expect, it } from 'vitest';
import { formatCompact, formatNPR, parseNPR, toWords } from '../src/currency/index.js';
import { NE_UNDER_100 } from '../src/currency/words.js';

describe('formatNPR', () => {
  it('groups in lakh/crore style', () => {
    expect(formatNPR(0)).toBe('Rs. 0.00');
    expect(formatNPR(999)).toBe('Rs. 999.00');
    expect(formatNPR(1000)).toBe('Rs. 1,000.00');
    expect(formatNPR(100000)).toBe('Rs. 1,00,000.00');
    expect(formatNPR(1234567.5)).toBe('Rs. 12,34,567.50');
    expect(formatNPR(10000000)).toBe('Rs. 1,00,00,000.00');
  });

  it('prints Nepali digits and symbol for locale ne', () => {
    expect(formatNPR(1234567.5, { locale: 'ne' })).toBe('रु. १२,३४,५६७.५०');
  });

  it('rounds on the decimal value, not the binary float', () => {
    expect(formatNPR(1.005)).toBe('Rs. 1.01');
    expect(formatNPR(2.675)).toBe('Rs. 2.68');
    expect(formatNPR(0.1 + 0.2)).toBe('Rs. 0.30');
  });

  it('supports other rounding modes', () => {
    expect(formatNPR(2.665, { rounding: 'half-even' })).toBe('Rs. 2.66');
    expect(formatNPR(2.675, { rounding: 'half-even' })).toBe('Rs. 2.68');
    expect(formatNPR(2.6651, { rounding: 'half-even' })).toBe('Rs. 2.67');
    expect(formatNPR(9.999, { rounding: 'truncate' })).toBe('Rs. 9.99');
  });

  it('carries rounding into the integer part', () => {
    expect(formatNPR(99999.999)).toBe('Rs. 1,00,000.00');
  });

  it('formats negatives', () => {
    expect(formatNPR(-500)).toBe('-Rs. 500.00');
    expect(formatNPR(-500, { negative: 'parentheses' })).toBe('(Rs. 500.00)');
    expect(formatNPR(-0.001)).toBe('Rs. 0.00');
    expect(formatNPR(-0)).toBe('Rs. 0.00');
  });

  it('respects symbol, decimals, stripZeroDecimals and grouping', () => {
    expect(formatNPR(1234567.5, { symbol: false })).toBe('12,34,567.50');
    expect(formatNPR(1234567.5, { symbol: 'NPR' })).toBe('NPR 12,34,567.50');
    expect(formatNPR(1234567.5, { decimals: 0 })).toBe('Rs. 12,34,568');
    expect(formatNPR(500, { stripZeroDecimals: true })).toBe('Rs. 500');
    expect(formatNPR(500.5, { stripZeroDecimals: true })).toBe('Rs. 500.50');
    expect(formatNPR(1234567.5, { grouping: 'international' })).toBe('Rs. 1,234,567.50');
    expect(formatNPR(1234567.5, { grouping: 'none' })).toBe('Rs. 1234567.50');
  });

  it('handles strings and bigints exactly', () => {
    expect(formatNPR('12345678901234567890.99')).toBe('Rs. 1,23,45,67,89,01,23,45,67,890.99');
    expect(formatNPR(10n ** 12n)).toBe('Rs. 10,00,00,00,00,000.00');
    expect(formatNPR('१२३४.५')).toBe('Rs. 1,234.50');
    expect(formatNPR(' -42 ')).toBe('-Rs. 42.00');
    expect(formatNPR('.5')).toBe('Rs. 0.50');
  });

  it('handles numbers that stringify in exponent form', () => {
    expect(formatNPR(1e21)).toBe(formatNPR('1' + '0'.repeat(21)));
    expect(formatNPR(1.5e-7)).toBe('Rs. 0.00');
    expect(formatNPR(5e-3)).toBe('Rs. 0.01');
  });

  it('rejects bad input', () => {
    expect(() => formatNPR(Number.NaN)).toThrow(RangeError);
    expect(() => formatNPR(Infinity)).toThrow(RangeError);
    expect(() => formatNPR('abc')).toThrow(TypeError);
    expect(() => formatNPR('1,000')).toThrow(TypeError);
    expect(() => formatNPR('.')).toThrow(TypeError);
    expect(() => formatNPR(1, { decimals: -1 })).toThrow(RangeError);
    expect(() => formatNPR(1, { locale: 'fr' as unknown as 'en' })).toThrow(RangeError);
  });
});

describe('parseNPR', () => {
  it('reads formatted amounts', () => {
    expect(parseNPR('Rs. 12,34,567.50')).toBe(1234567.5);
    expect(parseNPR('रु. १२,३४,५६७.५०')).toBe(1234567.5);
    expect(parseNPR('NPR 500')).toBe(500);
    expect(parseNPR('NRs. 500')).toBe(500);
    expect(parseNPR('Rs 500/-')).toBe(500);
    expect(parseNPR('₨ 1,000')).toBe(1000);
    expect(parseNPR('रू 1,000')).toBe(1000);
    expect(parseNPR('1,00,000')).toBe(100000);
    expect(parseNPR('npr1,00,000')).toBe(100000);
    expect(parseNPR('.5')).toBe(0.5);
  });

  it('reads negatives', () => {
    expect(parseNPR('-Rs. 500.00')).toBe(-500);
    expect(parseNPR('Rs. -500')).toBe(-500);
    expect(parseNPR('(Rs. 500.00)')).toBe(-500);
  });

  it('returns null for text that is not an amount', () => {
    for (const bad of ['', '   ', 'abc', 'Rs.', '1.2.3', '(-500)', '12abc', '--5']) {
      expect(parseNPR(bad)).toBeNull();
    }
    expect(parseNPR(123 as unknown as string)).toBeNull();
  });

  it('round-trips formatNPR for whole paisa amounts', () => {
    let seed = 42;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31;
      return seed / 2 ** 31;
    };
    for (let i = 0; i < 1000; i++) {
      const value = (Math.round(random() * 1e12) / 100) * (random() < 0.2 ? -1 : 1);
      expect(parseNPR(formatNPR(value))).toBe(value === 0 ? 0 : value);
      expect(parseNPR(formatNPR(value, { locale: 'ne', negative: 'parentheses' }))).toBe(value === 0 ? 0 : value);
    }
  });
});

describe('formatCompact', () => {
  it('picks the right unit', () => {
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(1500)).toBe('1.5 thousand');
    expect(formatCompact(1500000)).toBe('15 lakh');
    expect(formatCompact(12345678)).toBe('1.23 crore');
    expect(formatCompact(2500000000)).toBe('2.5 arab');
    expect(formatCompact(3e11)).toBe('3 kharab');
  });

  it('moves up a unit when rounding reaches it', () => {
    expect(formatCompact(9999999)).toBe('1 crore');
    expect(formatCompact(999.999)).toBe('1 thousand');
    expect(formatCompact(99999)).toBe('1 lakh');
  });

  it('supports locale, symbol, decimals and negatives', () => {
    expect(formatCompact(1500000, { locale: 'ne' })).toBe('१५ लाख');
    expect(formatCompact(2500000000, { locale: 'ne' })).toBe('२.५ अर्ब');
    expect(formatCompact(1500000, { symbol: 'Rs.' })).toBe('Rs. 15 lakh');
    expect(formatCompact(1550000, { maxDecimals: 0 })).toBe('16 lakh');
    expect(formatCompact(-1500000)).toBe('-15 lakh');
    expect(formatCompact(12.345)).toBe('12.35');
  });

  it('reads out the multiplier above the largest unit', () => {
    expect(formatCompact(10n ** 20n)).toBe('1,000 shankha');
  });
});

describe('toWords', () => {
  it('writes cheque-style English', () => {
    expect(toWords(123456.5)).toBe(
      'One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Rupees and Fifty Paisa Only',
    );
    expect(toWords(1234567890)).toBe(
      'One Arab Twenty-Three Crore Forty-Five Lakh Sixty-Seven Thousand Eight Hundred Ninety Rupees Only',
    );
    expect(toWords(100)).toBe('One Hundred Rupees Only');
    expect(toWords(1000000)).toBe('Ten Lakh Rupees Only');
    expect(toWords(10000000)).toBe('One Crore Rupees Only');
    expect(toWords(10n ** 19n)).toBe('One Hundred Shankha Rupees Only');
  });

  it('writes Nepali', () => {
    expect(toWords(123456.5, { locale: 'ne' })).toBe('एक लाख तेइस हजार चार सय छपन्न रुपैयाँ पचास पैसा मात्र');
    expect(toWords(99, { locale: 'ne' })).toBe('उनान्सय रुपैयाँ मात्र');
    expect(toWords(21000000, { locale: 'ne' })).toBe('दुई करोड दश लाख रुपैयाँ मात्र');
  });

  it('handles zero, singular rupee and paisa-only amounts', () => {
    expect(toWords(0)).toBe('Zero Rupees Only');
    expect(toWords(0, { locale: 'ne' })).toBe('शून्य रुपैयाँ मात्र');
    expect(toWords(1)).toBe('One Rupee Only');
    expect(toWords(0.5)).toBe('Fifty Paisa Only');
    expect(toWords(0.5, { locale: 'ne' })).toBe('पचास पैसा मात्र');
    expect(toWords(1.01)).toBe('One Rupee and One Paisa Only');
  });

  it('rounds to whole paisa', () => {
    expect(toWords(99.999)).toBe('One Hundred Rupees Only');
    expect(toWords(0.1 + 0.2)).toBe('Thirty Paisa Only');
  });

  it('can leave out "Only"', () => {
    expect(toWords(100, { only: false })).toBe('One Hundred Rupees');
    expect(toWords(100, { locale: 'ne', only: false })).toBe('एक सय रुपैयाँ');
  });

  it('reads plain numbers when currency is false', () => {
    expect(toWords(12.5, { currency: false })).toBe('Twelve Point Five');
    expect(toWords('3.05', { currency: false })).toBe('Three Point Zero Five');
    expect(toWords(12.5, { currency: false, locale: 'ne' })).toBe('बाह्र दशमलव पाँच');
    expect(toWords(0, { currency: false })).toBe('Zero');
    expect(toWords(105, { currency: false })).toBe('One Hundred Five');
  });

  it('rejects negatives', () => {
    expect(() => toWords(-5)).toThrow(RangeError);
  });

  it('has 100 distinct Nepali number names', () => {
    expect(NE_UNDER_100).toHaveLength(100);
    expect(new Set(NE_UNDER_100).size).toBe(100);
  });
});
