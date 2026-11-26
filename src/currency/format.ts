import { toEnglishDigits, toNepaliDigits } from '../numerals/index.js';
import { assertLocale, assertPlaces, type Locale } from '../internal/assert.js';
import {
  groupDigits,
  roundDecimal,
  toDecimal,
  type Grouping,
  type NumericInput,
  type RoundingMode,
} from '../internal/decimal.js';

export const DEFAULT_SYMBOL: Readonly<Record<Locale, string>> = { en: 'Rs.', ne: 'रु.' };

export interface FormatNPROptions {
  /** 'en' (default) prints 0-9 with "Rs."; 'ne' prints ०-९ with "रु.". */
  locale?: Locale;
  /** Symbol before the amount, or `false` for none. Default depends on `locale`. */
  symbol?: string | false;
  /** Decimal places. Default 2. */
  decimals?: number;
  /** Leave out decimals when they are all zero: "Rs. 500" instead of "Rs. 500.00". Default false. */
  stripZeroDecimals?: boolean;
  /** Default 'half-up'. */
  rounding?: RoundingMode;
  /** Default 'lakh' (12,34,567). */
  grouping?: Grouping;
  /** 'minus' (default) → "-Rs. 500.00"; 'parentheses' → "(Rs. 500.00)". */
  negative?: 'minus' | 'parentheses';
}

/**
 * Format an amount as Nepali rupees with lakh/crore grouping.
 *
 * Accepts a number, a numeric string (exact, may use Devanagari digits) or a bigint.
 *
 * @example formatNPR(1234567.5)                   // 'Rs. 12,34,567.50'
 * @example formatNPR(1234567.5, { locale: 'ne' }) // 'रु. १२,३४,५६७.५०'
 */
export function formatNPR(value: NumericInput, options: FormatNPROptions = {}): string {
  const {
    locale = 'en',
    decimals = 2,
    stripZeroDecimals = false,
    rounding = 'half-up',
    grouping = 'lakh',
    negative = 'minus',
  } = options;
  assertLocale(locale);
  assertPlaces(decimals, 'decimals');
  const symbol = options.symbol === undefined ? DEFAULT_SYMBOL[locale] : options.symbol;

  const d = roundDecimal(toDecimal(value), decimals, rounding);
  let body = groupDigits(d.int, grouping);
  if (d.frac && !(stripZeroDecimals && /^0+$/.test(d.frac))) body += `.${d.frac}`;
  if (locale === 'ne') body = toNepaliDigits(body);

  const text = symbol ? `${symbol} ${body}` : body;
  if (!d.negative) return text;
  return negative === 'parentheses' ? `(${text})` : `-${text}`;
}

const CURRENCY_WORDS = /(?:npr|nrs\.?|rs\.?|रु\.?|रू\.?|₨|रुपैयाँ|rupees?)/giu;

/**
 * Read an amount back from text such as "Rs. 12,34,567.50", "रु. १२,३४,५६७.५०",
 * "NPR 500", "Rs. 500/-" or "(Rs. 500.00)". Returns `null` if the text is not an amount.
 *
 * The result is a JS number, so amounts above 2^53 lose precision.
 */
export function parseNPR(input: string): number | null {
  if (typeof input !== 'string') return null;
  let s = toEnglishDigits(input).trim();

  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(CURRENCY_WORDS, '').replace(/\/-$/, '').replace(/[\s,]/g, '');

  const match = /^([+-])?(\d+(?:\.\d*)?|\.\d+)$/.exec(s);
  if (!match) return null;
  if (match[1] === '-') {
    if (negative) return null; // "(-500)" is ambiguous
    negative = true;
  }
  const n = Number(match[2]);
  return negative && n !== 0 ? -n : n;
}
