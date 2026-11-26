import { cleanInput, invalid, type ParseResult } from './common.js';

function parseDigits(input: unknown, length: number): ParseResult<{ normalized: string }> {
  const s = cleanInput(input);
  if (s === '') return invalid('EMPTY');
  if (!/^\d+$/.test(s)) return invalid('INVALID_CHARACTERS');
  if (s.length !== length) return invalid('INVALID_LENGTH');
  return { valid: true, normalized: s };
}

/**
 * Permanent Account Number issued by the Inland Revenue Department: 9 digits.
 * VAT registration numbers are the same 9-digit PAN. Only the format is checked;
 * there is no public checksum.
 */
export function parsePAN(input: unknown): ParseResult<{ normalized: string }> {
  return parseDigits(input, 9);
}

export function isValidPAN(input: unknown): boolean {
  return parsePAN(input).valid;
}

/** Nepal postal code: 5 digits, e.g. "44600" (Kathmandu). */
export function parsePostalCode(input: unknown): ParseResult<{ normalized: string }> {
  return parseDigits(input, 5);
}

export function isValidPostalCode(input: unknown): boolean {
  return parsePostalCode(input).valid;
}
