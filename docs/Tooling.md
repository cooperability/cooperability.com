# Developer Tooling & Quality Control

This document covers all the developer tooling, automation, and quality control systems used in this project.

## Table of Contents

- [Linting & Formatting](#linting--formatting)
- [Testing](#testing)
- [Automation & Git Hooks](#automation--git-hooks)
- [Security Auditing](#security-auditing)
- [Bundle Analysis](#bundle-analysis)
- [Accessibility Testing](#accessibility-testing)
- [Yarn Plug'n'Play (PnP)](#yarn-plugnplay-pnp)
- [TypeScript Configuration](#typescript-configuration)
- [Component Library (shadcn/ui)](#component-library-shadcnui)

---

## Linting & Formatting

### ESLint

ESLint provides static analysis for JavaScript, TypeScript, JSX, and **MDX** files.

**Configuration:** `eslint.config.mjs`

**Features:**

- Extends `next/core-web-vitals` for Next.js best practices
- TypeScript support via `typescript-eslint`
- MDX support via `eslint-plugin-mdx` with remark processor
- Integrates with Prettier via `eslint-config-prettier` to avoid conflicts

**Available Commands:**

```bash
yarn lint              # Lint all files (.js, .jsx, .ts, .tsx, .mdx)
yarn lint:mdx          # Lint only MDX files
```

**MDX Linting:**

- MDX files are parsed and validated for proper JSX/Markdown mixing
- Catches issues like unclosed tags, improper nesting, and HTML/Markdown conflicts
- Common pitfall: avoid mixing `<br />` tags inside markdown lists - use blank lines instead
- Always add blank lines before/after JSX components within markdown content

### Prettier

Prettier enforces consistent code formatting across the entire codebase.

**Configuration:** `.prettierrc.json`

**Settings:**

- No semicolons (`semi: false`)
- Single quotes (`singleQuote: true`)
- 2-space indentation (`tabWidth: 2`)
- ES5 trailing commas (`trailingComma: "es5"`)
- 80-character line width (`printWidth: 80`)
- MDX-specific: prose wrapping always enabled (`proseWrap: "always"`)

**Available Commands:**

```bash
yarn format            # Format all project files
yarn format:mdx        # Format only MDX files
```

**Integration:**

- Runs automatically on staged files via `lint-staged` (pre-commit hook)
- ESLint is configured to respect Prettier's formatting rules

---

## Testing

### Jest

Jest provides the testing framework with React Testing Library for component testing.

**Configuration:** `jest.config.js`

**Setup:** `jest.setup.js` imports `@testing-library/jest-dom` for enhanced matchers

**Available Commands:**

```bash
yarn test              # Run tests in watch mode
```

**Key Learnings:**

1. **Type Definitions:**
   - Explicitly add `"types": ["jest", "@testing-library/jest-dom"]` to `tsconfig.json` `compilerOptions`
   - This ensures TypeScript recognizes Jest matchers like `toBeInTheDocument()`
   - Restart your IDE/TypeScript server after configuration changes

2. **Mocking `Math.random()` in Components:**
   - When testing components that use `Math.random()` in `useState` initializers, mock `global.Math.random` in `beforeEach()`
   - Recommended strategy: capture initial state → simulate interaction → capture new state → assert they differ
   - Use simple mocks (e.g., return 0.1, then 0.8) to ensure different values

3. **ESLint and `jest.config.js`:**
   - `jest.config.js` uses `require()` for Next.js compatibility
   - Add `// eslint-disable-next-line @typescript-eslint/no-require-imports` above `require()` lines if needed

4. **Integration with `lint-staged`:**
   - Tests run automatically on staged files during pre-commit
   - Uses `--bail --findRelatedTests --passWithNoTests` flags for efficient CI-like behavior

**Testing Best Practices:**

- Write tests alongside features, not after
- Test user behavior, not implementation details
- Use semantic queries (`getByRole`, `getByLabelText`) over test IDs
- Clean up mocks in `afterEach()` with `jest.restoreAllMocks()`

---

## Automation & Git Hooks

### Husky

Husky manages Git hooks to enforce quality checks before commits.

**Configuration:** `.husky/pre-commit`

**Note:** The pre-commit hook is currently commented out for Windows development compatibility. Uncomment for Linux/macOS:

```bash
# .husky/pre-commit
yarn lint-staged
```

### lint-staged

Automatically runs quality checks on staged files before allowing a commit.

**Configuration:** `package.json` → `lint-staged` field

**Current Setup:**

```json
{
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix",
    "jest --bail --findRelatedTests --passWithNoTests"
  ],
  "*.mdx": ["prettier --write", "eslint --fix"]
}
```

**What It Does:**

1. **Format** files with Prettier
2. **Lint** and auto-fix issues with ESLint
3. **Test** related test files with Jest (JS/TS files only)
4. **Validate** MDX syntax (MDX files)

**Benefits:**

- Catches issues before they reach CI
- Ensures consistent code style across the team
- Prevents committing broken tests
- Zero configuration needed for contributors

### Pre-push Security Hook

A security audit runs automatically before every `git push`:

**Configuration:**

- `.husky/pre-push` - macOS / Linux / Git Bash
- `.husky/pre-push.bat` - Windows CMD / PowerShell

**Behavior:**

- Runs `yarn npm audit --severity critical`
- Blocks push if critical vulnerabilities exist
- Bypass with `git push --no-verify` (emergencies only)

---

## Security Auditing

### Overview

Security auditing runs at multiple layers to catch vulnerabilities early:

| Layer | When | Purpose |
|-------|------|---------|
| **Pre-push hook** | Before `git push` | Local feedback |
| **GitHub Actions (PR)** | Every pull request | Gate vulnerable code |
| **GitHub Actions (Cron)** | Weekly (Sunday 2 AM UTC) | Catch newly disclosed vulns |
| **Dependabot** | Continuous | Auto-create fix PRs |

### Commands

```bash
yarn audit              # Full vulnerability report
yarn audit:critical     # Critical severity only (used by CI)
yarn audit:fix          # Attempt automatic fixes
```

### GitHub Actions Workflow

**Configuration:** `.github/workflows/security-audit.yml`

**Triggers:**

- Pull requests to `main`/`master`
- Pushes to `main`/`master`
- Weekly cron schedule (catches newly disclosed vulnerabilities)
- Manual dispatch from GitHub UI

**On failure:** Creates a GitHub issue (scheduled runs only) to alert maintainers.

### Dependabot

**Configuration:** `.github/dependabot.yml`

**Features:**

- Weekly dependency updates (Monday 9 AM ET)
- Groups patch updates to reduce PR noise
- Separate tracking for GitHub Actions dependencies
- Auto-labels PRs with `dependencies` tag

### Responding to Vulnerabilities

1. **Check severity:** `yarn audit`
2. **Update affected package:** Edit `package.json`, run `yarn install`
3. **Verify fix:** `yarn audit:critical` (should show no suggestions)
4. **Push:** Pre-push hook confirms fix before code leaves your machine

---

## Bundle Analysis

### Webpack Bundle Analyzer

Visualizes the size and composition of your production bundles.

**Configuration:** `next.config.js` with `@next/bundle-analyzer`

**Command:**

```bash
yarn analyze
```

**Outputs:**

- `.next/analyze/nodejs.html` - Server-side bundle analysis
- `.next/analyze/edge.html` - Edge runtime bundle analysis

### How to Interpret Results

**🟢 Good Signs:**

- Balanced rectangle sizes (no single massive dependencies)
- Clear separation between vendor code and application code
- Efficient code splitting across routes

**🟡 Monitor These:**

- **date-fns**: Ensure tree-shaking with specific imports: `import { format } from 'date-fns'`
- **@heroicons/react**: Should only include used icons
- **MDX processing libraries**: Necessary but watch for bloat

**🔴 Red Flags:**

- Duplicate dependencies across bundles
- Disproportionately large rectangles
- Unused code from large libraries

### Bundle Optimization Checklist

- [ ] **Import Optimization**: Use specific imports instead of entire libraries
- [ ] **Dynamic Imports**: Use `React.lazy()` or `next/dynamic` for code splitting
- [ ] **Image Optimization**: Leverage Next.js `Image` component
- [ ] **Dependency Audit**: Regular review of bundle impact before adding new dependencies
- [ ] **Tree Shaking**: Verify webpack is eliminating unused code

### Current Bundle Health Status

- ✅ **Lean Runtime Dependencies**: Well-curated dependency list
- ✅ **Modern Stack**: React 19 + Next.js 15 optimizations
- ✅ **Tree-Shakable Libraries**: Most dependencies support tree-shaking
- ⚠️ **Monitor**: MDX stack and date-fns usage patterns

### Performance Monitoring

Combined with Vercel Analytics and Speed Insights, use bundle analysis to:

1. **Identify bottlenecks** before they impact users
2. **Track bundle size over time** as features are added
3. **Optimize critical paths** for better Core Web Vitals

---

## Accessibility Testing

### Automated Testing Suite

Three complementary tools ensure WCAG 2.1 AA compliance:

#### 1. eslint-plugin-jsx-a11y

- **Type:** Static analysis during development
- **What it catches:** Missing alt text, invalid ARIA attributes, non-semantic HTML
- **When it runs:** During `yarn lint` and pre-commit hooks

#### 2. axe-core CLI

- **Type:** Runtime WCAG testing
- **What it catches:** Contrast issues, focus management, live region problems
- **Command:** `yarn access` (starts dev server → runs audits → saves reports)

#### 3. Lighthouse

- **Type:** Comprehensive accessibility audits
- **What it catches:** Performance impact on accessibility, best practices, SEO
- **Runs on:** Home page, demos page, resources page

### Running Accessibility Audits

**Full Suite:**

```bash
yarn access
```

This command:

1. Starts the development server at `http://localhost:3000`
2. Runs ESLint for static analysis
3. Runs Axe-core for WCAG checks (tags: `wcag2aa`)
4. Runs Lighthouse audits on key pages
5. Saves reports to `./accessibility-reports/`

**Review Reports:**

- `accessibility-reports/axe-report.json` - Axe-core findings
- `accessibility-reports/lighthouse-report-*.html` - Lighthouse audits

**After Reviewing:**
Update `src/resources/AccessibilityStatement.mdx` with findings and remediation plans.

### Known Testing Limitations

- Axe CLI sometimes reports false positives for contrast on dynamically themed content
- Pre-hydration testing doesn't always capture themed states accurately
- **Manual browser testing remains the most reliable method for theme-specific accessibility**

### Accessibility Checklist

- [x] Semantic HTML5 structure
- [x] Keyboard navigation support
- [x] ARIA attributes for screen readers
- [x] Responsive design across devices
- [x] WCAG AA color contrast (light and dark themes)
- [x] Automated testing suite integrated
- [ ] **Future:** Playwright + Axe-core for CI-integrated theme testing
- [ ] **Future:** Ensure all iconic buttons have discernible screen reader text

---

## Yarn Plug'n'Play (PnP)

This project uses **Yarn Plug'n'Play (PnP)** instead of traditional `node_modules`.

### What is PnP?

Yarn PnP is a **zero-install** dependency resolution system:

- Dependencies resolve directly from `.pnp.cjs` (the PnP manifest)
- No `node_modules` tree is created
- Faster installs, smaller checkouts, deterministic resolution

### Benefits

- ✅ **Faster CI**: Smaller checkouts and faster dependency resolution
- ✅ **Deterministic**: No phantom packages hiding in sub-folders
- ✅ **Better Editor Integration**: Via Yarn SDKs (`.yarn/sdks/`)
- ✅ **Security**: Explicit dependency resolution prevents supply chain attacks

### Setup for Contributors

**One-time setup after cloning:**

```bash
yarn dlx @yarnpkg/sdks vscode
```

Replace `vscode` with your editor: `vim`, `intellij`, `webstorm`, etc.

**What this does:**

- Generates helper wrappers in `.yarn/sdks/`
- Allows your IDE's TypeScript server, ESLint, and Prettier to traverse the PnP map
- Required for proper IntelliSense and linting

### Important Files

| File              | Purpose                                              | Commit? |
| ----------------- | ---------------------------------------------------- | ------- |
| `.pnp.cjs`        | PnP manifest (part of lockfile)                      | ✅ Yes  |
| `.pnp.loader.mjs` | ESM loader for PnP                                   | ✅ Yes  |
| `.yarn/sdks/**`   | Editor wrappers for PnP-aware tooling                | ✅ Yes  |
| `.yarnrc.yml`     | Yarn configuration (enables PnP, package extensions) | ✅ Yes  |

### Upgrading Yarn

**Non-interactive upgrade:**

```bash
yarn set version 4.10.3
corepack prepare yarn@4.10.3 --activate
yarn install && yarn dedupe --strategy=highest
```

**After upgrading:**

1. Commit the updated `.pnp.cjs` and `yarn.lock`
2. Re-run `yarn dlx @yarnpkg/sdks vscode` if editor integration breaks
3. Verify editors still resolve packages correctly

### Troubleshooting PnP

**Error: Cannot find module './.pnp.cjs'**

- Ensure `corepack enable` has been run (requires admin on Windows)
- Verify `.pnp.cjs` exists and is committed to git
- Check that scripts in `package.json` don't manually require `.pnp.cjs` (Corepack handles this)

**Error: Qualified path resolution failed**

- Remove manual `-r ./.pnp.cjs` prefixes from package.json scripts
- Let Corepack manage the PnP environment

**Missing peer dependency (e.g., `acorn` for `recma-jsx`):**
Add to `.yarnrc.yml`:

```yaml
packageExtensions:
  recma-jsx@*:
    dependencies:
      acorn: '*'
```

### Vercel Deployment

**Configuration:** `vercel.json`

The `installCommand` uses `corepack enable && yarn install --immutable` to ensure Vercel uses the correct Yarn version (v4, not v1 Classic).

**Key Learnings:**

- Vercel may default to Yarn v1 despite `packageManager` field in `package.json`
- Explicitly enabling Corepack in the install command forces correct version
- The `.pnp.cjs` file must be committed to git for deployment to succeed
- Simplified build scripts (no manual PnP loader) prevent resolution errors

---

## TypeScript Configuration

### Explicit vs Implicit Types

The project uses an **explicit** `types` array in `tsconfig.json` `compilerOptions`:

```json
{
  "compilerOptions": {
    "types": [
      "react",
      "react-dom",
      "next",
      "jest",
      "@testing-library/jest-dom",
      "node"
    ]
  }
}
```

### Why Explicit?

| Scenario     | Explicit `types` (current)                              | Omitted `types`                                  |
| ------------ | ------------------------------------------------------- | ------------------------------------------------ |
| **Behavior** | Only listed packages are injected into global namespace | All `@types/*` packages auto-included            |
| **Pros**     | Deterministic globals, cleaner IntelliSense             | Zero maintenance, types "just work"              |
| **Cons**     | Must remember to add every global type                  | Potential for hidden conflicts between libraries |

**Project decision:** We use explicit types to prevent test-only helpers (like `jest-dom`) from leaking into production builds, while ensuring all required runtime globals are available.

**Alternative:** Delete the `types` field entirely to use implicit behavior. **Never** leave it half-populated (e.g., only Jest) or JSX support will break.

### Multiple tsconfig Files

- `tsconfig.json` - Main configuration for production code
- `tsconfig.dev.json` - Extended configuration for development tooling
- `tsconfig.jest.json` - Specialized configuration for Jest tests

**Usage:**

```bash
yarn typecheck                    # Check production code
yarn type-check:dev               # Check with dev tooling types
```

---

## Component Library (shadcn/ui)

### Overview

The project uses [shadcn/ui](https://ui.shadcn.com) for accessible, customizable UI components.

**Location:** `components/ui/`

### Key Features

- **Tailwind-powered**: No runtime CSS overhead
- **Accessible**: Built on Radix UI primitives (ARIA-compliant)
- **Customizable**: Components are copied into your codebase, not installed as dependencies
- **Type-safe**: Full TypeScript support

### Current Components

- Accordion (`components/ui/accordion.tsx`)
- Button (`components/ui/button.tsx`)
- Card (`components/ui/card.tsx`)
- Checkbox (`components/ui/checkbox.tsx`)
- Label (`components/ui/label.tsx`)
- Radio Group (`components/ui/radio-group.tsx`)
- Switch (`components/ui/switch.tsx`)
- Tabs (`components/ui/tabs.tsx`)
- Tooltip (`components/ui/tooltip.tsx`)

### Adding New Components

```bash
npx shadcn-ui@latest add <component>
```

**What happens:**

1. Component files are generated in `components/ui/`
2. Tailwind theme tokens are added to `tailwind.config.js` (if needed)
3. Dependencies are automatically added to `package.json`

**After adding:**

1. Review the generated component
2. Commit the new files
3. Import and use: `import { Button } from '@/components/ui/button'`

### Tailwind Configuration

Style tokens are defined in `tailwind.config.js` under `extend.colors`:

```javascript
/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  theme: {
    extend: {
      colors: {
        // shadcn/ui tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        // ... etc
      },
    },
  },
}
```

**Note:** The ESLint disable comment is intentional - Tailwind's docs require CommonJS format (`module.exports`).

---

## Git Hygiene & Generated Files

### What to Commit

| Path                           | Generated by   | Purpose                                 | Commit?                           |
| ------------------------------ | -------------- | --------------------------------------- | --------------------------------- |
| `.yarn/sdks/**`                | `yarn sdks`    | Editor wrappers for PnP-aware tooling   | ✅ Yes                            |
| `.pnp.cjs` & `.pnp.loader.mjs` | Yarn           | PnP mapping & loader (part of lockfile) | ✅ Yes                            |
| `components/ui/**`             | `shadcn-ui`    | UI component source files               | ✅ Yes                            |
| `accessibility-reports/**`     | `yarn access`  | Accessibility audit reports             | ❌ No (gitignored)                |
| `.next/analyze/*.html`         | `yarn analyze` | Bundle size visualizations              | ❌ No (gitignored)                |
| `tsconfig.tsbuildinfo`         | TypeScript     | Build cache                             | ✅ Yes (tracked for optimization) |

### .gitignore Best Practices

**Current configuration:**

- Uses glob patterns to ignore large platform-specific binaries (e.g., `**/@next/swc-*/**`)
- Excludes PnP cache (`.yarn/cache/**`) for zero-install setup
- Includes `.yarn/releases/**` to version-lock Yarn binary
- Excludes build artifacts (`.next/**`, `out/**`, `dist/**`)

**PnP-specific:**

- ✅ Commit `.pnp.cjs` and `.pnp.loader.mjs`
- ✅ Commit `.yarn/sdks/` for editor integration
- ❌ Don't commit `.yarn/cache/` (optional: enable for true zero-install)
- ❌ Don't commit `.yarn/install-state.gz`

---

## Maintenance Scripts

### Daily Development

```bash
yarn dev              # Start development server
yarn lint             # Check code quality
yarn typecheck        # Check TypeScript types
yarn test             # Run tests in watch mode
```

### Pre-Deployment

```bash
yarn lint             # Lint all files
yarn format           # Format all files
yarn typecheck        # Check types
yarn build            # Build for production
yarn analyze          # Analyze bundle size
yarn access           # Run accessibility audits
```

### Dependency Management

```bash
yarn up               # Update all dependencies
yarn dedupe           # Remove duplicate packages
yarn audit            # Full security vulnerability report
yarn audit:critical   # Critical vulnerabilities only
yarn audit:fix        # Attempt automatic fixes
```

### Troubleshooting

```bash
yarn cache clean      # Clear Yarn cache
rm -rf .yarn/cache .pnp.cjs yarn.lock && yarn install  # Nuclear option
yarn dlx @yarnpkg/sdks vscode  # Regenerate editor SDKs
```

---

## CI/CD Integration

### Vercel

**Configuration:** `vercel.json`

**Build Command:** `yarn build`

- Runs `next build`
- Generates service worker via `scripts/build-sw.mjs`
- Generates sitemap via `next-sitemap`

**Install Command:** `corepack enable && yarn install --immutable`

- Forces Yarn v4 (PnP mode)
- `--immutable` ensures lockfile isn't modified during build

**Environment:**

- Node.js 22.x (specified in `package.json` `engines`)
- Vercel automatically respects `packageManager` field after Corepack is enabled

### GitHub Actions

**Security Audit Workflow:** `.github/workflows/security-audit.yml`

Runs on PRs, pushes to main, weekly cron, and manual dispatch. See [Security Auditing](#security-auditing) for details.

---

## Quick Reference

### Commands Cheat Sheet

| Command             | Purpose                        |
| ------------------- | ------------------------------ |
| `yarn dev`          | Start development server       |
| `yarn build`        | Build for production           |
| `yarn lint`         | Lint all files                 |
| `yarn lint:mdx`     | Lint only MDX files            |
| `yarn format`       | Format all files               |
| `yarn format:mdx`   | Format only MDX files          |
| `yarn typecheck`    | Check TypeScript types         |
| `yarn test`         | Run tests in watch mode        |
| `yarn analyze`      | Analyze bundle size            |
| `yarn access`       | Run accessibility audits       |
| `yarn audit`        | Full security audit            |
| `yarn audit:critical` | Critical vulnerabilities only |

### File Locations

| File                 | Purpose                           |
| -------------------- | --------------------------------- |
| `eslint.config.mjs`  | ESLint configuration              |
| `.prettierrc.json`   | Prettier configuration            |
| `jest.config.js`     | Jest configuration                |
| `jest.setup.js`      | Jest setup (imports jest-dom)     |
| `tailwind.config.js` | Tailwind CSS configuration        |
| `tsconfig.json`      | TypeScript configuration          |
| `next.config.js`     | Next.js configuration             |
| `vercel.json`        | Vercel deployment configuration   |
| `.yarnrc.yml`        | Yarn configuration (PnP settings) |
| `package.json`       | Dependencies and scripts          |

---

## Troubleshooting Common Issues

### Issue: ESLint not finding types

**Symptoms:** `Property 'toBeInTheDocument' does not exist...`

**Fix:**

1. Ensure `"types": ["jest", "@testing-library/jest-dom"]` in `tsconfig.json`
2. Restart TypeScript server in your IDE
3. If persisting: `rm -rf node_modules && yarn install`

### Issue: MDX parsing errors

**Symptoms:** `Expected the closing tag </Component>...`

**Fix:**

1. Add blank lines before/after JSX components in MDX
2. Don't mix HTML tags (like `<br />`) inside markdown lists
3. Ensure proper indentation for closing tags
4. Run `yarn lint:mdx` to validate

### Issue: Prettier and ESLint conflicts

**Symptoms:** Prettier formats code, then ESLint complains

**Fix:**

- This shouldn't happen - `eslint-config-prettier` disables conflicting rules
- If it does: check that `eslint-config-prettier` is the **last** item in your ESLint extends array

### Issue: Yarn PnP resolution errors

**Symptoms:** `Cannot find module` or `Qualified path resolution failed`

**Fix:**

1. Ensure `corepack enable` has been run
2. Remove manual `-r ./.pnp.cjs` from package.json scripts
3. Regenerate editor SDKs: `yarn dlx @yarnpkg/sdks vscode`
4. Verify `.pnp.cjs` exists and is committed

### Issue: Jest tests failing on CI but passing locally

**Symptoms:** Tests pass with `yarn test` but fail in CI

**Fix:**

1. Ensure time zones are consistent (use `Date-fns` with explicit zones)
2. Mock `Math.random()` and other non-deterministic functions
3. Use `--ci` flag in CI: `yarn test --ci --coverage`
4. Check for file system case sensitivity (Windows vs Linux)

---

## Further Reading

- [Next.js Testing Documentation](https://nextjs.org/docs/pages/guides/testing/jest)
- [Yarn PnP Documentation](https://yarnpkg.com/features/pnp)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
