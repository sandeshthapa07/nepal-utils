export type Locale = 'en' | 'ne';

export function assertLocale(locale: unknown): asserts locale is Locale {
  if (locale !== 'en' && locale !== 'ne') {
    throw new RangeError(`locale must be "en" or "ne", got ${String(locale)}`);
  }
}

export function assertPlaces(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 20) {
    throw new RangeError(`${name} must be an integer from 0 to 20, got ${value}`);
  }
}
