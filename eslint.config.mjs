import { defineConfig } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import * as mdx from 'eslint-plugin-mdx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    ignores: [
      '.next/**',
      '.yarn/**',
      '.pnp.*',
      'coverage/**',
      'public/**',
      'docs/**',
      'docs/**',
    ],
  },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    extends: compat.extends('next/core-web-vitals', 'prettier'),
  },
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
])
