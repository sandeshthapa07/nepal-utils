// Exact decimal handling on digit strings, so formatting never suffers from
// binary floating point (0.1 + 0.2, 1.005) and works for amounts beyond 2^53.

import { toEnglishDigits } from '../numerals/index.js';

export type NumericInput = number | string | bigint;

/** 'half-up' rounds ties away from zero (1.005 → 1.01). 'half-even' is banker's rounding. */
export type RoundingMode = 'half-up' | 'half-even' | 'truncate';

export type Grouping = 'lakh' | 'international' | 'none';

export interface Decimal {
  negative: boolean;
  /** Integer digits without leading zeros ("0" for zero). */
  int: string;
  /** Fraction digits. */
  frac: string;
}

const NUMERIC_STRING = /^([+-])?(\d*)(?:\.(\d*))?$/;

export function toDecimal(value: NumericInput): Decimal {
  if (typeof value === 'bigint') {
    const negative = value < 0n;
    return normalize(negative, (negative ? -value : value).toString(), '');
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new RangeError(`Expected a finite number, got ${value}`);
    // String() gives the shortest decimal that round-trips, e.g. 1.005 → "1.005".
    return fromNumberString(value < 0, String(Math.abs(value)));
  }
  if (typeof value === 'string') {
    const match = NUMERIC_STRING.exec(toEnglishDigits(value.trim()));
    if (!match || (!match[2] && !match[3])) {
      throw new TypeError(`Invalid numeric string: "${value}"`);
    }
    return normalize(match[1] === '-', match[2] ?? '', match[3] ?? '');
  }
  throw new TypeError(`Expected a number, numeric string or bigint, got ${typeof value}`);
}

/** Expand "1.5e-7" / "1e+21" into plain digits. */
function fromNumberString(negative: boolean, s: string): Decimal {
  const [mantissa = '', exponent] = s.split('e');
  const [intPart = '', fracPart = ''] = mantissa.split('.');
  if (exponent === undefined) return normalize(negative, intPart, fracPart);

  const digits = intPart + fracPart;
  const point = intPart.length + Number(exponent);
  if (point <= 0) return normalize(negative, '0', '0'.repeat(-point) + digits);
  if (point >= digits.length) return normalize(negative, digits + '0'.repeat(point - digits.length), '');
  return normalize(negative, digits.slice(0, point), digits.slice(point));
}

function normalize(negative: boolean, int: string, frac: string): Decimal {
  const i = int.replace(/^0+/, '') || '0';
  const f = frac.replace(/0+$/, '');
  return { negative: negative && !(i === '0' && f === ''), int: i, frac: f };
}

/** Round to exactly `places` fraction digits. A result of zero is never negative. */
export function roundDecimal(d: Decimal, places: number, mode: RoundingMode): Decimal {
  if (mode !== 'half-up' && mode !== 'half-even' && mode !== 'truncate') {
    throw new RangeError(`rounding must be "half-up", "half-even" or "truncate", got ${String(mode)}`);
  }
  if (d.frac.length <= places) return { ...d, frac: d.frac.padEnd(places, '0') };

  const kept = d.frac.slice(0, places);
  const rest = d.frac.slice(places);
  let digits = d.int + kept;

  let roundUp = false;
  if (mode === 'half-up') {
    roundUp = rest[0]! >= '5';
  } else if (mode === 'half-even') {
    if (rest[0]! > '5') roundUp = true;
    else if (rest[0] === '5') roundUp = /[1-9]/.test(rest.slice(1)) || Number(digits.slice(-1)) % 2 === 1;
  }
  if (roundUp) digits = increment(digits);

  const int = digits.slice(0, digits.length - places).replace(/^0+/, '') || '0';
  const frac = digits.slice(digits.length - places);
  const isZero = int === '0' && !/[1-9]/.test(frac);
  return { negative: d.negative && !isZero, int, frac };
}

function increment(digits: string): string {
  const out = digits.split('');
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i] === '9') {
      out[i] = '0';
    } else {
      out[i] = String(Number(out[i]) + 1);
      return out.join('');
    }
  }
  return '1' + out.join('');
}

/**
 * Insert separators into an integer digit string.
 * 'lakh': 12,34,567 (last three digits, then pairs). 'international': 1,234,567.
 */
export function groupDigits(int: string, grouping: Grouping, separator = ','): string {
  if (grouping !== 'lakh' && grouping !== 'international' && grouping !== 'none') {
    throw new RangeError(`grouping must be "lakh", "international" or "none", got ${String(grouping)}`);
  }
  if (grouping === 'none' || int.length <= 3) return int;
  const head = int.slice(0, -3);
  const size = grouping === 'lakh' ? 2 : 3;
  const groups: string[] = [];
  for (let end = head.length; end > 0; end -= size) {
    groups.unshift(head.slice(Math.max(0, end - size), end));
  }
  groups.push(int.slice(-3));
  return groups.join(separator);
}
