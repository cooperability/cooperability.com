# Developer Tooling & Quality Control

This document covers all the developer tooling, automation, and quality control systems used in this project.

## Table of Contents

- [Linting & Formatting](#linting--formatting)
- [Testing](#testing)
- [Automation & Git Hooks](#automation--git-hooks)
- [Security Auditing](#security-auditing)
- [Bundle Analysis](#bundle-analysis)
- [Accessibility Testing](#accessibility-testing)
- [Package Management (pnpm)](#package-management-pnpm)
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
pnpm lint              # Lint all files (.js, .jsx, .ts, .tsx, .mdx)
pnpm lint:mdx          # Lint only MDX files
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
pnpm format            # Format all project files
pnpm format:mdx        # Format only MDX files
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
pnpm test              # Run tests in watch mode
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
pnpm lint-staged
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

- Runs `pnpm audit --audit-level critical`
- Blocks push if critical vulnerabilities exist
- Bypass with `git push --no-verify` (emergencies only)

---

## Security Auditing

### Overview

Security auditing runs at multiple layers to catch vulnerabilities early:

| Layer                     | When                     | Purpose                     |
| ------------------------- | ------------------------ | --------------------------- |
| **Pre-push hook**         | Before `git push`        | Local feedback              |
| **GitHub Actions (PR)**   | Every pull request       | Gate vulnerable code        |
| **GitHub Actions (Cron)** | Weekly (Sunday 2 AM UTC) | Catch newly disclosed vulns |
| **Dependabot**            | Continuous               | Auto-create fix PRs         |

### Commands

```bash
pnpm audit              # Full vulnerability report
pnpm audit:critical     # Critical severity only (used by CI)
pnpm audit:fix          # Attempt automatic fixes
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

1. **Check severity:** `pnpm audit`
2. **Update affected package:**
   - **Direct dependency:** Update version in `package.json`, run `pnpm install`
   - **Transitive dependency:** Add to `resolutions` field in `package.json`:
     ```json
     {
       "resolutions": {
         "vulnerable-package": "^patched.version"
       }
     }
     ```
     This forces all packages to use the patched version, even if they request older versions.
3. **Verify fix:** `pnpm audit:critical` (should show no suggestions)
4. **Push:** Pre-push hook confirms fix before code leaves your machine

**Note:** Dependabot alerts show the dependency chain (e.g., `tailwindcss → ... → glob 10.4.5`). Use `resolutions` when upstream packages haven't updated yet.

---

## Bundle Analysis

### Webpack Bundle Analyzer

Visualizes the size and composition of your production bundles.

**Configuration:** `next.config.js` with `@next/bundle-analyzer`

**Command:**

```bash
pnpm analyze
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
- **When it runs:** During `pnpm lint` and pre-commit hooks

#### 2. axe-core CLI

- **Type:** Runtime WCAG testing
- **What it catches:** Contrast issues, focus management, live region problems
- **Command:** `pnpm access` (starts dev server → runs audits → saves reports)

#### 3. Lighthouse

- **Type:** Comprehensive accessibility audits
- **What it catches:** Performance impact on accessibility, best practices, SEO
- **Runs on:** Home page, demos page, resources page

### Running Accessibility Audits

**Full Suite:**

```bash
pnpm access
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

## Package Management (pnpm)

### Why pnpm

Every version of every package is stored **once** in a global
content-addressable store and hardlinked into `node_modules`. Nothing
package-related is committed. The repo previously ran Yarn 4 Plug'n'Play with
1,379 cache archives (778 MB) tracked in git; all of that is gone.

### Strictness: the property carried over from PnP

`nodeLinker: isolated` gives each package a `node_modules` containing only its
**declared** dependencies. Importing something you never declared fails — the
same protection `pnpMode: strict` gave us, but through a real directory tree
that Jest, ESLint, Next and tsserver read natively. That is why the
`.yarn/sdks` editor shims were deleted rather than ported.

If a build suddenly cannot find a package it has always used, the package was
almost certainly a **phantom dependency**. The fix is to declare it:

```bash
pnpm add -D the-package
```

### All configuration lives in one file

```
pnpm-workspace.yaml    <- nodeLinker, allowBuilds, overrides, peer settings
```

**Not `.npmrc`** (pnpm 11 reads it for auth and registry only) and **not
`package.json`** (its `pnpm` field is no longer read). Settings in the wrong
place are ignored _silently_. This is the single most common way to get a
subtly wrong dependency tree.

### Install scripts are denied by default

Yarn ran every install script in the tree. pnpm runs none unless allowlisted:

```yaml
allowBuilds:
  sharp: true
```

If `pnpm install` reports `[ERR_PNPM_IGNORED_BUILDS]`, a package needs a native
binary and is not listed. Add it only if you understand why it needs to run
code at install time.

> `allowBuilds` is pnpm 11. It replaced `onlyBuiltDependencies`, which pnpm 11
> removed and now **ignores without warning** — so configuration copied from
> older guides looks correct and does nothing.

### Common commands

| Task                                   | Command                             |
| -------------------------------------- | ----------------------------------- |
| Install exactly what the lockfile says | `pnpm install --frozen-lockfile`    |
| Add a dependency                       | `pnpm add x` / `pnpm add -D x`      |
| Why is this package here?              | `pnpm why x`                        |
| Run a binary from the tree             | `pnpm exec <bin>`                   |
| One-off without installing             | `pnpm dlx <pkg>`                    |
| Check peer dependency gaps             | `pnpm peers check`                  |
| Audit                                  | `pnpm audit --audit-level critical` |

### Version pinning

The pnpm version lives in exactly one place — `packageManager` in
`package.json`. CI (`pnpm/action-setup` with no `version:` key), Vercel and
every developer machine read it from there. This matters more than usual:
older pnpm silently ignores `pnpm-workspace.yaml`, so a host that picked its
own pnpm would install with no overrides and no allowed builds, and not fail.

### Troubleshooting

| Symptom                                                  | Cause                                                                |
| -------------------------------------------------------- | -------------------------------------------------------------------- |
| `Cannot find module X` for a package that "is installed" | Phantom dependency — declare it                                      |
| `ERR_PNPM_IGNORED_BUILDS`                                | Package needs `allowBuilds`                                          |
| A setting appears to do nothing                          | It is in `.npmrc` or `package.json` instead of `pnpm-workspace.yaml` |
| `ERR_PNPM_OUTDATED_LOCKFILE` in CI                       | `package.json` changed without re-running `pnpm install`             |
| Overriding a package broke its parent                    | Bump the parent instead — see `docs/PNPM-MIGRATION.md` §5            |

Full migration write-up, including measured before/after numbers and the
problems the migration uncovered: **`docs/PNPM-MIGRATION.md`**.

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
pnpm typecheck                    # Check production code
pnpm type-check:dev               # Check with dev tooling types
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

| Path                       | Generated by   | Purpose                     | Commit?            |
| -------------------------- | -------------- | --------------------------- | ------------------ |
| `pnpm-lock.yaml`           | pnpm           | The dependency lockfile     | ✅ Yes             |
| `components/ui/**`         | `shadcn-ui`    | UI component source files   | ✅ Yes             |
| `accessibility-reports/**` | `pnpm access`  | Accessibility audit reports | ❌ No (gitignored) |
| `.next/analyze/*.html`     | `pnpm analyze` | Bundle size visualizations  | ❌ No (gitignored) |
| `tsconfig.tsbuildinfo`     | TypeScript     | Build cache                 | ❌ No (gitignored) |

### .gitignore Best Practices

**Current configuration:**

- Excludes build artifacts (`.next/**`, `out/**`, `dist/**`)
- Excludes `node_modules/` — pnpm keeps packages in a global store outside the
  repo, so there is nothing package-related left to commit or exclude

**pnpm-specific:**

- ✅ Commit `pnpm-lock.yaml` — it is the only artifact git needs
- ✅ Commit `pnpm-workspace.yaml` — it holds all pnpm configuration
- ❌ Never commit a second lockfile (`yarn.lock`, `package-lock.json`,
  `bun.lockb`). Two lockfiles means two dependency trees and a coin flip over
  which one the deploy resolves

---

## Maintenance Scripts

### Daily Development

```bash
pnpm dev              # Start development server
pnpm lint             # Check code quality
pnpm typecheck        # Check TypeScript types
pnpm test             # Run tests in watch mode
```

### Pre-Deployment

```bash
pnpm lint             # Lint all files
pnpm format           # Format all files
pnpm typecheck        # Check types
pnpm build            # Build for production
pnpm analyze          # Analyze bundle size
pnpm access           # Run accessibility audits
```

### Dependency Management

```bash
pnpm update           # Update within the ranges in package.json
pnpm update --latest  # Update across majors (review the diff)
pnpm dedupe           # Remove duplicate packages
pnpm audit            # Full security vulnerability report
pnpm audit:critical   # Critical vulnerabilities only
pnpm audit:fix        # Attempt automatic fixes
```

### Troubleshooting

```bash
pnpm store prune                       # Drop store entries nothing references
rm -rf node_modules && pnpm install    # Nuclear option
pnpm why <pkg>                         # Trace why a package is in the tree
pnpm peers check                       # List peer dependency gaps
```

---

## CI/CD Integration

### Vercel

**Configuration:** `vercel.json`

**Build Command:** `pnpm build`

- Runs `next build`
- Generates service worker via `scripts/build-sw.mjs`
- Generates sitemap via `next-sitemap`

**Install Command:** `pnpm install --frozen-lockfile`

- `--frozen-lockfile` fails the build rather than silently resolving something
  `pnpm-lock.yaml` never recorded (the `yarn install --immutable` equivalent)
- `ENABLE_EXPERIMENTAL_COREPACK=1` is what lets Vercel honour `packageManager`
- `engines.node` must be a major selector (`"22.x"`); Vercel rejects semver
  ranges such as `">=22.13.0"`

**Environment:**

- Node.js 22.x (specified in `package.json` `engines`)
- Vercel automatically respects `packageManager` field after Corepack is enabled

### GitHub Actions

**Security Audit Workflow:** `.github/workflows/security-audit.yml`

Runs on PRs, pushes to main, weekly cron, and manual dispatch. See [Security Auditing](#security-auditing) for details.

---

## Quick Reference

### Commands Cheat Sheet

| Command               | Purpose                       |
| --------------------- | ----------------------------- |
| `pnpm dev`            | Start development server      |
| `pnpm build`          | Build for production          |
| `pnpm lint`           | Lint all files                |
| `pnpm lint:mdx`       | Lint only MDX files           |
| `pnpm format`         | Format all files              |
| `pnpm format:mdx`     | Format only MDX files         |
| `pnpm typecheck`      | Check TypeScript types        |
| `pnpm test`           | Run tests in watch mode       |
| `pnpm analyze`        | Analyze bundle size           |
| `pnpm access`         | Run accessibility audits      |
| `pnpm audit`          | Full security audit           |
| `pnpm audit:critical` | Critical vulnerabilities only |

### File Locations

| File                  | Purpose                         |
| --------------------- | ------------------------------- |
| `eslint.config.mjs`   | ESLint configuration            |
| `.prettierrc.json`    | Prettier configuration          |
| `jest.config.js`      | Jest configuration              |
| `jest.setup.js`       | Jest setup (imports jest-dom)   |
| `tailwind.config.js`  | Tailwind CSS configuration      |
| `tsconfig.json`       | TypeScript configuration        |
| `next.config.js`      | Next.js configuration           |
| `vercel.json`         | Vercel deployment configuration |
| `pnpm-workspace.yaml` | ALL pnpm configuration          |
| `package.json`        | Dependencies and scripts        |

---

## Development Gotchas & Learnings

### Case Sensitivity in File Names (Windows vs. Linux)

**Problem:** Assets work locally on Windows (case-insensitive) but fail in production on Vercel/Linux (case-sensitive).

**Symptoms:** Files load in development but return 404 errors in production.

**Solution:** Use `git mv oldName.png newName.png` to rename files to match code references exactly.

```bash
# Example: Code references linkedin.png but git tracks Linkedin.png
git mv public/images/Linkedin.png public/images/linkedin.png
```

**Prevention:** Use consistent lowercase naming for all assets.

### CSS Modules and Theming (next-themes)

**Problem:** Defining global theme styles with `:root` or `[data-theme='dark']` in CSS Module files causes build errors.

**Solution:** Define theme-specific classes within CSS Modules (e.g., `.dropdownLight`, `.dropdownDark`), then conditionally apply them in React:

```tsx
const { theme } = useTheme()
const isDark = theme === 'dark'

<div className={`${styles.dropdown} ${isDark ? styles.dropdownDark : styles.dropdownLight}`}>
```

### Tailwind CSS Classes Not Applying

**Problem:** Tailwind classes appear in HTML but styles don't apply.

**Causes & Fixes:**

1. **`content` array missing paths:** Ensure `tailwind.config.js` includes all directories:

   ```javascript
   content: ['./src/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}']
   ```

2. **Missing directives:** Verify `global.css` contains:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

3. **PostCSS conflict:** Modern Next.js handles Tailwind without `postcss.config.js`. Remove it if encountering issues.

### MDX Component Integration

**Problem:** Components imported in `.mdx` files don't render.

**Solution:** When using `next-mdx-remote`, components must be passed to `<MDXRemote />` via the `components` prop:

```tsx
// pages/resources/[slug].tsx
import { CustomComponent } from '@/components/CustomComponent'

;<MDXRemote {...source} components={{ CustomComponent }} />
```

### Date Sorting with ISO 8601

**Tip:** For dates in `YYYY-MM-DD` format, use `localeCompare()` directly:

```typescript
posts.sort((a, b) => b.date.localeCompare(a.date)) // Descending
```

Avoid creating `new Date()` objects—string comparison is reliable and avoids TypeScript signature errors.

---

## Troubleshooting Common Issues

### Issue: ESLint not finding types

**Symptoms:** `Property 'toBeInTheDocument' does not exist...`

**Fix:**

1. Ensure `"types": ["jest", "@testing-library/jest-dom"]` in `tsconfig.json`
2. Restart TypeScript server in your IDE
3. If persisting: `rm -rf node_modules && pnpm install`

### Issue: MDX parsing errors

**Symptoms:** `Expected the closing tag </Component>...`

**Fix:**

1. Add blank lines before/after JSX components in MDX
2. Don't mix HTML tags (like `<br />`) inside markdown lists
3. Ensure proper indentation for closing tags
4. Run `pnpm lint:mdx` to validate

### Issue: Prettier and ESLint conflicts

**Symptoms:** Prettier formats code, then ESLint complains

**Fix:**

- This shouldn't happen - `eslint-config-prettier` disables conflicting rules
- If it does: check that `eslint-config-prettier` is the **last** item in your ESLint extends array

### Issue: `Cannot find module` for a package that is clearly installed

**Symptoms:** A package you can see in `node_modules` fails to import.

**Cause:** It is a **phantom dependency**. `nodeLinker: isolated` only exposes
what this project _declares_, so code relying on a transitive dependency stops
resolving. This is the protection working, not a bug.

**Fix:**

1. `pnpm why <pkg>` to confirm it arrives transitively
2. `pnpm add <pkg>` (or `-D`) to declare it properly

### Issue: `ERR_PNPM_IGNORED_BUILDS`

**Symptoms:** Install ends with a list of packages whose build scripts were
skipped, and a native binary is missing afterwards.

**Fix:** Add the package to `allowBuilds` in `pnpm-workspace.yaml` — and only
after deciding you are comfortable with it executing code at install time.

### Issue: Jest tests failing on CI but passing locally

**Symptoms:** Tests pass with `pnpm test` but fail in CI

**Fix:**

1. Ensure time zones are consistent (use `Date-fns` with explicit zones)
2. Mock `Math.random()` and other non-deterministic functions
3. Use `--ci` flag in CI: `pnpm test --ci --coverage`
4. Check for file system case sensitivity (Windows vs Linux)

---

## Further Reading

- [Next.js Testing Documentation](https://nextjs.org/docs/pages/guides/testing/jest)
- [pnpm Documentation](https://pnpm.io)
- [This repo's migration write-up](./PNPM-MIGRATION.md)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
