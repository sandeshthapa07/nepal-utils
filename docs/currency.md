# Currency

```ts
import { formatNPR, parseNPR, formatCompact, toWords } from '@sandeshthapa07/nepal-utils/currency';
```

- [Input values](#input-values)
- [formatNPR](#formatnprvalue-options)
- [parseNPR](#parsenprinput)
- [formatCompact](#formatcompactvalue-options)
- [toWords](#towordsvalue-options)
- [Types](#types)

## Input values

`formatNPR`, `formatCompact` and `toWords` take a `NumericInput`:

| Type | Example | Notes |
|---|---|---|
| `number` | `1234567.5` | Must be finite. Read from its shortest decimal form, so `1.005` means exactly 1.005 |
| `string` | `'1234567.50'`, `'१२३४.५'` | Exact. An optional sign, digits and an optional decimal point. Devanagari digits are allowed. Commas and symbols are not allowed; use `parseNPR` to read those |
| `bigint` | `10n ** 12n` | Exact whole amounts of any size |

To keep every digit of an amount larger than 2^53 (about 90 lakh crore), pass it as a string or bigint.

```ts
formatNPR('12345678901234567890.99'); // 'Rs. 1,23,45,67,89,01,23,45,67,890.99'
formatNPR('१२३४.५'); // 'Rs. 1,234.50'
formatNPR(10n ** 12n); // 'Rs. 10,00,00,00,00,000.00'
formatNPR(Infinity); // throws RangeError
formatNPR('1,000'); // throws TypeError
```

## formatNPR(value, options?)

Formats an amount in rupees with lakh/crore digit grouping.

```ts
formatNPR(1234567.5); // 'Rs. 12,34,567.50'
formatNPR(1234567.5, { locale: 'ne' }); // 'रु. १२,३४,५६७.५०'
```

| Option | Type | Default | |
|---|---|---|---|
| `locale` | `'en' \| 'ne'` | `'en'` | `'ne'` prints Devanagari digits and changes the default symbol |
| `symbol` | `string \| false` | `'Rs.'` for en, `'रु.'` for ne | Text before the amount; `false` for none |
| `decimals` | `number` | `2` | Integer from 0 to 20 |
| `stripZeroDecimals` | `boolean` | `false` | Leave out decimals that are all zero |
| `rounding` | `'half-up' \| 'half-even' \| 'truncate'` | `'half-up'` | See [Rounding](#rounding) |
| `grouping` | `'lakh' \| 'international' \| 'none'` | `'lakh'` | |
| `negative` | `'minus' \| 'parentheses'` | `'minus'` | |

The default symbols are exported as `DEFAULT_SYMBOL`:

```ts
DEFAULT_SYMBOL.en; // 'Rs.'
DEFAULT_SYMBOL.ne; // 'रु.'
```

### Symbol

```ts
formatNPR(1500, { symbol: 'NPR' }); // 'NPR 1,500.00'
formatNPR(1500, { symbol: false }); // '1,500.00'
formatNPR(1500, { locale: 'ne', symbol: 'Rs.' }); // 'Rs. १,५००.००'
```

### Decimals

```ts
formatNPR(1234567.5, { decimals: 0 }); // 'Rs. 12,34,568'
formatNPR(500, { stripZeroDecimals: true }); // 'Rs. 500'
formatNPR(500.5, { stripZeroDecimals: true }); // 'Rs. 500.50'
```

### Rounding

Rounding works on the decimal digits, not the binary floating-point value. For comparison, JavaScript's `(1.005).toFixed(2)` gives `'1.00'`.

- `'half-up'` rounds ties away from zero.
- `'half-even'` is banker's rounding: ties go to the even digit.
- `'truncate'` drops the extra digits.

```ts
formatNPR(1.005); // 'Rs. 1.01'
formatNPR(0.1 + 0.2); // 'Rs. 0.30'
formatNPR(2.665, { rounding: 'half-even' }); // 'Rs. 2.66'
formatNPR(2.675, { rounding: 'half-even' }); // 'Rs. 2.68'
formatNPR(9.999, { rounding: 'truncate' }); // 'Rs. 9.99'
formatNPR(99999.999); // 'Rs. 1,00,000.00'
```

### Grouping

```ts
formatNPR(1234567.5, { grouping: 'international' }); // 'Rs. 1,234,567.50'
formatNPR(1234567.5, { grouping: 'none' }); // 'Rs. 1234567.50'
```

### Negative amounts

An amount that rounds to zero is never shown as negative.

```ts
formatNPR(-500); // '-Rs. 500.00'
formatNPR(-500, { negative: 'parentheses' }); // '(Rs. 500.00)'
formatNPR(-0.001); // 'Rs. 0.00'
```

### Errors

- `RangeError`: the value is `NaN` or `Infinity`; `decimals` is not an integer from 0 to 20; or `locale`, `rounding` or `grouping` has an unknown value.
- `TypeError`: the string is not a plain number, or the value is not a number, string or bigint.

```ts
formatNPR(1, { decimals: 21 }); // throws RangeError
```

## parseNPR(input)

Reads an amount from text. Returns a `number`, or `null` if the text is not an amount.

```ts
parseNPR('Rs. 12,34,567.50'); // 1234567.5
parseNPR('रु. १२,३४,५६७.५०'); // 1234567.5
parseNPR('NPR 500'); // 500
parseNPR('Rs. 500/-'); // 500
parseNPR('1,00,000'); // 100000
parseNPR('(Rs. 500.00)'); // -500
parseNPR('-Rs. 500'); // -500
parseNPR('Rs.'); // null
parseNPR('12abc'); // null
```

`parseNPR` ignores:
- **Currency words, in any case:** `Rs`, `Rs.`, `NRs.`, `NPR`, `रु`, `रु.`, `रू`, `₨`, `रुपैयाँ`, `rupee`, `rupees`.
- **Commas and whitespace,** anywhere in the text. Commas aren't checked for position.
- **A trailing `/-`,** as written on cheques and bills.

```ts
parseNPR('1,2,3'); // 123
```

A negative amount can be written with a leading `-` or in parentheses, but not both. `'(-500)'` returns `null`.

The result is a JS `number`, so amounts above 2^53 lose precision. For amounts in whole paisa, `parseNPR(formatNPR(x))` gives back `x`. The tests check this for 1,000 random amounts.

## formatCompact(value, options?)

Shortens a large number using Nepali units.

| Unit (en) | Unit (ne) | Value |
|---|---|---|
| thousand | हजार | 10³ |
| lakh | लाख | 10⁵ |
| crore | करोड | 10⁷ |
| arab | अर्ब | 10⁹ |
| kharab | खर्ब | 10¹¹ |
| neel | नील | 10¹³ |
| padma | पद्म | 10¹⁵ |
| shankha | शंख | 10¹⁷ |

```ts
formatCompact(999); // '999'
formatCompact(1500); // '1.5 thousand'
formatCompact(1500000); // '15 lakh'
formatCompact(12345678); // '1.23 crore'
formatCompact(2500000000); // '2.5 arab'
formatCompact(1500000, { locale: 'ne' }); // '१५ लाख'
formatCompact(-1500000); // '-15 lakh'
```

| Option | Default | |
|---|---|---|
| `locale` | `'en'` | `'ne'` uses Devanagari digits and Nepali unit names |
| `maxDecimals` | `2` | Most decimals to show; trailing zeros are dropped |
| `symbol` | none | Unlike `formatNPR`, there is no symbol by default, because compact numbers are often not money |
| `rounding` | `'half-up'` | Same modes as `formatNPR` |

```ts
formatCompact(1500000, { symbol: 'Rs.' }); // 'Rs. 15 lakh'
formatCompact(1550000, { maxDecimals: 0 }); // '16 lakh'
```

If rounding reaches the next unit, the next unit is used:

```ts
formatCompact(9999999); // '1 crore'
formatCompact(99999); // '1 lakh'
```

Above one shankha, the number in front of "shankha" just keeps growing:

```ts
formatCompact(10n ** 20n); // '1,000 shankha'
```

## toWords(value, options?)

Writes an amount in words using the Nepali number system, as on cheques.

```ts
toWords(123456.5);
// 'One Lakh Twenty-Three Thousand Four Hundred Fifty-Six Rupees and Fifty Paisa Only'
toWords(123456.5, { locale: 'ne' });
// 'एक लाख तेइस हजार चार सय छपन्न रुपैयाँ पचास पैसा मात्र'
```

| Option | Default | |
|---|---|---|
| `locale` | `'en'` | `'en'` or `'ne'` |
| `currency` | `true` | `false` reads a plain number instead of rupees and paisa |
| `only` | `true` | End currency amounts with "Only" / "मात्र" |

Rules for currency amounts:
- The amount is first rounded to whole paisa (half-up).
- Exactly one rupee is "One Rupee".
- English joins rupees and paisa with "and"; Nepali does not.
- Amounts under one rupee are written as paisa only, and zero is "Zero Rupees".
- Negative amounts throw a `RangeError`.

```ts
toWords(1); // 'One Rupee Only'
toWords(1.01); // 'One Rupee and One Paisa Only'
toWords(0.5); // 'Fifty Paisa Only'
toWords(0.5, { locale: 'ne' }); // 'पचास पैसा मात्र'
toWords(0); // 'Zero Rupees Only'
toWords(99.999); // 'One Hundred Rupees Only'
toWords(100, { only: false }); // 'One Hundred Rupees'
toWords(-5); // throws RangeError
```

Large amounts use the Nepali scale words (lakh, crore, arab, ...) in both languages. English numbers don't use "and" inside them, so it's "Four Hundred Fifty-Six", not "Four Hundred and Fifty-Six".

```ts
toWords(1234567890);
// 'One Arab Twenty-Three Crore Forty-Five Lakh Sixty-Seven Thousand Eight Hundred Ninety Rupees Only'
toWords(21000000, { locale: 'ne' }); // 'दुई करोड दश लाख रुपैयाँ मात्र'
toWords(10n ** 19n); // 'One Hundred Shankha Rupees Only'
```

With `currency: false`, the digits after the decimal point are read one by one, and trailing zeros are dropped:

```ts
toWords(12.5, { currency: false }); // 'Twelve Point Five'
toWords('3.05', { currency: false }); // 'Three Point Zero Five'
toWords(12.5, { currency: false, locale: 'ne' }); // 'बाह्र दशमलव पाँच'
toWords(0, { currency: false }); // 'Zero'
```

### Nepali spelling

Nepali has a separate word for every number from 1 to 99 (99 is उनान्सय), so all 100 are listed in a table in `src/currency/words.ts`. Several of them have more than one accepted spelling, such as तेइस / तेईस and उन्नाइस / उन्नाईस. This package uses one common modern set. If your organisation follows a different style guide, post-process the output or open an issue.

## Types

```ts
type Locale = 'en' | 'ne';
type NumericInput = number | string | bigint;
type RoundingMode = 'half-up' | 'half-even' | 'truncate';
type Grouping = 'lakh' | 'international' | 'none';
```

The options interfaces `FormatNPROptions`, `FormatCompactOptions` and `ToWordsOptions` are exported too.
