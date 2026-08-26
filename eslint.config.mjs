import { defineConfig } from 'eslint/config'
import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import * as mdx from 'eslint-plugin-mdx'

// NOTE ON THE FlatCompat LAYER THAT USED TO BE HERE.
//
// This config previously wrapped `next/core-web-vitals` in `FlatCompat` from
// @eslint/eslintrc, which translates legacy .eslintrc-style configs into flat
// config. eslint-config-next 16 ships a real flat config array, so the shim is
// no longer just redundant -- it throws
// `TypeError: Converting circular structure to JSON` while trying to validate
// a config that was never eslintrc-shaped. Importing the native export removes
// the translation layer and @eslint/eslintrc along with it.
export default defineConfig([
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'public/**',
      'docs/**',
      'node_modules/**',
      'accessibility-reports/**',
    ],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextCoreWebVitals,
  {
    ...mdx.flat,
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      languageMapper: {},
    }),
    rules: {
      'react/no-unescaped-entities': 'off',
      // Components are supplied through the MDXRemote `components` prop, so
      // the linter cannot see their definitions.
      'react/jsx-no-undef': 'off',
    },
  },
  {
    ...mdx.flatCodeBlocks,
    rules: {
      ...mdx.flatCodeBlocks.rules,
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: [
      'next.config.js',
      'tailwind.config.js',
      'jest.config.js',
      'postcss.config.js',
      'next-sitemap.config.js',
      'scripts/**/*.js',
      '*.cjs',
    ],
    languageOptions: { sourceType: 'script' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Must stay last: switches off every rule that would fight Prettier.
  eslintConfigPrettier,
])
