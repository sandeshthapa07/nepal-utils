import { assertLocale, type Locale } from '../internal/assert.js';
import { roundDecimal, toDecimal, type NumericInput } from '../internal/decimal.js';

const EN_UNDER_20 = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

// Nepali names for 0–99. Unlike English they can't be built from tens + ones,
// so every one is listed. Spellings follow common modern usage; variants exist
// (e.g. तेइस / तेईस, उन्नाइस / उन्नाईस).
export const NE_UNDER_100 = [
  'शून्य', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ',
  'दश', 'एघार', 'बाह्र', 'तेह्र', 'चौध', 'पन्ध्र', 'सोह्र', 'सत्र', 'अठार', 'उन्नाइस',
  'बीस', 'एक्काइस', 'बाइस', 'तेइस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनन्तीस',
  'तीस', 'एकतीस', 'बत्तीस', 'तेत्तीस', 'चौँतीस', 'पैँतीस', 'छत्तीस', 'सैँतीस', 'अठतीस', 'उनन्चालीस',
  'चालीस', 'एकचालीस', 'बयालीस', 'त्रिचालीस', 'चवालीस', 'पैँतालीस', 'छयालीस', 'सतचालीस', 'अठचालीस', 'उनन्चास',
  'पचास', 'एकाउन्न', 'बाउन्न', 'त्रिपन्न', 'चवन्न', 'पचपन्न', 'छपन्न', 'सन्ताउन्न', 'अन्ठाउन्न', 'उनन्साठी',
  'साठी', 'एकसट्ठी', 'बयसट्ठी', 'त्रिसट्ठी', 'चौँसट्ठी', 'पैँसट्ठी', 'छयसट्ठी', 'सतसट्ठी', 'अठसट्ठी', 'उनन्सत्तरी',
  'सत्तरी', 'एकहत्तर', 'बहत्तर', 'त्रिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छयहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'असी', 'एकासी', 'बयासी', 'त्रियासी', 'चौरासी', 'पचासी', 'छयासी', 'सतासी', 'अठासी', 'उनान्नब्बे',
  'नब्बे', 'एकानब्बे', 'बयानब्बे', 'त्रियानब्बे', 'चौरानब्बे', 'पन्चानब्बे', 'छयानब्बे', 'सन्तानब्बे', 'अन्ठानब्बे', 'उनान्सय',
] as const;

const WORDS = {
  en: { hundred: 'Hundred', point: 'Point', rupee: 'Rupee', rupees: 'Rupees', paisa: 'Paisa', and: 'and', only: 'Only' },
  ne: { hundred: 'सय', point: 'दशमलव', rupee: 'रुपैयाँ', rupees: 'रुपैयाँ', paisa: 'पैसा', and: '', only: 'मात्र' },
} as const;

// Largest first. Above shankha the multiplier itself is read out ("One Hundred Shankha").
const SCALES = [
  { value: 10n ** 17n, en: 'Shankha', ne: 'शंख' },
  { value: 10n ** 15n, en: 'Padma', ne: 'पद्म' },
  { value: 10n ** 13n, en: 'Neel', ne: 'नील' },
  { value: 10n ** 11n, en: 'Kharab', ne: 'खर्ब' },
  { value: 10n ** 9n, en: 'Arab', ne: 'अर्ब' },
  { value: 10n ** 7n, en: 'Crore', ne: 'करोड' },
  { value: 10n ** 5n, en: 'Lakh', ne: 'लाख' },
  { value: 10n ** 3n, en: 'Thousand', ne: 'हजार' },
] as const;

export interface ToWordsOptions {
  /** 'en' (default) or 'ne'. */
  locale?: Locale;
  /**
   * true (default): read as rupees and paisa, rounded to 2 decimals.
   * false: read as a plain number ("Twelve Point Five").
   */
  currency?: boolean;
  /** End currency amounts with "Only" / "मात्र", as written on cheques. Default true. */
  only?: boolean;
}

/**
 * Write an amount in words using the Nepali number system (lakh, crore, arab, ...).
 *
 * @example toWords(123456.5)
 * // 'One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Rupees and Fifty Paisa Only'
 * @example toWords(123456.5, { locale: 'ne' })
 * // 'एक लाख तेइस हजार चार सय छपन्न रुपैयाँ पचास पैसा मात्र'
 */
export function toWords(value: NumericInput, options: ToWordsOptions = {}): string {
  const { locale = 'en', currency = true, only = true } = options;
  assertLocale(locale);
  const w = WORDS[locale];
  const d = toDecimal(value);
  if (d.negative) throw new RangeError('toWords() does not support negative values');

  if (!currency) {
    const parts = d.int === '0' ? [under100(0, locale)] : integerWords(BigInt(d.int), locale);
    if (d.frac) parts.push(w.point, ...Array.from(d.frac, (c) => under100(Number(c), locale)));
    return parts.join(' ');
  }

  const r = roundDecimal(d, 2, 'half-up');
  const rupees = BigInt(r.int);
  const paisa = Number(r.frac);
  const parts: string[] = [];
  if (rupees > 0n || paisa === 0) {
    parts.push(...(rupees === 0n ? [under100(0, locale)] : integerWords(rupees, locale)));
    parts.push(rupees === 1n ? w.rupee : w.rupees);
  }
  if (paisa > 0) {
    if (parts.length > 0 && w.and) parts.push(w.and);
    parts.push(under100(paisa, locale), w.paisa);
  }
  if (only) parts.push(w.only);
  return parts.join(' ');
}

function under100(n: number, locale: Locale): string {
  if (locale === 'ne') return NE_UNDER_100[n]!;
  if (n < 20) return EN_UNDER_20[n]!;
  const tens = EN_TENS[Math.floor(n / 10)]!;
  return n % 10 === 0 ? tens : `${tens}-${EN_UNDER_20[n % 10]!}`;
}

function integerWords(n: bigint, locale: Locale): string[] {
  if (n === 0n) return [];
  if (n < 100n) return [under100(Number(n), locale)];
  if (n < 1000n) {
    return [under100(Number(n / 100n), locale), WORDS[locale].hundred, ...integerWords(n % 100n, locale)];
  }
  const scale = SCALES.find((s) => n >= s.value)!;
  return [...integerWords(n / scale.value, locale), scale[locale], ...integerWords(n % scale.value, locale)];
}
