// Flat ESLint config: TypeScript + Playwright rules, with Prettier turned off
// so formatting is owned by Prettier alone (no rule conflicts).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'reports/**', 'playwright-report/**', 'test-results/**', 'playwright/.auth/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Playwright's recommended rules apply to the specs.
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // API payloads are intentionally loosely typed
      '@typescript-eslint/no-non-null-assertion': 'off', // used deliberately after not-null expects
    },
  },
  prettier,
);
