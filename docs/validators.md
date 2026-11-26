# Validators

```ts
import { parseMobile, isValidMobile, formatMobile } from '@sandeshthapa07/nepal-utils/validators';
```

| | Details | Yes / no | Format |
|---|---|---|---|
| [Mobile](#mobile) | `parseMobile` | `isValidMobile` | `formatMobile` |
| [Landline](#landline) | `parseLandline` | `isValidLandline` | `formatLandline` |
| [PAN / VAT](#pan) | `parsePAN` | `isValidPAN` | |
| [Postal code](#postal-code) | `parsePostalCode` | `isValidPostalCode` | |

## Input

Every validator takes a value of type `unknown`, so you can pass form values straight in. The value is handled as follows:

- **Strings:** Devanagari digits are converted, and whitespace, `-`, `.`, `(` and `)` are removed.
- **Numbers and bigints:** converted with `String()`. Nothing is removed.
- **Anything else** (`null`, `undefined`, objects): the error is `EMPTY`.

```ts
isValidPAN('१२३-४५६-७८९'); // true
isValidPAN(123456789); // true
parsePAN(null); // { valid: false, error: 'EMPTY' }
```

## Results

`parseX` returns a `ParseResult`:

```ts
type ParseResult<T> = ({ valid: true } & T) | { valid: false; error: ValidationErrorCode };
```

Check `result.valid` first. TypeScript then knows which fields the result has.

| Error code | Meaning |
|---|---|
| `EMPTY` | Nothing entered, or not a string or number |
| `INVALID_CHARACTERS` | Something other than digits (and a leading `+`) is left after separators are removed |
| `INVALID_LENGTH` | Wrong number of digits |
| `INVALID_PREFIX` | Wrong leading digits. Mobile: doesn't start with 9, unknown range, or another country's code. Landline: no `0` or `+977`, or the subscriber number doesn't start with 4, 5 or 6 |
| `INACTIVE_PREFIX` | Mobile only: the range belongs to an operator that is no longer in service |

The codes are meant to be turned into your own messages:

```ts
const messages: Record<ValidationErrorCode, string> = {
  EMPTY: 'Enter your mobile number',
  INVALID_CHARACTERS: 'Use digits only',
  INVALID_LENGTH: 'A mobile number has 10 digits',
  INVALID_PREFIX: 'This is not a Nepali mobile number',
  INACTIVE_PREFIX: 'This operator is no longer in service',
};

const result = parseMobile(input);
if (!result.valid) showError(messages[result.error]);
```

## Mobile

A Nepali mobile number has 10 digits and starts with 9. The validator:
1. removes a country code (`+977`, `00977`, or `977` when 13 digits are entered);
2. checks that 10 digits are left and the first is 9;
3. looks up the first three digits in `MOBILE_OPERATORS`.

```ts
parseMobile('9841234567');
// { valid: true, normalized: '9841234567', e164: '+9779841234567', prefix: '984', operator: 'ntc' }
isValidMobile('+977-984-1234567'); // true
isValidMobile('00977 9801234567'); // true
isValidMobile('९८४१२३४५६७'); // true
isValidMobile(9841234567); // true
parseMobile('98412345'); // { valid: false, error: 'INVALID_LENGTH' }
parseMobile('9901234567'); // { valid: false, error: 'INVALID_PREFIX' }
parseMobile('+919876543210'); // { valid: false, error: 'INVALID_PREFIX' }
```

Nepali mobile numbers are never written with a leading 0, so a leading 0 is rejected:

```ts
parseMobile('09841234567'); // { valid: false, error: 'INVALID_LENGTH' }
```

### Operators

| `operator` | Name | Prefixes | In service |
|---|---|---|---|
| `ntc` | Nepal Telecom | 984, 985, 986, 974, 975, 976 | yes |
| `ncell` | Ncell | 980, 981, 982, 970, 971 | yes |
| `smart` | Smart Cell | 961, 962, 988 | no |
| `utl` | UTL | 972 | no |
| `hello` | Hello Mobile | 963 | no |

The same data is exported as `MOBILE_OPERATORS`:

```ts
MOBILE_OPERATORS.find((op) => op.id === 'ncell')?.prefixes;
// ['980', '981', '982', '970', '971']
```

Sources, checked November 2026:
- the range list on nepalitelecom.com
- the Nepal Telecommunications Authority's allocation of 971 to Ncell (May 2025; numbers issued from December 2025)

When NTA allocates a new range, add it to `src/validators/mobile.ts` and add a test for it.

### The `prefixes` option

| Value | Accepts |
|---|---|
| `'active'` (default) | Ranges of operators still in service. Use for sign-up forms and OTP |
| `'known'` | Also ranges of operators no longer in service. Use for old records |
| `'any'` | Any 10-digit number starting with 9, including ranges allocated after this release. `operator` is `null` for unknown ranges |

```ts
parseMobile('9611234567'); // { valid: false, error: 'INACTIVE_PREFIX' }
isValidMobile('9611234567', { prefixes: 'known' }); // true
parseMobile('9901234567', { prefixes: 'any' });
// { valid: true, normalized: '9901234567', e164: '+9779901234567', prefix: '990', operator: null }
```

### formatMobile(input, { format? })

Returns the formatted number, or `null` if the input isn't one. It only checks the shape of the number, not the operator, so it formats numbers of old operators too.

```ts
formatMobile('9841234567'); // '+977 984-1234567'
formatMobile('9841234567', { format: 'national' }); // '984-1234567'
formatMobile('9841234567', { format: 'e164' }); // '+9779841234567'
formatMobile('9611234567'); // '+977 961-1234567'
formatMobile('12345'); // null
```

## Landline

A fixed-line number has 8 digits after `+977`:
- **Kathmandu Valley:** area code `1` + 7 digits, written `01-4123456`.
- **Elsewhere:** a 2-digit area code + 6 digits, written `061-541234` (Pokhara).
- **Subscriber numbers** start with 4, 5 or 6.

Enter the number with the leading `0`, or with `+977`, `00977` or `977`. A `0` after the country code is tolerated. Without either, the area can't be known, so the error is `INVALID_PREFIX`.

```ts
parseLandline('01-4123456');
// { valid: true, normalized: '014123456', e164: '+97714123456', areaCode: '1', subscriber: '4123456' }
parseLandline('061-541234');
// { valid: true, normalized: '061541234', e164: '+97761541234', areaCode: '61', subscriber: '541234' }
isValidLandline('+977 1 4123456'); // true
isValidLandline('+977 01 4123456'); // true
isValidLandline('०१-४१२३४५६'); // true
parseLandline('4123456'); // { valid: false, error: 'INVALID_PREFIX' }
parseLandline('01-3123456'); // { valid: false, error: 'INVALID_PREFIX' }
parseLandline('0141234567'); // { valid: false, error: 'INVALID_LENGTH' }
```

How the area code is found: if the number starts with `1` and the next digit is 4, 5 or 6, the area code is `1`. Otherwise it is the first two digits.

**Limitation:** area codes are not yet checked against a list of districts. The public lists we found are incomplete and have errors, so checking against them would reject real numbers. Mapping area codes to districts is planned for v0.3.

### formatLandline(input, { format? })

```ts
formatLandline('014123456'); // '+977 1-4123456'
formatLandline('014123456', { format: 'national' }); // '01-4123456'
formatLandline('061541234', { format: 'national' }); // '061-541234'
formatLandline('014123456', { format: 'e164' }); // '+97714123456'
formatLandline('nope'); // null
```

## PAN

A Permanent Account Number from the Inland Revenue Department has 9 digits. VAT registration numbers are the same PAN. Only the format is checked, because there is no public checksum.

```ts
parsePAN('123 456 789'); // { valid: true, normalized: '123456789' }
parsePAN('12345678'); // { valid: false, error: 'INVALID_LENGTH' }
parsePAN('12345678A'); // { valid: false, error: 'INVALID_CHARACTERS' }
```

## Postal code

A Nepal postal code has 5 digits, e.g. 44600 for Kathmandu. Only the format is checked; there is no lookup of post offices yet.

```ts
isValidPostalCode('44600'); // true
parsePostalCode('४४६००'); // { valid: true, normalized: '44600' }
isValidPostalCode('4460'); // false
```

## With form libraries

The validators are plain functions, so they work with any form library. For example, with Zod:

```ts
const schema = z.object({
  phone: z.string().refine((v) => isValidMobile(v), { message: 'Enter a valid Nepali mobile number' }),
});
```
