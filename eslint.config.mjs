import { createRequire } from 'node:module'
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import * as mdx from 'eslint-plugin-mdx'

const require = createRequire(import.meta.url)

// eslint-config-next sets `react: { version: 'detect' }`. Detection reads the
// installed React through an ESLint API surface that has moved between majors,
// so it is pinned here instead: same answer, no sniffing, and faster.
const reactVersion = require('react/package.json').version

// Flat config has no `--ext` (removed in ESLint 10), so the file set is
// declared here and the lint script is just `eslint .`.
//
// APP is everything eslint-config-next should own. Scoping it matters: Next's
// config installs @typescript-eslint/parser for every file it matches, and
// @typescript-eslint/scope-manager 8.x does not implement the `addGlobals`
// method ESLint 10 calls when a `sourceType: 'script'` file declares globals.
// Left unscoped, that combination crashes on the CommonJS configs below.
// Revisit when typescript-eslint ships full ESLint 10 scope-manager support.
const APP = [
  'src/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
]

// CommonJS build/tool configs. Plain espree, Node globals, no React rules.
const NODE_CJS = [
  'next.config.js',
  'tailwind.config.js',
  'jest.config.js',
  'postcss.config.js',
  'next-sitemap.config.js',
  'scripts/**/*.js',
  '*.cjs',
]

const TS_RECOMMENDED_RULES = Object.assign(
  {},
  ...tseslint.configs.recommended.map((c) => c.rules ?? {})
)

// Only MDX that ships as site content. eslint-plugin-mdx defaults to every
// `**/*.{md,mdx}` in the repo, which drags in README.md and the .claude /
// .cursor agent docs — prose no lint rule has a useful opinion about.
const MDX_CONTENT = ['src/resources/**/*.mdx']

export default defineConfig([
  {
    ignores: [
      '.next/**',
      '.yarn/**',
      '.pnp.*',
      'coverage/**',
      'public/**',
      'docs/**',
      'accessibility-reports/**',
    ],
  },

  { files: APP, languageOptions: { globals: globals.browser } },
  { files: APP, ...js.configs.recommended },
  ...nextCoreWebVitals.map((c) => ({ ...c, files: APP })),
  // Rules only. eslint-config-next 16 already registers the `@typescript-eslint`
  // plugin via `next/typescript`, and a second registration is a hard config
  // error, so the recommended set is flattened onto the existing plugin.
  { files: APP, rules: TS_RECOMMENDED_RULES },
  { files: APP, settings: { react: { version: reactVersion } } },

  {
    files: NODE_CJS,
    ...js.configs.recommended,
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    // Default espree parser. The plugin is registered so the two overrides
    // below can name it: `require` is the correct idiom in these files, and
    // the overrides keep it correct if they ever come under a config that
    // switches the TypeScript rules on.
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    files: ['jest.setup.js'],
    ...js.configs.recommended,
    languageOptions: { sourceType: 'module', globals: globals.node },
  },
  {
    files: ['scripts/**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: { sourceType: 'module', globals: globals.node },
  },

  {
    ...mdx.flat,
    files: MDX_CONTENT,
    // Fenced blocks here are illustrative prompts and shell snippets, not
    // compilable sources. Linting them also re-enters the linter through
    // eslint-plugin-mdx's processor, the one path in this stack that has not
    // kept up with ESLint's SourceCode API.
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: false,
      languageMapper: {},
    }),
    rules: {
      'react/no-unescaped-entities': 'off',
      // MDX components arrive via MDXRemote's `components` prop, so they are
      // undefined at lint time by construction. Note the rule that actually
      // fires is core `no-undef`, not `react/jsx-no-undef`.
      'no-undef': 'off',
      'react/jsx-no-undef': 'off',
    },
  },

  // Last: switches off the stylistic rules the configs above enable, so
  // Prettier owns formatting outright.
  eslintConfigPrettier,
])
