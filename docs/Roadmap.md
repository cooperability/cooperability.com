# Roadmap

Everything outstanding on cooperability.com, grouped by the kind of work it is.
Within each category, items run highest-priority-first: the best payoff for
the effort, or a hard dependency for what follows. Struck-through lines are
done and kept for the reasoning attached to them. They sit at the bottom of
each category since they no longer compete for priority.

Related: [Lint Gate](Lint-Gate.md) for why ESLint 10 stays, and
[PNPM Migration](PNPM-MIGRATION.md) for the package-manager move that closed a
run of these items.

## Quick wins / hygiene

- Bump `tsconfig` `target` from `es5` to `ES2022`. It's a one-line change, and es5 forces needless downleveling on every build for a Node 22 / modern-browser target
- Purge `.yarn/cache` from git history with `git filter-repo` (separate follow-up: the migration alone does not reclaim the 508 MB `.git`, which every clone and CI checkout pays for)
- Precache `public/` assets too. The Serwist fix below scopes the manifest to `.next/static`, so icons and images are still fetched on demand, and there is no offline fallback route
- Create `.editorconfig` for consistency
- `commitlint` for commit messages
- somehow clean up root repo with symlinks to subdirectories
- SEO: audit what `site:cooperability.com` returns
- OC input fields block numbers but should pop up numpad on mobile
- ~~pnpm 11 migration, in full~~ (done: see [PNPM Migration](PNPM-MIGRATION.md))
- ~~Drop the leftover `ls -la && ls -la .yarn` debug prefix from the `build` script~~ (done)
- ~~Fix `engines.yarn: ">=1.22.0"`~~ (done: the field is gone with the pnpm migration)
- ~~Remove `prop-types`~~ (done: Yarn's zero-install cache was already unused, and the pnpm migration deleted the Yarn machinery rather than preserving it)
- ~~Convert the last JS files (`src/components/date.js`, `src/components/providers.js`) to TSX~~ (done: now `src/components/date.tsx` and `src/app/providers.tsx`)
- ~~Serwist precaches `.next`-relative paths rather than the served `/_next/static/…` URLs~~ (done: confirmed every old entry 404'd, and that the manifest also swept in `.next/server` and `.next/cache`, neither of which is reachable over HTTP. Now 42 entries, all verified 200)

## AI infrastructure (the main event)

- Add an `/api` LLM route using the Anthropic SDK (`claude-opus-4-8` / `claude-sonnet-5`) with streaming responses, and a shared `src/lib/ai/` client module (foundation: every item below builds on this)
- Add server-side prompt-injection hygiene: never echo untrusted MDX into system prompts, pin system prompts server-side, never expose the API key to the client (build in before anything is public, not after)
- Rate-limit + abuse-guard any public AI endpoint (Vercel KV / Upstash, per-IP token bucket, max token caps, request size limits) before it costs money
- Decide and document an AI usage/privacy stance in `PrivacyStatement.mdx` (what's sent to model providers, retention, opt-out) before any user-facing AI feature ships
- Add `public/llms.txt` + `llms-full.txt` so agents can index the site correctly (cheap, static, no dependency on the route work above)
- Wire **Prompt Composer** to a live model: preview/critique the composed prompt, score it against the research-backed rubric it already encodes, suggest missing components
- Ship an **eval harness** (fixture prompts → expected properties, run in CI on a cheap model) so prompt/tooling changes can't silently regress
- Enable prompt caching + a cheap-model fallback path for anything user-facing
- Cost/latency observability for AI calls (token counts, p95 latency, spend per route). Log to Vercel Observability or an OTel exporter
- RAG/chat over `src/resources/**` MDX + docs (embed at build time, ship a small static index, so no vector DB is needed at this size)
- Implement the **MCP server** that `docs/MCP.md` currently only describes. Expose site content/tools (opioid conversion, prompt composition) over MCP, or otherwise mark the doc as aspirational
- ~~Add a root `CLAUDE.md` + repo-local skills/agents under `.claude/` / `.cursor/`~~ (done: see `CLAUDE.md`, `AGENTS.md`)

## Framework & architecture modernization

- Replace the `useResponsive` client boundary on `/resources` with CSS media queries. This is a live bug, not just an optimization: mobile gets the desktop layout until JS mounts. It also lets the page be fully server-rendered
- Collapse the dual component tree: root `components/ui` + `lib/` vs `src/components` + `src/lib`, with `@/*` → `./*` resolving to root. Point `components.json` at `src/` and delete the duplication (this is the real fix for the "symlinks" TODO in Quick wins)
- Upgrade Tailwind 3 → 4 (CSS-first config, faster engine), then audit `tailwind.config.js` and add `tw-animate-css` in place of `tailwindcss-animate` afterward
- Adopt `next/font` for self-hosted, layout-shift-free fonts
- Reconsider `next-mdx-remote` vs. compile-time MDX now that RSC makes static MDX cheaper. Half done: `/resources/[slug]` uses `next-mdx-remote/rsc`, so no MDX compiler ships to the client, but `@next/mdx` compile-time MDX is still unexplored
- ~~**Migrate Pages Router → App Router**~~ (done: see [App Router migration notes](#app-router-migration-notes))
- ~~Replace the hand-rolled `<Head>` in `layout.tsx` with the Metadata API / `generateMetadata`~~ (done: `<html lang="en">` is now real, and every route's tags come from `metadata`/`viewport` exports)
- ~~Add `_document` equivalents / custom `404` + `500` pages and a top-level error boundary~~ (done: `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`)
- ~~Move the inline `dangerouslySetInnerHTML` service-worker registration out of `_app.tsx`~~ (done: it's now `src/app/service-worker.tsx`, a `useEffect` with no inline script. Handing registration to Serwist's own helper is still open)

## CI/CD & quality gates

- Stop the security-audit workflow from opening a false-alarm issue on any failed step. **This is the fix for [issue #253](https://github.com/cooperability/cooperability.com/issues/253):** that issue's linked run shows `yarn npm audit --severity critical` crashing with an unhandled `RequestError` (the yarn registry returned malformed JSON to the advisory-bulk endpoint), not a real advisory. `pnpm audit --audit-level critical` finds nothing today (verified 2026-09-15). The pnpm migration already swapped `yarn npm audit` for `pnpm audit` in `.github/workflows/security-audit.yml`, which fixes that specific crash, but the issue-creation step still fires on bare `if: failure()` with no check that the failure was an actual finding, so any transient audit-tool error (network blip, registry outage) can still raise the same false alarm
- Pin GitHub Actions to commit SHAs and set explicit least-privilege `permissions:` on each workflow
- Make the `high` severity audit blocking, or document why it stays advisory
- Add `SECURITY.md`, `CODEOWNERS`, a PR template, and a `LICENSE` (repo has issue templates but none of these)
- Test coverage is four files (home page, quote box, opioid-converter equivalences, `useResponsive`). Still to prioritize: `mandelbrot-explorer/utils/calculations.ts` and `prompt-composer/utils/helpers.ts`, then set coverage thresholds
- Add Lighthouse CI with perf/a11y budgets on PRs, replacing the manual `pnpm access` run
- Add Playwright E2E + `@axe-core/playwright` for the theme-switch, PWA install, and converter flows (already listed as an accessibility maintenance task, and this is the mechanism)
- Consider Vitest over Jest (faster, native ESM, less SWC/PnP config surface)
- ~~**`yarn lint` is broken**~~ (fixed: see [Why ESLint 10 is kept](#why-eslint-10-is-kept). `pnpm lint` exits 0)
- ~~`next.config.js` sets `eslint.ignoreDuringBuilds: true`~~ (removed: Next 16 dropped the `eslint` key from `next.config.js` entirely, so it was a no-op that only produced a build warning)
- ~~`yarn test` is `jest --watch`, so it's unusable in CI. Add `test:ci`~~ (done: `pnpm test` is `jest --ci --watchAll=false`, `pnpm test:watch` is the watcher, and `pnpm test:ci` collects coverage via `test-exclude@7`)
- ~~Add a real CI workflow (the repo used to ship only the security-audit workflow).~~ (done: `.github/workflows/ci.yml` gates PRs on lint, typecheck, test, build, and a Vercel-shaped install)

## Security & runtime hardening

- Add error tracking (Sentry or Vercel's). There is currently no visibility into client-side runtime failures, and that visibility should exist before flipping any enforcement switch below
- Promote the CSP from `Content-Security-Policy-Report-Only` to enforced. It cannot be enforced as written: `next-themes` and Next's bootstrap both inject inline `<script>`, so a real policy needs a per-request nonce, which forces dynamic rendering on every route. Check a preview deploy's console for violations, then decide whether that trade is worth making
- Decide the canonical host deliberately. This migration standardised on `https://www.cooperability.com` (matching `next-sitemap.config.js`), while the old homepage `<link rel="canonical">` pointed at the apex `https://cooperability.com`. If the apex is the intended canonical, change `metadataBase` in `src/app/layout.tsx` and the sitemap config together
- HSTS is deliberately sent **without `preload`**. That ships the apex to browser preload lists and is impractical to reverse. Add it as a decision, not a side effect
- ~~Add real security headers via `next.config.js` `headers()`~~ (done: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and HSTS are enforced on every route)
- ~~Delete or repurpose the placeholder `src/pages/api/hello.ts`~~ (done: deleted, and a replacement would now be an `app/api/*/route.ts` Route Handler)
- ~~Audit committed artifacts: `accessibility-reports/` and `tsconfig.tsbuildinfo` shouldn't be in git~~ (done: both untracked and ignored. `.swc/` is untracked but not ignored. `next-env.d.ts` is tracked because `pnpm typecheck` needs its CSS-module and image declarations)

## Content & product

- Structured data (JSON-LD `Person`/`SoftwareApplication`) for the portfolio and each demo
- OG image generation via `@vercel/og` per page/demo
- Add per-applet PWA icons + maskable variants (already noted under PWA Next Steps)
- RSS/JSON feed for `resources/`
- Add a "how it's built" case-study page. The AI infra work above is the portfolio piece, so this trails that category
- ~~The README's dependency list has drifted (missing Radix, lucide, next-sitemap, serwist…)~~ (done: the README's "Project dependencies" section now lists Radix, lucide-react, next-sitemap, and serwist)

## Visual design (screenshot review, 2026-08-24)

- Verify focus-ring visibility and contrast on interactive elements against the pure-black background (nav pill, theme toggle, quote refresh icon), and double-check the muted gray "(Ongoing)"/"(2025)" labels on Demos meet WCAG AA contrast. They read borderline light-gray-on-black in the screenshot
- Give the homepage a real `<h1>`. "Hi, I'm **Cooper**!" is currently an inline bold word inside a body paragraph, so the page has no visually distinct entry point. Promote it to a larger/bolder heading separate from the intro text
- Introduce one accent color beyond link-blue. Home/Demos/Resources are pure black/white plus default anchor blue and the small stack-icon badges, and nothing distinguishes a primary CTA like "Try Prompt Composer →" from an ordinary inline link
- Add a hover/active state to list rows on Demos and Resources. These are currently plain text links with no visible row-level affordance, and a background highlight or left-border on hover reinforces that each row is clickable
- Unify card styling across pages. The homepage quote box uses a bordered/transparent card, but the Demos page's "Academic Papers…" and "Other Stack Elements…" accordions use filled navy rectangles that don't match any other surface color on the site. Pick one treatment and apply it everywhere
- Cap content width on wide viewports. Body copy currently has no max-measure constraint, so constrain paragraphs to roughly 65 to 75 characters (`max-w-prose`) for readability per standard typographic guidance
- Make Demos sub-project indentation explicit. Prompt Composer, Mandelbrot Explorer and Opioid Converter are nested under cooperability.com by left padding alone, so add a connecting tree-line or subtle background tint so the parent-child grouping reads at a glance
- Reduce stack-icon crowding on Demos rows. Rows with long titles (e.g. BookMark eXtractor) pack 5 or 6 small badges against the right edge, so tighten/standardize the gap or cap visible icons with a "+N" overflow
- Dim metadata dates further and reserve a consistent column for them on Resources. This reinforces title-first, metadata-second reading order as more entries are added
- Balance vertical whitespace on the Resources page. With only 3 entries, content pools at the top and leaves a large dead zone before the footer. Either center the list vertically, add a short intro line, or shrink the page's min-height so density matches Home/Demos
