# @sandeshthapa07/nepal-utils

Nepal-specific helpers that most Nepali apps end up writing for themselves:

- **Currency:** NPR formatting with lakh/crore grouping, compact form ("15 lakh"), and amounts in words in English or Nepali
- **Numerals:** converting between ASCII and Devanagari digits, and detecting Devanagari text
- **Validators:** Nepali mobile numbers (with operator), landline, PAN/VAT and postal code

The package is written in TypeScript, has no runtime dependencies, and ships both ESM and CommonJS builds. It is about 6 KB gzipped, and you can import a single module to keep it smaller.

```sh
npm install @sandeshthapa07/nepal-utils
```

```ts
import { formatNPR, toWords, isValidMobile } from '@sandeshthapa07/nepal-utils';
// or import only one module:
import { formatNPR } from '@sandeshthapa07/nepal-utils/currency';
```

## Currency

```ts
formatNPR(1234567.5);                     // 'Rs. 12,34,567.50'
formatNPR(1234567.5, { locale: 'ne' });   // 'रु. १२,३४,५६७.५०'
formatNPR(500, { stripZeroDecimals: true }); // 'Rs. 500'
formatNPR(-500, { negative: 'parentheses' }); // '(Rs. 500.00)'

parseNPR('रु. १२,३४,५६७.५०');             // 1234567.5
parseNPR('Rs. 500/-');                    // 500
parseNPR('not money');                    // null

formatCompact(1500000);                   // '15 lakh'
formatCompact(12345678);                  // '1.23 crore'
formatCompact(2500000000, { locale: 'ne' }); // '२.५ अर्ब'

toWords(123456.5);
// 'One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Rupees and Fifty Paisa Only'
toWords(123456.5, { locale: 'ne' });
// 'एक लाख तेइस हजार चार सय छपन्न रुपैयाँ पचास पैसा मात्र'
toWords(12.5, { currency: false });       // 'Twelve Point Five'
```

### `formatNPR(value, options?)`

| Option | Default | |
|---|---|---|
| `locale` | `'en'` | `'ne'` prints Devanagari digits |
| `symbol` | `'Rs.'` (en), `'रु.'` (ne) | any string, or `false` for none |
| `decimals` | `2` | 0–20 |
| `stripZeroDecimals` | `false` | `'Rs. 500'` instead of `'Rs. 500.00'` |
| `rounding` | `'half-up'` | `'half-up'` (ties away from zero), `'half-even'`, `'truncate'` |
| `grouping` | `'lakh'` | `'lakh'` (12,34,567), `'international'` (1,234,567), `'none'` |
| `negative` | `'minus'` | `'minus'` → `-Rs. 500.00`, `'parentheses'` → `(Rs. 500.00)` |

**Precision.** Values can be a `number`, a numeric `string` or a `bigint`. Rounding uses the decimal value, so `formatNPR(1.005)` gives `Rs. 1.01` and `formatNPR(0.1 + 0.2)` gives `Rs. 0.30`. For amounts above 2^53, pass a string or bigint to keep every digit. `parseNPR` returns a JS `number`.

**Units.** `formatCompact` and `toWords` use the Nepali units thousand/हजार, lakh/लाख, crore/करोड, arab/अर्ब, kharab/खर्ब, neel/नील, padma/पद्म and shankha/शंख.

**Spelling.** Nepali number names for 1–99 have several accepted spellings (e.g. तेइस / तेईस). This package uses one common modern set.

## Numerals

```ts
toNepaliDigits('Rs. 1,234');     // 'Rs. १,२३४'
toEnglishDigits('९८४१२३४५६७');   // '9841234567'
hasDevanagari('hello नमस्ते');    // true
isDevanagari('नमस्ते, संसार!');   // true  (no Latin letters or ASCII digits)
```

## Validators

Each validator has an `isValidX()` that returns a boolean and a `parseX()` that returns details. Inputs can contain spaces, dashes, dots, parentheses or Devanagari digits.

```ts
parseMobile('+977-984-1234567');
// { valid: true, normalized: '9841234567', e164: '+9779841234567', prefix: '984', operator: 'ntc' }

parseMobile('98412');
// { valid: false, error: 'INVALID_LENGTH' }

formatMobile('9841234567');                         // '+977 984-1234567'
formatMobile('9841234567', { format: 'national' }); // '984-1234567'

parseLandline('01-4123456');
// { valid: true, normalized: '014123456', e164: '+97714123456', areaCode: '1', subscriber: '4123456' }
formatLandline('061541234', { format: 'national' }); // '061-541234'

isValidPAN('123456789');       // true
isValidPostalCode('44600');    // true
```

Errors are returned as codes so your app can show its own (translated) messages:
- `EMPTY`
- `INVALID_CHARACTERS`
- `INVALID_LENGTH`
- `INVALID_PREFIX`
- `INACTIVE_PREFIX`

### Mobile operators

`MOBILE_OPERATORS` lists the known number ranges. As of 2026 only Nepal Telecom and Ncell are in service:

| Operator | Prefixes | In service |
|---|---|---|
| Nepal Telecom (`ntc`) | 984, 985, 986, 974, 975, 976 | yes |
| Ncell (`ncell`) | 980, 981, 982, 970, 971 | yes |
| Smart Cell (`smart`) | 961, 962, 988 | no |
| UTL (`utl`) | 972 | no |
| Hello Mobile (`hello`) | 963 | no |

The `prefixes` option controls which numbers count as valid:
- `'active'` (default): operators still in service
- `'known'`: also old operators
- `'any'`: any 10-digit number starting with 9, for ranges NTA allocates after this release

### Landline

Fixed-line numbers have 8 digits after `+977`:
- Kathmandu Valley: area code `1` + 7 digits
- elsewhere: a 2-digit area code + 6 digits

Subscriber numbers start with 4, 5 or 6. Area codes are not yet checked against a list of districts, because the public lists are incomplete and checking would reject real numbers.

### PAN

A PAN is 9 digits. VAT numbers use the same PAN. Only the format is checked, because there is no public checksum.

## Roadmap

- **v0.2:** Bikram Sambat ↔ AD dates, Nepali month and weekday names, fiscal year (`2081/82`), as `@sandeshthapa07/nepal-utils/date`
- **v0.3:** provinces, districts and local levels (`/geo`), landline area code → district, citizenship, NID, passport and vehicle plate formats
- **v0.4:** Preeti → Unicode, romanized Nepali → Devanagari, Zod adapters

## Development

```sh
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run build       # tsup → dist/ (ESM + CJS + .d.ts)
```

TypeScript is pinned to 6.x because tsup's type-declaration build needs the TypeScript compiler API, which TypeScript 7 does not ship.

## License

MIT
