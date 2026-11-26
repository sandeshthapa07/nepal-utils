import { toNepaliDigits } from '../numerals/index.js';
import { assertLocale, assertPlaces, type Locale } from '../internal/assert.js';
import {
  groupDigits,
  roundDecimal,
  toDecimal,
  type Decimal,
  type NumericInput,
  type RoundingMode,
} from '../internal/decimal.js';

// Largest first. `exp` is the power of ten the unit stands for.
const UNITS = [
  { exp: 17, en: 'shankha', ne: 'शंख' },
  { exp: 15, en: 'padma', ne: 'पद्म' },
  { exp: 13, en: 'neel', ne: 'नील' },
  { exp: 11, en: 'kharab', ne: 'खर्ब' },
  { exp: 9, en: 'arab', ne: 'अर्ब' },
  { exp: 7, en: 'crore', ne: 'करोड' },
  { exp: 5, en: 'lakh', ne: 'लाख' },
  { exp: 3, en: 'thousand', ne: 'हजार' },
] as const;

export interface FormatCompactOptions {
  /** 'en' (default) → "15 lakh"; 'ne' → "१५ लाख". */
  locale?: Locale;
  /** Most decimal places to show; trailing zeros are dropped. Default 2. */
  maxDecimals?: number;
  /** Optional symbol, e.g. "Rs." → "Rs. 15 lakh". Default none. */
  symbol?: string | false;
  /** Default 'half-up'. */
  rounding?: RoundingMode;
}

/**
 * Short form using Nepali units: thousand, lakh, crore, arab, kharab, neel, padma, shankha.
 *
 * @example formatCompact(1500000)                   // '15 lakh'
 * @example formatCompact(12345678)                  // '1.23 crore'
 * @example formatCompact(2500000000, { locale: 'ne' }) // '२.५ अर्ब'
 */
export function formatCompact(value: NumericInput, options: FormatCompactOptions = {}): string {
  const { locale = 'en', maxDecimals = 2, symbol = false, rounding = 'half-up' } = options;
  assertLocale(locale);
  assertPlaces(maxDecimals, 'maxDecimals');

  const d = toDecimal(value);
  // Index into UNITS; UNITS.length means "no unit" (below one thousand).
  let i = UNITS.findIndex((u) => d.int.length > u.exp);
  if (i === -1) i = UNITS.length;

  let m = roundDecimal(shiftLeft(d, expAt(i)), maxDecimals, rounding);
  // Rounding can carry into the next unit: 99.999 lakh → 100 lakh → 1 crore.
  while (i > 0 && m.int.length > expAt(i - 1) - expAt(i)) {
    i -= 1;
    m = roundDecimal(shiftLeft(d, expAt(i)), maxDecimals, rounding);
  }

  const frac = m.frac.replace(/0+$/, '');
  let num = groupDigits(m.int, 'lakh') + (frac ? `.${frac}` : '');
  if (locale === 'ne') num = toNepaliDigits(num);
  const unit = i < UNITS.length ? UNITS[i]![locale] : '';

  const body = [symbol || '', num, unit].filter(Boolean).join(' ');
  return m.negative ? `-${body}` : body;
}

function expAt(i: number): number {
  return i < UNITS.length ? UNITS[i]!.exp : 0;
}

/** Divide by 10^places by moving the decimal point. */
function shiftLeft(d: Decimal, places: number): Decimal {
  if (places === 0) return d;
  const cut = d.int.length - places;
  if (cut > 0) return { negative: d.negative, int: d.int.slice(0, cut), frac: d.int.slice(cut) + d.frac };
  return { negative: d.negative, int: '0', frac: '0'.repeat(-cut) + d.int + d.frac };
}
