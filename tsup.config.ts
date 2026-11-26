import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'numerals/index': 'src/numerals/index.ts',
    'currency/index': 'src/currency/index.ts',
    'validators/index': 'src/validators/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2020',
  treeshake: true,
});
