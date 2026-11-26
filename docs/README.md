# nepal-utils documentation

| Module | Import path | What it covers |
|---|---|---|
| [Currency](currency.md) | `@sandeshthapa07/nepal-utils/currency` | Format, parse, shorten and spell out NPR amounts |
| [Numerals](numerals.md) | `@sandeshthapa07/nepal-utils/numerals` | ASCII ↔ Devanagari digits, detecting Devanagari text |
| [Validators](validators.md) | `@sandeshthapa07/nepal-utils/validators` | Mobile, landline, PAN, postal code |

Everything is also exported from the package root, `@sandeshthapa07/nepal-utils`. Importing a subpath only loads that module.

The package works in Node 18+ and in browsers, and it ships both ESM (`import`) and CommonJS (`require`) builds with TypeScript types.

## How functions behave on bad input

| Kind of function | On bad input |
|---|---|
| Formatting a value you control: `formatNPR`, `formatCompact`, `toWords` | Throws `RangeError` (bad number or option) or `TypeError` (bad numeric string) |
| Reading user input: `parseNPR`, `formatMobile`, `formatLandline` | Returns `null` |
| Validators: `parseX` / `isValidX` | Never throws. Returns `{ valid: false, error }` or `false` |

Anywhere the package reads input, Devanagari digits (०-९) are accepted as well as 0-9.

## The examples in these docs are tests

`tests/docs.test.ts` runs every line in a `ts` code block in these docs and in the main README that looks like this:

    expression; // expected value

It also runs examples where the expected value is on the next line, as a comment. `// throws RangeError` checks that the call throws that error. If a change to the code makes an example wrong, the test suite fails until the docs are updated.
