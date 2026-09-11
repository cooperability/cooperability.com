# [Co-Operability.com](https://www.cooperability.com)

My Next.js portfolio website on Vercel. Several smaller projects within.

## TODO:

### Quick wins / hygiene

- OC input fields block numbers but should pop up numpad on mobile
- pnpm 11 migration, in full (this PR)
- SEO; site:cooperability.com
- Create `.editorconfig` for consistency
- `commitlint` for commit messages
- Purge `.yarn/cache` from git history with `git filter-repo` (separate follow-up — the migration alone will not reclaim the 508 MB `.git`)
- somehow clean up root repo with symlinks to subdirectories
- ~~Drop the leftover `ls -la && ls -la .yarn` debug prefix from the `build` script~~ (done)
- ~~Fix `engines.yarn: ">=1.22.0"`~~ (done — the field is gone with the pnpm migration)
- ~~Remove `prop-types`~~ (done — the stated blocker turned out not to exist: `YARN_CACHE_FOLDER` is set in `vercel.json` and in local shells, so Yarn writes to a cache _outside_ `.yarn/cache` and dependency changes produce no tracked-cache churn at all. Zero-install is therefore already not in effect; see the pnpm section)
- ~~Convert the last JS files (`src/components/date.js`, `src/components/providers.js`) to TSX~~ (done — now `src/components/date.tsx` and `src/app/providers.tsx`)
- Bump `tsconfig` `target` from `es5` to `ES2022` (es5 forces needless downleveling on a Node 22 / modern-browser target)
- ~~Serwist precaches `.next`-relative paths rather than the served `/_next/static/…` URLs~~ (done — confirmed every old entry 404'd, and that the manifest also swept in `.next/server` and `.next/cache`, neither of which is reachable over HTTP. Now 42 entries, all verified 200)
- Precache `public/` assets too. The Serwist fix above scopes the manifest to `.next/static`, so icons and images are still fetched on demand, and there is no offline fallback route

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

- ~~**Migrate Pages Router → App Router**~~ (done — see [App Router migration notes](#app-router-migration-notes))
- ~~Replace the hand-rolled `<Head>` in `layout.tsx` with the Metadata API / `generateMetadata`~~ (done — `<html lang="en">` is now real, and every route's tags come from `metadata`/`viewport` exports)
- Collapse the dual component tree: root `components/ui` + `lib/` vs `src/components` + `src/lib`, with `@/*` → `./*` resolving to root. Point `components.json` at `src/` and delete the duplication (this is the real fix for the "symlinks" TODO)
- ~~Add `_document` equivalents / custom `404` + `500` pages and a top-level error boundary~~ (done — `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`)
- Adopt `next/font` for self-hosted, layout-shift-free fonts
- ~~Move the inline `dangerouslySetInnerHTML` service-worker registration out of `_app.tsx`~~ (done — it's now `src/app/service-worker.tsx`, a `useEffect` with no inline script. Handing registration to Serwist's own helper is still open)
- Upgrade Tailwind 3 → 4 (CSS-first config, faster engine); audit `tailwind.config.js` and `tw-animate-css` afterward
- Reconsider `next-mdx-remote` vs. compile-time MDX now that RSC makes static MDX cheaper — half done: `/resources/[slug]` uses `next-mdx-remote/rsc`, so no MDX compiler ships to the client, but `@next/mdx` compile-time MDX is still unexplored
- Replace the `useResponsive` client boundary on `/resources` with CSS media queries, so the list can be fully server-rendered (it also fixes mobile getting the desktop layout until JS mounts)

### CI/CD & quality gates

- ~~**`yarn lint` is broken**~~ (fixed — see [Why ESLint is pinned to 9.x](#why-eslint-is-pinned-to-9x). It now passes clean, and `jsx-a11y` runs for the first time)
- ~~`next.config.js` sets `eslint.ignoreDuringBuilds: true`~~ (removed — Next 16 dropped the `eslint` key from `next.config.js` entirely, so it was a no-op that only produced a build warning)
- ~~`yarn test` is `jest --watch`, so it's unusable in CI. Add `test:ci`~~ (done — `pnpm test` is `jest --ci --watchAll=false`; `pnpm test:watch` is the watcher; `pnpm test:ci` collects coverage via `test-exclude@7`)
- ~~Add a real CI workflow (the repo used to ship only the security-audit workflow).~~ (done — `.github/workflows/ci.yml` gates PRs on lint, typecheck, test, build, and a Vercel-shaped install)
- Test coverage is four files (home page, quote box, opioid-converter equivalences, `useResponsive`). Still to prioritize: `mandelbrot-explorer/utils/calculations.ts` and `prompt-composer/utils/helpers.ts`; set coverage thresholds
- Add Playwright E2E + `@axe-core/playwright` for the theme-switch, PWA install, and converter flows (already listed as an accessibility maintenance task — this is the mechanism)
- Add Lighthouse CI with perf/a11y budgets on PRs, replacing the manual `yarn access` run
- Consider Vitest over Jest (faster, native ESM, less SWC/PnP config surface)
- Add `SECURITY.md`, `CODEOWNERS`, a PR template, and a `LICENSE` (repo has issue templates but none of these)
- Pin GitHub Actions to commit SHAs and set explicit least-privilege `permissions:` on each workflow
- Make the `high` severity audit blocking, or document why it stays advisory

### Security & runtime hardening

- ~~Add real security headers via `next.config.js` `headers()`~~ (done — `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and HSTS are enforced on every route). **The CSP ships as `Content-Security-Policy-Report-Only` and still needs promoting.** It cannot be enforced as written: `next-themes` and Next's bootstrap both inject inline `<script>`, so a real policy needs a per-request nonce, which forces dynamic rendering on every route. Check a preview deploy's console for violations, then decide whether that trade is worth making
- HSTS is deliberately sent **without `preload`** — that ships the apex to browser preload lists and is impractical to reverse. Add it as a decision, not a side effect
- Add error tracking (Sentry or Vercel's) — currently no visibility into client-side runtime failures
- ~~Delete or repurpose the placeholder `src/pages/api/hello.ts`~~ (done — deleted; a replacement would now be an `app/api/*/route.ts` Route Handler)
- Decide the canonical host deliberately. This migration standardised on `https://www.cooperability.com` (matching `next-sitemap.config.js`); the old homepage `<link rel="canonical">` pointed at the apex `https://cooperability.com`. If the apex is the intended canonical, change `metadataBase` in `src/app/layout.tsx` and the sitemap config together
- ~~Audit committed artifacts: `accessibility-reports/`, `tsconfig.tsbuildinfo`, `.swc/` shouldn't be in git~~ (done — all three untracked and ignored, along with the platform-native `.yarn/cache` archives that made every cross-OS `yarn install` dirty the tree; `next-env.d.ts` was the reverse problem, ignored yet tracked, and is now tracked deliberately because `yarn typecheck` needs its CSS-module and image declarations)

### Content & product

- The README's dependency list has drifted (missing Radix, lucide, next-sitemap, serwist…). Either generate it or cut it — `package.json` is the source of truth
- Add per-applet PWA icons + maskable variants (already noted under PWA Next Steps)
- Structured data (JSON-LD `Person`/`SoftwareApplication`) for the portfolio and each demo
- OG image generation via `@vercel/og` per page/demo
- RSS/JSON feed for `resources/`
- Add a "how it's built" case-study page — the AI infra work above is the portfolio piece

### Visual design (screenshot review — 2026-08-24)

- Give the homepage a real `<h1>` — "Hi, I'm **Cooper**!" is currently an inline bold word inside a body paragraph, so the page has no visually distinct entry point; promote it to a larger/bolder heading separate from the intro text
- Introduce one accent color beyond link-blue — Home/Demos/Resources are pure black/white plus default anchor blue and the small stack-icon badges; nothing distinguishes a primary CTA like "Try Prompt Composer →" from an ordinary inline link
- Cap content width on wide viewports — body copy currently has no max-measure constraint; constrain paragraphs to ~65–75 characters (`max-w-prose`) for readability per standard typographic guidance
- Unify card styling across pages — the homepage quote box uses a bordered/transparent card, but the Demos page's "Academic Papers…" and "Other Stack Elements…" accordions use filled navy rectangles that don't match any other surface color on the site; pick one treatment and apply it everywhere
- Make Demos sub-project indentation explicit — Prompt Composer / Mandelbrot Explorer / Opioid Converter are nested under cooperability.com by left padding alone; add a connecting tree-line or subtle background tint so the parent-child grouping reads at a glance
- Reduce stack-icon crowding on Demos rows — rows with long titles (e.g. BookMark eXtractor) pack 5–6 small badges against the right edge; tighten/standardize the gap or cap visible icons with a "+N" overflow
- Add a hover/active state to list rows on Demos and Resources — currently plain text links with no visible row-level affordance; a background highlight or left-border on hover reinforces that each row is clickable
- Balance vertical whitespace on the Resources page — with only 3 entries, content pools at the top and leaves a large dead zone before the footer; either center the list vertically, add a short intro line, or shrink the page's min-height so density matches Home/Demos
- Dim metadata dates further and reserve a consistent column for them on Resources — reinforces title-first, metadata-second reading order as more entries are added
- Verify focus-ring visibility and contrast on interactive elements against the pure-black background (nav pill, theme toggle, quote refresh icon), and double-check the muted gray "(Ongoing)"/"(2025)" labels on Demos meet WCAG AA contrast — they read borderline light-gray-on-black in the screenshot

## App Router migration notes

Routes live in `src/app/**`. `src/pages/**` is gone. The non-obvious parts, kept
here because they are the things that bite twice:

| Nuance                                | What actually happens                                                                                                                                                                                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `next/head`                           | Inert in App Router — it does not warn, it just drops the tags. Everything is `export const metadata` / `generateMetadata`, and `themeColor` specifically lives on `export const viewport`                                                                            |
| Metadata inheritance                  | Child values **replace** the parent's for a given key; they do not deep-merge. `icons: { apple: … }` on a page silently drops the layout's `icon`, which is how the favicon disappeared from the three applet routes mid-migration                                    |
| `openGraph.title` templates           | A `title.template` on the root layout only applies to children that set their _own_ `openGraph.title`; children that set just `title` inherit the layout's resolved `default` verbatim. So every content route sets `openGraph.title` explicitly. Nothing derives it from `title` |
| `appleWebApp.capable`                 | Renders only the modern `mobile-web-app-capable`. iOS before 17 needs the `apple-` prefixed name, which has no Metadata key — it goes through `other`                                                                                                                 |
| JSON-LD                               | The Metadata API has no key for it. It stays a `<script type="application/ld+json">` in the page body (`src/app/page.tsx`), and its `url` must be kept in step with `metadataBase` by hand or the canonical link and the structured data disagree                     |
| `getServerSideProps`                  | Becomes a plain server component plus `export const dynamic = 'force-dynamic'`. **Without** `force-dynamic` the page prerenders and anything per-request (the homepage quote) silently freezes at build time                                                          |
| `next-sitemap` + dynamic routes       | It reads `build-manifest`/`prerender-manifest` only — never `app-build-manifest`. A `force-dynamic` route appears in neither, so `/` had to be re-added via `additionalPaths`. Since `public/sitemap*.xml` is gitignored, this regression is invisible to code review |
| `getStaticPaths: { fallback: false }` | `generateStaticParams` alone is **not** equivalent — it defaults to `dynamicParams: true`, so unknown slugs get rendered on demand and a missing file 500s instead of 404ing. Needs `export const dynamicParams = false`                                              |
| `next/dynamic` with `ssr: false`      | Illegal in a Server Component. Each applet route is a server `page.tsx` (for `metadata`) plus a thin `'use client'` wrapper holding the dynamic import and its skeleton                                                                                               |
| `useRouter`                           | `next/router` throws; use `next/navigation`. `usePathname()` replaces `asPath` and is already query-free                                                                                                                                                              |
| MDX                                   | `next-mdx-remote/serialize` + spread props becomes `next-mdx-remote/rsc` with a `source` string. RSC has no Context, so `MDXProvider` is out — components are passed explicitly                                                                                       |
| Nested `ThemeProvider`                | `next-themes` short-circuits a nested provider to a Fragment, so the inner one's props were dead. Collapsing to a single provider is what made `NEXT_PUBLIC_AXE_FORCE_THEME` take effect for the first time — expect `yarn access` numbers to move                    |
| Turbopack                             | Yarn PnP could not resolve `next/package.json`, so `dev`/`build`/`analyze` were pinned to `--webpack`. This tree is pnpm 11: `dev` and `build` use Turbopack. `--webpack` stays only on `analyze`, because `@next/bundle-analyzer` is a webpack plugin Turbopack ignores |
| Hydration gating                      | The `useState(false)` + `useEffect(() => setMounted(true))` idiom costs a second render pass on every mount and trips `react-hooks/set-state-in-effect`. `src/hooks/useHydrated.ts` does the same job with `useSyncExternalStore` and no effect                       |
| Derived state                         | `useEffect` that only mirrors a computed value into state renders the stale value first. Compute it during render instead (`useMemo`), or for a value the user can also edit, adjust state during render by comparing against the previous input                      |

## Why ESLint is pinned to 9.x

`yarn lint` had been crashing rather than linting, so nothing in the repo was
being checked — including `jsx-a11y`, which the accessibility work depends on.
The cause was not one bad package but a major-version mismatch: **ESLint 10 is
ahead of the plugins this stack needs.**

Peer ranges as of the fix:

| Plugin                     | Latest  | Max ESLint |
| -------------------------- | ------- | ---------- |
| `eslint-plugin-react`      | 7.37.5  | `^9.7`     |
| `eslint-plugin-jsx-a11y`   | 6.10.2  | `^9`       |
| `eslint-plugin-import`     | 2.32.0  | `^9`       |
| `eslint-plugin-react-hooks`| 7.1.1   | `^10` ✅   |
| `typescript-eslint`        | 8.68.0  | `^10` ✅   |

Three of the plugins `eslint-config-next` pulls have **no ESLint 10 release at
all**, so there was nothing to upgrade to. Downgrading to 9.39.5 restores a
working lint gate; it is not a weakening, because the alternative was no gate.
Revisit when `eslint-plugin-react` and `eslint-plugin-jsx-a11y` ship ESLint 10
support.

Two related things were fixed in the same pass, and both are worth knowing:

- **`FlatCompat` is no longer needed.** `eslint-config-next` 16 ships a native
  flat config at `eslint-config-next/core-web-vitals`. Loading it through
  `FlatCompat` instead throws `Converting circular structure to JSON`. Dropping
  the shim removed `@eslint/eslintrc` and `@eslint/compat` (the latter was never
  imported).
- **React version detection is pinned.** `eslint-config-next` sets
  `react: { version: 'detect' }`, and detection calls an ESLint API that v10
  removed. `eslint.config.mjs` now reads the installed version directly, which
  is both immune to that break and faster.

`eslint-config-prettier` also moved to the **end** of the config array — it has
to come after every config whose stylistic rules it exists to switch off.

**`yarn access` is unblocked but still unverified.** It runs `yarn lint` first
and used to die there; it now gets through to `axe`. Completing it needs a
Chrome binary on `PATH`, which the agent sandbox this was fixed in did not have,
so the a11y numbers have not actually been re-measured. Run it locally — and
treat the result as a new baseline, not a regression, because collapsing the
nested `ThemeProvider` made `NEXT_PUBLIC_AXE_FORCE_THEME` effective for the
first time.

## Developer Tooling

This project uses a comprehensive suite of quality control tools. For complete documentation, see **[docs/Tooling.md](docs/Tooling.md)**.

**Quick Reference:**

- `pnpm dev` - Start development server
- `pnpm lint` / `pnpm lint:mdx` - ESLint checking (includes MDX validation)
- `pnpm format` / `pnpm format:mdx` - Prettier formatting
- `pnpm test` - Jest + React Testing Library (non-interactive)
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
- **Package Management:** pnpm 11 with an isolated `node_modules` tree and a single `pnpm-lock.yaml`
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
- `react`: JavaScript library for building user interfaces.
- `react-dom`: Serves as the entry point to the DOM and server renderers for React.
- `remark`: Markdown processor.
- `remark-html`: Plugin for `remark` to serialize Markdown to HTML.
- `sharp`: High-performance Node.js image processing library.

### Development Dependencies (`devDependencies`)

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

## Package Manager

This repo runs **pnpm 11**. Yarn 4 PnP is gone. The write-up of what changed, and why, is [docs/PNPM-MIGRATION.md](docs/PNPM-MIGRATION.md).

**Turbopack is the default bundler.** Yarn PnP could not resolve `next/package.json` under Turbopack. pnpm's real `node_modules` tree can, so `dev` and `build` no longer pass `--webpack`. `analyze` still pins webpack because `@next/bundle-analyzer` is a webpack plugin.

**Clone setup:**

```bash
corepack enable
corepack prepare pnpm@11.24.0 --activate
pnpm install --frozen-lockfile
```

**Important files:**

- `pnpm-lock.yaml` — the lockfile. Commit it.
- `pnpm-workspace.yaml` — every pnpm 11 setting except registry auth. `.npmrc` is not used.
- `package.json` `packageManager` — the pinned pnpm version. CI, Vercel, and Corepack all read it.

Vercel does not yet detect pnpm 11 from lockfile 9.0 ([vercel/vercel#17434](https://github.com/vercel/vercel/issues/17434)). `vercel.json` therefore runs `corepack enable && corepack prepare pnpm@11.24.0 --activate` before install, instead of trusting the detector.

Purging `.yarn/cache` from git history is still a separate `git filter-repo` job. Dropping the files from HEAD does not shrink the clone.

