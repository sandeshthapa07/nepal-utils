import { cleanInput, invalid, type ParseResult, type PhoneFormat } from './common.js';

export type MobileOperator = 'ntc' | 'ncell' | 'smart' | 'utl' | 'hello';

export interface MobileOperatorInfo {
  readonly id: MobileOperator;
  readonly name: string;
  /** Whether the operator is still in service. */
  readonly active: boolean;
  readonly prefixes: readonly string[];
}

/**
 * Mobile number ranges (first 3 of the 10 digits), checked November 2026 against
 * nepalitelecom.com's range list and NTA's May 2025 allocation of 971 to Ncell.
 * As of 2026 only Nepal Telecom and Ncell operate. Update this table when NTA
 * allocates new ranges.
 */
export const MOBILE_OPERATORS: readonly MobileOperatorInfo[] = [
  { id: 'ntc', name: 'Nepal Telecom', active: true, prefixes: ['984', '985', '986', '974', '975', '976'] },
  { id: 'ncell', name: 'Ncell', active: true, prefixes: ['980', '981', '982', '970', '971'] },
  { id: 'smart', name: 'Smart Cell', active: false, prefixes: ['961', '962', '988'] },
  { id: 'utl', name: 'UTL', active: false, prefixes: ['972'] },
  { id: 'hello', name: 'Hello Mobile', active: false, prefixes: ['963'] },
];

const OPERATOR_BY_PREFIX = new Map<string, MobileOperatorInfo>();
for (const op of MOBILE_OPERATORS) for (const p of op.prefixes) OPERATOR_BY_PREFIX.set(p, op);

export interface MobileOptions {
  /**
   * Which prefixes count as valid:
   * - 'active' (default): operators still in service (Nepal Telecom, Ncell)
   * - 'known': every range in MOBILE_OPERATORS, including defunct operators
   * - 'any': any 10-digit number starting with 9, for ranges this table doesn't know yet
   */
  prefixes?: 'active' | 'known' | 'any';
}

export interface MobileNumber {
  /** 10-digit national number, e.g. "9841234567". */
  normalized: string;
  /** "+9779841234567" */
  e164: string;
  /** First three digits, e.g. "984". */
  prefix: string;
  /** null when the prefix is not in MOBILE_OPERATORS (only with `prefixes: 'any'`). */
  operator: MobileOperator | null;
}

/**
 * Check a Nepali mobile number and return its normalized form and operator.
 * Accepts "9841234567", "+977-984-1234567", "00977 9841234567", "९८४१२३४५६७", etc.
 */
export function parseMobile(input: unknown, options: MobileOptions = {}): ParseResult<MobileNumber> {
  const accept = options.prefixes ?? 'active';
  const s = cleanInput(input);
  if (s === '') return invalid('EMPTY');
  if (!/^\+?\d+$/.test(s)) return invalid('INVALID_CHARACTERS');

  let national = s;
  if (s.startsWith('+977')) national = s.slice(4);
  else if (s.startsWith('00977')) national = s.slice(5);
  else if (s.startsWith('977') && s.length === 13) national = s.slice(3);

  if (national.startsWith('+')) return invalid('INVALID_PREFIX'); // another country's code
  if (national.length !== 10) return invalid('INVALID_LENGTH');
  if (!national.startsWith('9')) return invalid('INVALID_PREFIX');

  const prefix = national.slice(0, 3);
  const op = OPERATOR_BY_PREFIX.get(prefix);
  if (!op && accept !== 'any') return invalid('INVALID_PREFIX');
  if (op && !op.active && accept === 'active') return invalid('INACTIVE_PREFIX');

  return { valid: true, normalized: national, e164: `+977${national}`, prefix, operator: op ? op.id : null };
}

export function isValidMobile(input: unknown, options?: MobileOptions): boolean {
  return parseMobile(input, options).valid;
}

/**
 * Format a mobile number, or return null if it isn't one. Only checks the number's
 * shape, not the operator; use isValidMobile for that.
 *
 * @example formatMobile('9841234567') // '+977 984-1234567'
 */
export function formatMobile(input: unknown, options: { format?: PhoneFormat } = {}): string | null {
  const r = parseMobile(input, { prefixes: 'any' });
  if (!r.valid) return null;
  const n = r.normalized;
  switch (options.format ?? 'international') {
    case 'e164':
      return r.e164;
    case 'national':
      return `${n.slice(0, 3)}-${n.slice(3)}`;
    default:
      return `+977 ${n.slice(0, 3)}-${n.slice(3)}`;
  }
}
