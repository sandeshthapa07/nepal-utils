// Runs every example in the documentation, so the docs can't drift from the code.
//
// Inside ```ts blocks in README.md and docs/*.md, an example is either
//   expression; // expected
// or
//   expression;
//   // expected
// where `expected` is a JS literal, or `throws SomeError`.

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as lib from '../src/index.js';

interface Example {
  file: string;
  line: number;
  expr: string;
  expected: string;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOC_FILES = [
  'README.md',
  ...readdirSync(join(ROOT, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/${f}`),
];

// Declarations and statements in code blocks that are illustrations, not examples.
const NOT_AN_EXAMPLE = /^(?:import|export|const|let|var|type|interface|function|if|return)\b/;
const SAME_LINE = /^(.+?);\s*\/\/\s*(.+)$/;
const COMMENT_LINE = /^\/\/\s*(.+)$/;

function extractExamples(file: string): Example[] {
  const lines = readFileSync(join(ROOT, file), 'utf8').split(/\r?\n/);
  const examples: Example[] = [];
  let fence: 'ts' | 'other' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (line.startsWith('```')) {
      fence = fence === null ? (/^```(?:ts|typescript)$/.test(line) ? 'ts' : 'other') : null;
      continue;
    }
    if (fence !== 'ts' || NOT_AN_EXAMPLE.test(line)) continue;

    const same = SAME_LINE.exec(line);
    if (same) {
      examples.push({ file, line: i + 1, expr: same[1]!, expected: same[2]! });
      continue;
    }
    const next = COMMENT_LINE.exec(lines[i + 1]?.trim() ?? '');
    if (line.endsWith(';') && !line.includes('//') && next) {
      examples.push({ file, line: i + 1, expr: line.slice(0, -1), expected: next[1]! });
      i++;
    }
  }
  return examples;
}

const NAMES = Object.keys(lib);
const VALUES = Object.values(lib);
const ERRORS: Record<string, new (...args: never[]) => Error> = { Error, RangeError, TypeError };

/** Evaluate a snippet with every library export in scope. */
function evaluate(code: string): unknown {
  return new Function(...NAMES, `"use strict"; return (${code});`)(...VALUES);
}

const examples = DOC_FILES.flatMap(extractExamples);

describe('documentation examples', () => {
  it('finds examples in every doc file that has ts code blocks', () => {
    const withCode = DOC_FILES.filter((f) => /^```ts$/m.test(readFileSync(join(ROOT, f), 'utf8')));
    expect(withCode.length).toBeGreaterThanOrEqual(4);
    for (const file of withCode) {
      expect(
        examples.some((e) => e.file === file),
        `no examples found in ${file}`,
      ).toBe(true);
    }
    expect(examples.length).toBeGreaterThan(100);
  });

  for (const ex of examples) {
    it(`${ex.file}:${ex.line}  ${ex.expr}`, () => {
      const throws = /^throws (\w+)$/.exec(ex.expected);
      if (throws) {
        const ErrorType = ERRORS[throws[1]!];
        if (!ErrorType) throw new Error(`Unknown error type in docs: ${throws[1]}`);
        expect(() => evaluate(ex.expr)).toThrow(ErrorType);
        return;
      }

      let expected: unknown;
      try {
        expected = evaluate(ex.expected);
      } catch {
        throw new Error(`Expected value is not a JS literal: ${ex.expected}`);
      }
      expect(evaluate(ex.expr)).toEqual(expected);
    });
  }
});
