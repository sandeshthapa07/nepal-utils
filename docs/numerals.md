# Numerals

```ts
import { toNepaliDigits, toEnglishDigits, hasDevanagari, isDevanagari } from '@sandeshthapa07/nepal-utils/numerals';
```

## toNepaliDigits(input)

Replaces 0-9 with ०-९ and keeps every other character. It accepts a string, number or bigint.

```ts
toNepaliDigits('Rs. 1,234.50'); // 'Rs. १,२३४.५०'
toNepaliDigits(2081); // '२०८१'
toNepaliDigits(10n); // '१०'
```

Numbers are converted with `String()`, so very large or very small numbers come out in exponent form. To get every digit, pass a string or use `formatNPR` with `locale: 'ne'`.

```ts
toNepaliDigits(1e21); // '१e+२१'
```

## toEnglishDigits(input)

Replaces ०-९ with 0-9 and keeps every other character. Use it before you store, compare or do arithmetic on numbers typed with a Nepali keyboard.

```ts
toEnglishDigits('९८४१२३४५६७'); // '9841234567'
toEnglishDigits('रु. १२,३४५'); // 'रु. 12,345'
Number(toEnglishDigits('२०८१')); // 2081
```

## hasDevanagari(text)

Returns true if the text contains at least one Devanagari character (U+0900–U+097F).

```ts
hasDevanagari('hello नमस्ते'); // true
hasDevanagari('hello'); // false
```

## isDevanagari(text)

Returns true if the text contains Devanagari and no letters or digits from any other script. Whitespace, punctuation, symbols and the zero-width joiners used in some Nepali conjuncts are allowed.

```ts
isDevanagari('नमस्ते, संसार!'); // true
isDevanagari('काठमाडौँ।'); // true
isDevanagari('१२३'); // true
isDevanagari('नमस्ते world'); // false
isDevanagari('नमस्ते 123'); // false
isDevanagari(''); // false
```

This checks the script, not the language, so Hindi or Marathi text also returns true.
