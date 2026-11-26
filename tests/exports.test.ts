import { expect, it } from 'vitest';
import * as root from '../src/index.js';

it('re-exports every module from the package root', () => {
  for (const name of [
    'toNepaliDigits',
    'toEnglishDigits',
    'isDevanagari',
    'hasDevanagari',
    'formatNPR',
    'parseNPR',
    'formatCompact',
    'toWords',
    'parseMobile',
    'isValidMobile',
    'formatMobile',
    'parseLandline',
    'isValidLandline',
    'formatLandline',
    'parsePAN',
    'isValidPAN',
    'parsePostalCode',
    'isValidPostalCode',
  ]) {
    expect(typeof (root as Record<string, unknown>)[name], name).toBe('function');
  }
});
