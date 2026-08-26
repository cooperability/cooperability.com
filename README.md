# [Co-Operability.com](https://www.cooperability.com)

My Next.js portfolio website on Vercel. Several smaller projects within.

## TODO:

### Quick wins / hygiene

- OC input fields block numbers but should pop up numpad on mobile
- SEO; site:cooperability.com
- Create `.editorconfig` for consistency
- `commitlint` for commit messages
- Purge the old `.yarn/cache` blobs from git history with `git filter-repo` — the migration removed them from `HEAD`, but the clone is still ~378 MiB. Runbook in [docs/PNPM-MIGRATION.md §9](docs/PNPM-MIGRATION.md)
- somehow clean up root repo with symlinks to subdirectories
- Remove `prop-types` (redundant under TypeScript) and convert the last JS files (`src/components/date.js`, `src/components/providers.js`) to TSX
- Bump `tsconfig` `target` from `es5` to `ES2022` (es5 forces needless downleveling on a Node 22 / modern-browser target)

### AI infrastructure (the main event)

- Add an `/api` LLM route using the Anthropic SDK (`claude-opus-4-8` / `claude-sonnet-5`) with streaming responses, and a shared `src/lib/ai/` client module
- Wire **Prompt Composer** to a live model: preview/critique the composed prompt, score it against the research-backed rubric it already encodes, suggest missing components
- Ship an **eval harness** (fixture prompts → expected properties, run in CI on a cheap model) so prompt/tooling changes can't silently regress
- Rate-limit + abuse-guard any public AI endpoint (Vercel KV / Upstash, per-IP token bucket, max token caps, request size limits) before it costs money
- Add server-side prompt-injection hygiene: never echo untrusted MDX into system prompts, pin system prompts server-side, never expose the API key to the client
- RAG/chat over `src/resources/**` MDX + docs (embed at build time, ship a small static index — no vector DB needed at this size)
- Implement the **MCP server** that `docs/MCP.md` currently only describes — expose site content/tools (opioid conversion, prompt composition) over MCP; otherwise mark the doc as aspirational
- Add `public/llms.txt` + `llms-full.txt` so agents can index the site correctly
- ~~Add a root `CLAUDE.md` + repo-local skills/agents under `.claude/` / `.cursor/`~~ (done — see `CLAUDE.md`, `AGENTS.md`)
- Cost/latency observability for AI calls (token counts, p95 latency, spend per route) — log to Vercel Observability or an OTel exporter
- Enable prompt caching + a cheap-model fallback path for anything user-facing
- Decide and document an AI usage/privacy stance in `PrivacyStatement.mdx` (what's sent to model providers, retention, opt-out)

### Framework & architecture modernization

- **Migrate Pages Router → App Router** — you're on Next 16 but still entirely on `src/pages`; unlocks RSC, streaming, route handlers, and the Metadata API
- Replace the hand-rolled `<Head>` in `layout.tsx` with the Metadata API / `generateMetadata` (fixes SEO, OG, and the `<html lang="en">` inside `<Head>` bug)
- Collapse the dual component tree: root `components/ui` + `lib/` vs `src/components` + `src/lib`, with `@/*` → `./*` resolving to root. Point `components.json` at `src/` and delete the duplication (this is the real fix for the "symlinks" TODO)
- Add `_document` equivalents / custom `404` + `500` pages and a top-level error boundary
- Adopt `next/font` for self-hosted, layout-shift-free fonts
- Move the inline `dangerouslySetInnerHTML` service-worker registration in `_app.tsx` into Serwist's own registration (it's a CSP `unsafe-inline` liability)
- Upgrade Tailwind 3 → 4 (CSS-first config, faster engine); audit `tailwind.config.js` and `tw-animate-css` afterward
- Reconsider `next-mdx-remote` vs. compile-time MDX now that RSC makes static MDX cheaper

### CI/CD & quality gates

- ~~`next.config.js` sets `eslint.ignoreDuringBuilds: true`~~ — resolved differently: lint is now its own CI job, so the build does not need to lint a second time. The underlying lint errors are fixed
- Test coverage is one file (`src/__tests__/pages/index.test.tsx`). Prioritize `opioid-converter/utils/calculations.ts` (clinical math — highest-consequence code in the repo), `mandelbrot-explorer/utils/calculations.ts`, and `prompt-composer/utils/helpers.ts`; set coverage thresholds
- Add Playwright E2E + `@axe-core/playwright` for the theme-switch, PWA install, and converter flows (already listed as an accessibility maintenance task — this is the mechanism)
- Add Lighthouse CI with perf/a11y budgets on PRs, replacing the manual `pnpm access` run
- Consider Vitest over Jest (faster, native ESM, less SWC config surface)
- Add `SECURITY.md`, `CODEOWNERS`, a PR template, and a `LICENSE` (repo has issue templates but none of these)
- Pin GitHub Actions to commit SHAs and set explicit least-privilege `permissions:` on each workflow
- Make the `high` severity audit blocking, or document why it stays advisory

### Security & runtime hardening

- Add real security headers via `next.config.js` `headers()` — CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Today only _images_ have a CSP
- Add error tracking (Sentry or Vercel's) — currently no visibility into client-side runtime failures
- Delete or repurpose the placeholder `src/pages/api/hello.ts`
- Audit committed artifacts: `accessibility-reports/`, `tsconfig.tsbuildinfo`, `.swc/` shouldn't be in git

### Content & product

- The README's dependency list has drifted (missing Radix, lucide, next-sitemap, serwist…). Either generate it or cut it — `package.json` is the source of truth
- Add per-applet PWA icons + maskable variants (already noted under PWA Next Steps)
- Structured data (JSON-LD `Person`/`SoftwareApplication`) for the portfolio and each demo
- OG image generation via `@vercel/og` per page/demo
- RSS/JSON feed for `resources/`
- Add a "how it's built" case-study page — the AI infra work above is the portfolio piece

## Developer Tooling

This project uses a comprehensive suite of quality control tools. For complete documentation, see **[docs/Tooling.md](docs/Tooling.md)**.

**Quick Reference:**

- `pnpm dev` - Start development server
- `pnpm lint` / `pnpm lint:mdx` - ESLint checking (includes MDX validation)
- `pnpm format` / `pnpm format:mdx` - Prettier formatting
- `pnpm test` - Jest + React Testing Library
- `pnpm typecheck` - TypeScript validation
- `pnpm analyze` - Webpack bundle analysis
- `pnpm access` - Accessibility audits (ESLint + Axe-core + Lighthouse)
- `pnpm audit` / `pnpm audit:critical` - Security vulnerability scanning

**Security:** Pre-push hooks and GitHub Actions block vulnerable code. See [docs/Tooling.md#security-auditing](docs/Tooling.md#security-auditing).

**Key Technologies:**

- **Linting:** ESLint with TypeScript, Next.js, and MDX support
- **Formatting:** Prettier with automatic MDX prose wrapping
- **Testing:** Jest with @testing-library/react and jest-dom matchers
- **Automation:** Husky (pre-commit + pre-push security), lint-staged, GitHub Actions
- **Package Management:** pnpm 11 with an isolated linker — one copy per package in a global store, and undeclared imports still fail
- **UI Components:** shadcn/ui (Tailwind + Radix UI primitives)
- **Bundle Analysis:** Webpack Bundle Analyzer for optimization
- **Accessibility:** Automated testing with axe-core CLI and Lighthouse
- **Icons:** skillicons.dev (theme-aware tech stack icons via simple-icons.org)

See **[docs/Tooling.md](docs/Tooling.md)** for setup instructions, troubleshooting, and best practices.

## Performance & Responsive Design

This project implements comprehensive performance optimizations and a content-first responsive design strategy:

**Performance:**

- Dynamic imports with disabled SSR for heavy components (~85KB bundle reduction)
- Loading skeletons to prevent CLS (Cumulative Layout Shift)
- Debounced resize handling (100ms) for smooth responsiveness
- Fluid spacing with CSS `clamp()` for breakpoint-free scaling

**Responsive Design:**

- **Primary breakpoint:** 525px (`useResponsive` hook) for site-wide mobile/desktop splits
- **Tailwind-aligned breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Philosophy:** Break where content naturally requires it, not at arbitrary device widths

See **[docs/Performance.md](docs/Performance.md)** for complete optimization strategies, breakpoint implementation, and best practices.

## Tech Stack Icons & SVG Configuration

This project uses **[skillicons.dev](https://skillicons.dev)** for theme-aware technology stack icons on the demos page. These icons automatically adapt to light/dark theme and provide consistent, professional styling.

**Implementation:**

- Icons source from [simple-icons.org](https://simpleicons.org) via skillicons.dev API
- Dynamic theme switching via `next-themes` integration
- Fallback to custom PNGs for unavailable icons (shadcn/ui, Poetry)

**Security Configuration (`next.config.js`):**

```javascript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'skillicons.dev', pathname: '/icons/**' },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}
```

**Security Measures:**

- ✅ `dangerouslyAllowSVG` enables external SVG loading (required for skillicons.dev)
- ✅ CSP blocks script execution: `script-src 'none'` prevents XSS attacks
- ✅ Sandbox environment limits SVG capabilities
- ✅ Trusted source only (skillicons.dev domain restriction)
- ✅ Follows [Vercel's official security recommendations](https://vercel.com/docs/conformance/rules/NEXTJS_SAFE_SVG_IMAGES)

**Benefits:**

- Automatic light/dark theme adaptation
- Consistent color grading across all tech icons
- Professional, scalable vector graphics
- Single source of truth for icon styling

**Trade-offs:**

- Requires external domain allowlist for SVGs
- Minor dependency on third-party service (skillicons.dev)
- Some icons unavailable (resolved with custom fallbacks)

## Privacy Policy, SEO, Analytics

- **Privacy**: Privacy-forward Next Analytics is used instead of Google Analytics for better anonymization.
- **SEO**: See **[docs/SEO.md](docs/SEO.md)**

## Project Dependencies

### Runtime Dependencies (`dependencies`)

- `@heroicons/react`: SVG icons as React components.
- `@mdx-js/loader`: Webpack loader for MDX files.
- `@mdx-js/react`: React components for rendering MDX.
- `@next/mdx`: Integration for using MDX with Next.js.
- `@tailwindcss/typography`: Tailwind plugin for beautiful typography defaults.
- `@vercel/analytics`: Vercel integration for website analytics.
- `@vercel/speed-insights`: Vercel integration for performance monitoring.
- `date-fns`: Modern JavaScript date utility library.
- `gray-matter`: Parses front-matter from files (e.g., Markdown metadata).
- `next`: The React framework for production.
- `next-mdx-remote`: Renders MDX content dynamically in Next.js.
- `next-themes`: Theme switching support for Next.js apps.
- `prop-types`: Runtime type checking for React props.
- `react`: JavaScript library for building user interfaces.
- `react-dom`: Serves as the entry point to the DOM and server renderers for React.
- `remark`: Markdown processor.
- `remark-html`: Plugin for `remark` to serialize Markdown to HTML.
- `sharp`: High-performance Node.js image processing library.

### Development Dependencies (`devDependencies`)

- `@eslint/compat`: Compatibility utilities for ESLint flat config.
- `@eslint/eslintrc`: Utilities for using `.eslintrc` configs with flat config.
- `@eslint/js`: Core JavaScript rules for ESLint.
- `@types/node`: TypeScript definitions for Node.js.
- `@types/react`: TypeScript definitions for React.
- `autoprefixer`: PostCSS plugin to parse CSS and add vendor prefixes.
- `cross-env`: Sets environment variables cross-platform for scripts.
- `eslint`: Pluggable linting utility for JavaScript and JSX/TSX.
- `eslint-config-next`: Standard ESLint configuration for Next.js projects.
- `eslint-config-prettier`: Disables ESLint rules that conflict with Prettier.
- `husky`: Manages Git hooks to automate tasks.
- `lint-staged`: Runs linters against staged Git files.
- `postcss`: Tool for transforming CSS with JavaScript plugins.
- `postcss-import`: PostCSS plugin to inline `@import` rules.
- `prettier`: Opinionated code formatter.
- `tailwindcss`: Utility-first CSS framework.
- `typescript`: Typed superset of JavaScript that compiles to plain JavaScript.
- `typescript-eslint`: Tooling which enables ESLint to lint TypeScript code.

## Resources I used to build this website

[Light/Dark Mode Button in NextJS](https://www.youtube.com/watch?v=optD7ns4ISQ) \
[Tailwind with Next](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css) \
[Server-side rendering a random number](https://auroratide.com/resources/server-side-rendering-a-random-number) \
[Adding analytics with Vercel](https://ahmadrosid.com/blog/vercel-analytics-tutorial) \
[Changing the site's icon](https://stackoverflow.com/questions/74353529/how-to-add-a-favicon-to-a-nextjs-app-structure-possible-hydration-issue) \
[something to explain mobile compatibility](https://en.wikipedia.org/wiki/Web_Compatibility_Test_for_Mobile_Browsers)
[Vercel Observability](https://vercel.com/docs/observability); [Vercel Analytics](https://vercel.com/docs/analytics)
[Jest Testing in Next.js](https://nextjs.org/docs/pages/guides/testing/jest)
[Cross-platform Favicon Generation](https://realfavicongenerator.net/)

---

## Development Learnings

Detailed learnings from this project are documented in their respective locations:

| Topic                            | Documentation                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CSS Modules & Theming            | [`docs/Tooling.md`](docs/Tooling.md#css-modules-and-theming-next-themes)                                                                               |
| Tailwind Troubleshooting         | [`docs/Tooling.md`](docs/Tooling.md#tailwind-css-classes-not-applying)                                                                                 |
| MDX Component Integration        | [`docs/Tooling.md`](docs/Tooling.md#mdx-component-integration)                                                                                         |
| Case Sensitivity (Windows/Linux) | [`docs/Tooling.md`](docs/Tooling.md#case-sensitivity-in-file-names-windows-vs-linux)                                                                   |
| Performance & Responsive Design  | [`docs/Performance.md`](docs/Performance.md)                                                                                                           |
| Unified Link Components          | [`docs/PROJECT-STRUCTURE.md`](docs/PROJECT-STRUCTURE.md#unified-link-components)                                                                       |
| Mobile Table Refinement          | [`src/components/opioid-converter/OPIOID-CONVERTER-README.md`](src/components/opioid-converter/OPIOID-CONVERTER-README.md#mobile-refinement-learnings) |

---

## Accessibility

This project follows WCAG 2.1 AA standards with automated testing via ESLint, Axe-core, and Lighthouse.

**Run audits:** `pnpm access` (saves reports to `./accessibility-reports/`)

**Completed Features:**

- ✅ Semantic HTML5 and proper heading hierarchy
- ✅ Keyboard navigation and focus management
- ✅ ARIA attributes for screen readers
- ✅ WCAG AA color contrast (light and dark themes)
- ✅ Automated testing suite integrated into development workflow

**Maintenance Tasks:**

- [ ] Explore Playwright + Axe-core for CI-integrated theme testing
- [ ] Ensure all iconic buttons have discernible screen reader text
- [ ] Regular WCAG compliance reviews

See **[docs/Tooling.md#accessibility-testing](docs/Tooling.md#accessibility-testing)** for detailed testing procedures.

## PWA & App-like Experience

This project implements a **comprehensive PWA applet suite** - transforming individual tools into installable Progressive Web Apps with their own identities while sharing infrastructure. Each applet (Prompt Composer, Opioid Converter) can be added to a mobile home screen as a separate app with its own name.

**📚 Complete Documentation:** **[docs/PWA.md](docs/PWA.md)**

This comprehensive guide covers everything from PWA basics to advanced implementation:

- What PWAs are and how they work
- The applet suite architecture and philosophy
- Step-by-step implementation guide
- Testing procedures (iOS, Android, desktop)
- Troubleshooting common issues
- Advantages, disadvantages, and trade-offs
- Future enhancement opportunities

### Quick Overview

**Status:** ✅ Fully implemented (January 2025)

**Implemented Applets:**

- **"Prompt Composer"** - Installs as standalone app from `/prompt-composer`
- **"Opioid Converter"** - Installs as standalone app from `/opioid-converter`
- **"Co-Operability"** - Main portfolio with shortcuts to applets

**Key Features:**

- ✅ Each applet has unique installable identity
- ✅ Shared service worker (efficient caching)
- ✅ Same icon set (brand consistency)
- ✅ iOS and Android support
- ✅ Offline-capable via Serwist (Workbox successor)

**Technology Stack:**

- **Service Worker:** Serwist (migrated from deprecated `next-pwa`)
- **Build Process:** `next build` → `build-sw.mjs` → `next-sitemap`
- **Files:** `src/sw.js` (source) → `public/sw.js` (compiled)

**Next Steps:**

- Custom icons per applet
- Enhanced offline functionality
- Deep linking & share targets
- App store distribution (Microsoft Store, Google Play via TWA)

See **[docs/PWA.md](docs/PWA.md)** for complete implementation guide, testing procedures, and troubleshooting.

## Package Management (pnpm 11)

Migrated from Yarn 4 Plug'n'Play. The full write-up — every decision, what
broke, and measured before/after numbers — is in
**[docs/PNPM-MIGRATION.md](docs/PNPM-MIGRATION.md)**.

### Why it had to happen

**Turbopack will never support Yarn PnP.** The Next.js docs list it under
_Unsupported and unplanned features_. That is not a "not yet": Turbopack is a
Rust bundler with a filesystem resolver, and PnP is a JS-runtime resolution
shim that reads modules out of zip archives. The two are architecturally
incompatible, so staying on PnP meant doing the App Router migration and then
opting out of the bundler that migration exists for.

Measured here after the move: Turbopack builds this project in **11.98 s**
against webpack's **28.37 s**, at a cost of ~25 KB more gzipped client JS.

### What it bought

|                                | Before (Yarn 4 PnP) | After (pnpm 11)            |
| ------------------------------ | ------------------- | -------------------------- |
| Package files in git           | 1,379 zips, 778 MB  | 0                          |
| Known advisories               | 53                  | 5 (no upstream fix exists) |
| Install scripts allowed to run | all ~1,332 packages | 4, explicitly allowlisted  |
| Undeclared imports             | hard error          | hard error (kept)          |
| Editor integration             | `.yarn/sdks` shims  | native                     |

### The rule that matters day to day

**All pnpm configuration lives in `pnpm-workspace.yaml`.** Not `.npmrc` (auth
and registry only in pnpm 11), not `package.json` (its `pnpm` field is no
longer read). Settings in the wrong file are ignored **silently** — the
install succeeds and resolves a different dependency tree.

```bash
pnpm install --frozen-lockfile   # what CI and Vercel run
pnpm why <pkg>                   # why is this in my tree?
pnpm peers check                 # peer dependency gaps
pnpm audit --audit-level critical
```

### Still outstanding

Removing `.yarn/cache` from `HEAD` **does not shrink the clone** — the repo is
still ~378 MiB packed, because git keeps every blob it has ever seen.
Reclaiming it needs `git filter-repo` and a force-push of every ref. The
runbook, and its blast radius, are in
[docs/PNPM-MIGRATION.md §9](docs/PNPM-MIGRATION.md).

See **[docs/Tooling.md](docs/Tooling.md)** for troubleshooting.
