import { createRequire } from 'node:module'
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import * as mdx from 'eslint-plugin-mdx'

const require = createRequire(import.meta.url)

// eslint-config-next sets `react: { version: 'detect' }`, and detection in
// eslint-plugin-react 7.37.5 calls an ESLint API that v10 removed, so every
// react/* rule throws on load. 7.37.5 is the latest release and peers at
// eslint ^9.7, so there is no version to upgrade to — reading the installed
// version here skips detection while keeping the rules correctly targeted.
// Revisit once eslint-plugin-react ships ESLint 10 support.
const reactVersion = require('react/package.json').version

export default defineConfig([
  {
    ignores: ['.next/**', '.yarn/**', '.pnp.*', 'coverage/**', 'public/**', 'docs/**'],
  },
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Native flat config. Routing this through FlatCompat instead throws
  // "Converting circular structure to JSON" on eslint-config-next >= 16.
  ...nextCoreWebVitals,
  { settings: { react: { version: reactVersion } } },
  {
    ...mdx.flat,
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      languageMapper: {},
    }),
    rules: {
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-undef': 'off', // Components are provided via MDXRemote components prop
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
      'create-report-dir.js',
      '*.cjs',
    ],
    languageOptions: {
      sourceType: 'script',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  // Last: turns off stylistic rules the configs above enable, so Prettier owns
  // formatting outright.
  eslintConfigPrettier,
])
