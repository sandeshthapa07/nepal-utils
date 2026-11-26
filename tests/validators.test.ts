import { describe, expect, it } from 'vitest';
import {
  MOBILE_OPERATORS,
  formatLandline,
  formatMobile,
  isValidLandline,
  isValidMobile,
  isValidPAN,
  isValidPostalCode,
  parseLandline,
  parseMobile,
  parsePAN,
} from '../src/validators/index.js';

describe('parseMobile', () => {
  it('accepts common ways of writing a number', () => {
    for (const input of [
      '9841234567',
      '+9779841234567',
      '+977-984-1234567',
      '+977 984 123 4567',
      '00977 9841234567',
      '9779841234567',
      '(984) 1234567',
      '984.123.4567',
      '९८४१२३४५६७',
      ' 984 1234567 ',
      9841234567,
    ]) {
      expect(parseMobile(input), String(input)).toMatchObject({ valid: true, normalized: '9841234567' });
    }
  });

  it('returns normalized form and operator', () => {
    expect(parseMobile('9841234567')).toEqual({
      valid: true,
      normalized: '9841234567',
      e164: '+9779841234567',
      prefix: '984',
      operator: 'ntc',
    });
    expect(parseMobile('9801234567')).toMatchObject({ operator: 'ncell' });
    expect(parseMobile('9711234567')).toMatchObject({ operator: 'ncell' });
    expect(parseMobile('9741234567')).toMatchObject({ operator: 'ntc' });
  });

  it('reports why a number is invalid', () => {
    expect(parseMobile('')).toEqual({ valid: false, error: 'EMPTY' });
    expect(parseMobile(undefined)).toEqual({ valid: false, error: 'EMPTY' });
    expect(parseMobile(null)).toEqual({ valid: false, error: 'EMPTY' });
    expect(parseMobile('98412abcde')).toEqual({ valid: false, error: 'INVALID_CHARACTERS' });
    expect(parseMobile('98412345')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
    expect(parseMobile('98412345678')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
    expect(parseMobile('8841234567')).toEqual({ valid: false, error: 'INVALID_PREFIX' });
    expect(parseMobile('9901234567')).toEqual({ valid: false, error: 'INVALID_PREFIX' });
    expect(parseMobile('+919876543210')).toEqual({ valid: false, error: 'INVALID_PREFIX' });
    expect(parseMobile('09841234567')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
  });

  it('rejects defunct operators unless asked', () => {
    expect(parseMobile('9611234567')).toEqual({ valid: false, error: 'INACTIVE_PREFIX' });
    expect(parseMobile('9611234567', { prefixes: 'known' })).toMatchObject({ valid: true, operator: 'smart' });
    expect(parseMobile('9721234567', { prefixes: 'known' })).toMatchObject({ valid: true, operator: 'utl' });
  });

  it('accepts unknown 9XX ranges with prefixes: any', () => {
    expect(parseMobile('9901234567', { prefixes: 'any' })).toMatchObject({ valid: true, operator: null });
  });

  it('isValidMobile mirrors parseMobile', () => {
    expect(isValidMobile('9841234567')).toBe(true);
    expect(isValidMobile('9611234567')).toBe(false);
    expect(isValidMobile('9611234567', { prefixes: 'known' })).toBe(true);
  });

  it('has no prefix listed twice', () => {
    const all = MOBILE_OPERATORS.flatMap((op) => op.prefixes);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('formatMobile', () => {
  it('formats in each style', () => {
    expect(formatMobile('9841234567')).toBe('+977 984-1234567');
    expect(formatMobile('+977 9841234567', { format: 'national' })).toBe('984-1234567');
    expect(formatMobile('९८४१२३४५६७', { format: 'e164' })).toBe('+9779841234567');
  });
  it('formats any well-formed number, returns null otherwise', () => {
    expect(formatMobile('9611234567')).toBe('+977 961-1234567');
    expect(formatMobile('12345')).toBeNull();
  });
});

describe('parseLandline', () => {
  it('reads Kathmandu Valley numbers', () => {
    expect(parseLandline('01-4123456')).toEqual({
      valid: true,
      normalized: '014123456',
      e164: '+97714123456',
      areaCode: '1',
      subscriber: '4123456',
    });
    expect(parseLandline('01-5123456')).toMatchObject({ areaCode: '1' });
  });

  it('reads numbers outside the valley', () => {
    expect(parseLandline('061-541234')).toMatchObject({ valid: true, areaCode: '61', subscriber: '541234' });
    expect(parseLandline('011-661234')).toMatchObject({ valid: true, areaCode: '11' });
  });

  it('accepts international and Devanagari forms', () => {
    for (const input of ['+977-1-4123456', '+977 01 4123456', '00977 1 4123456', '977 1 4123456', '०१-४१२३४५६']) {
      expect(parseLandline(input), input).toMatchObject({ valid: true, normalized: '014123456' });
    }
  });

  it('reports why a number is invalid', () => {
    expect(parseLandline('')).toEqual({ valid: false, error: 'EMPTY' });
    expect(parseLandline('4123456')).toEqual({ valid: false, error: 'INVALID_PREFIX' });
    expect(parseLandline('01-3123456')).toEqual({ valid: false, error: 'INVALID_PREFIX' });
    expect(parseLandline('0141234567')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
    expect(parseLandline('+9779841234567')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
    expect(parseLandline('01-41234x6')).toEqual({ valid: false, error: 'INVALID_CHARACTERS' });
  });

  it('formats', () => {
    expect(formatLandline('014123456')).toBe('+977 1-4123456');
    expect(formatLandline('061541234', { format: 'national' })).toBe('061-541234');
    expect(formatLandline('01-4123456', { format: 'national' })).toBe('01-4123456');
    expect(formatLandline('014123456', { format: 'e164' })).toBe('+97714123456');
    expect(formatLandline('nope')).toBeNull();
    expect(isValidLandline('01-4123456')).toBe(true);
  });
});

describe('PAN and postal code', () => {
  it('validates PAN', () => {
    expect(parsePAN('123 456 789')).toEqual({ valid: true, normalized: '123456789' });
    expect(isValidPAN('१२३४५६७८९')).toBe(true);
    expect(isValidPAN(123456789)).toBe(true);
    expect(parsePAN('12345678')).toEqual({ valid: false, error: 'INVALID_LENGTH' });
    expect(parsePAN('12345678A')).toEqual({ valid: false, error: 'INVALID_CHARACTERS' });
  });

  it('validates postal codes', () => {
    expect(isValidPostalCode('44600')).toBe(true);
    expect(isValidPostalCode('४४६००')).toBe(true);
    expect(isValidPostalCode('4460')).toBe(false);
    expect(isValidPostalCode('446001')).toBe(false);
  });
});
