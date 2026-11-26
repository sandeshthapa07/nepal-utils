import { toEnglishDigits } from '../numerals/index.js';

/**
 * Why a value failed. Codes rather than sentences, so apps can show their own
 * (translated) messages.
 */
export type ValidationErrorCode =
  | 'EMPTY'
  | 'INVALID_CHARACTERS'
  | 'INVALID_LENGTH'
  /** Wrong leading digits, area code or country code. */
  | 'INVALID_PREFIX'
  /** Mobile prefix belongs to an operator that is no longer in service. */
  | 'INACTIVE_PREFIX';

export type ParseResult<T> = ({ valid: true } & T) | { valid: false; error: ValidationErrorCode };

/** 'international' → "+977 984-1234567", 'national' → "984-1234567", 'e164' → "+9779841234567". */
export type PhoneFormat = 'international' | 'national' | 'e164';

const SEPARATORS = /[\s\-.()]/g;

/** Devanagari digits → ASCII, separators removed. Non-string, non-number input → ''. */
export function cleanInput(input: unknown): string {
  if (typeof input === 'number' || typeof input === 'bigint') return String(input);
  if (typeof input !== 'string') return '';
  return toEnglishDigits(input).replace(SEPARATORS, '');
}

export function invalid(error: ValidationErrorCode): { valid: false; error: ValidationErrorCode } {
  return { valid: false, error };
}
