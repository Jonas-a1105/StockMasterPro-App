// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  // ── Layer boundaries: domain ──────────────────────────────────────────
  {
    files: ['src/modules/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/infrastructure/**'], message: 'Domain must not import infrastructure' },
          { group: ['@nestjs/*'], message: 'Domain must not import NestJS decorators' },
          { group: ['@prisma/*'], message: 'Domain must not import Prisma' },
        ],
      }],
    },
  },
  // ── Layer boundaries: application ─────────────────────────────────────
  {
    files: ['src/modules/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/infrastructure/**'], message: 'Application must not import infrastructure' },
          { group: ['@nestjs/common'], message: 'Application must not import NestJS decorators directly (use @Injectable from @nestjs/common only when needed)' },
        ],
      }],
    },
  },
  // ── Cross-module boundary: block internal imports ─────────────────────
  {
    files: ['src/modules/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: [
              '@modules/*/domain/**/!(*.errors|*.entity|*.vo)',
              '@modules/*/application/**',
              '@modules/*/infrastructure/**',
            ],
            message: 'Modules must only import barrels (index.ts) from other modules, not internal paths',
          },
        ],
      }],
    },
  },
);
