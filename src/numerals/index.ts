const NEPALI_DIGITS = '०१२३४५६७८९';

/**
 * Replace ASCII digits 0-9 with Devanagari digits ०-९. Other characters are kept.
 *
 * @example toNepaliDigits('Rs. 1,234') // 'Rs. १,२३४'
 */
export function toNepaliDigits(input: string | number | bigint): string {
  return String(input).replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]!);
}

/**
 * Replace Devanagari digits ०-९ with ASCII digits 0-9. Other characters are kept.
 *
 * @example toEnglishDigits('९८४१२३४५६७') // '9841234567'
 */
export function toEnglishDigits(input: string | number | bigint): string {
  return String(input).replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

const DEVANAGARI_CHAR = /[ऀ-ॿ]/;
// Devanagari block, zero-width (non-)joiners used in Nepali conjuncts, whitespace, punctuation, symbols.
const DEVANAGARI_TEXT = /^[ऀ-ॿ‌‍\s\p{P}\p{S}]+$/u;

/** True if the text contains at least one Devanagari character. */
export function hasDevanagari(text: string): boolean {
  return DEVANAGARI_CHAR.test(text);
}

/**
 * True if the text is written in Devanagari: it has Devanagari characters and no
 * letters or digits from other scripts. Spaces, punctuation and symbols are allowed.
 *
 * @example isDevanagari('नमस्ते, संसार!') // true
 * @example isDevanagari('नमस्ते world')  // false
 */
export function isDevanagari(text: string): boolean {
  return hasDevanagari(text) && DEVANAGARI_TEXT.test(text);
}
