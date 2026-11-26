import { cleanInput, invalid, type ParseResult, type PhoneFormat } from './common.js';

export interface LandlineNumber {
  /** Domestic form with the leading 0, e.g. "014123456". */
  normalized: string;
  /** "+97714123456" */
  e164: string;
  /** "1" for Kathmandu Valley, otherwise two digits, e.g. "61" for Pokhara. */
  areaCode: string;
  subscriber: string;
}

/**
 * Check a Nepali landline number.
 *
 * Fixed-line numbers have 8 digits after the country code:
 * - Kathmandu Valley: area code 1 + 7 digits ("01-4123456")
 * - elsewhere: 2-digit area code + 6 digits ("061-541234")
 * Subscriber numbers start with 4, 5 or 6.
 *
 * The area code is not checked against a list of districts yet: the published
 * lists we found are incomplete, so checking would reject real numbers.
 */
export function parseLandline(input: unknown): ParseResult<LandlineNumber> {
  const s = cleanInput(input);
  if (s === '') return invalid('EMPTY');
  if (!/^\+?\d+$/.test(s)) return invalid('INVALID_CHARACTERS');

  let nsn: string;
  const intl = /^(?:\+977|00977|977)/.exec(s);
  if (intl) {
    nsn = s.slice(intl[0].length);
    if (nsn.startsWith('0')) nsn = nsn.slice(1); // tolerate "+977 01 4123456"
  } else if (s.startsWith('0')) {
    nsn = s.slice(1);
  } else {
    return invalid('INVALID_PREFIX'); // needs the 0 + area code, or +977
  }

  if (nsn.length !== 8) return invalid('INVALID_LENGTH');

  let areaCode: string;
  if (/^1[456]/.test(nsn)) areaCode = '1';
  else if (/^[1-9]\d[456]/.test(nsn)) areaCode = nsn.slice(0, 2);
  else return invalid('INVALID_PREFIX');

  return {
    valid: true,
    normalized: `0${nsn}`,
    e164: `+977${nsn}`,
    areaCode,
    subscriber: nsn.slice(areaCode.length),
  };
}

export function isValidLandline(input: unknown): boolean {
  return parseLandline(input).valid;
}

/**
 * Format a landline number, or return null if it isn't one.
 *
 * @example formatLandline('014123456')                        // '+977 1-4123456'
 * @example formatLandline('061541234', { format: 'national' }) // '061-541234'
 */
export function formatLandline(input: unknown, options: { format?: PhoneFormat } = {}): string | null {
  const r = parseLandline(input);
  if (!r.valid) return null;
  switch (options.format ?? 'international') {
    case 'e164':
      return r.e164;
    case 'national':
      return `0${r.areaCode}-${r.subscriber}`;
    default:
      return `+977 ${r.areaCode}-${r.subscriber}`;
  }
}
