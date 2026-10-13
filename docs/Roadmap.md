# Roadmap

Everything outstanding on cooperability.com, ranked by priority as task cards
an agent can pick up cold. It covers bugs, chores and new epics in one list.
Ranked 2026-10-11 from an adversarial design review of this plan and an
adversarial implementation review of the code (security, correctness, tests),
each by a reviewer that had not written what it graded. File and line
citations are as of commit `bf86ddb`. Re-check a line before editing it.

**State on 2026-10-11:** two P0s, both in the Opioid Converter, a public
medical calculator. It overstates methadone's morphine equivalence about
4x at 20 mg/day, and it turns a typed decimal dose into ten times the dose.
AI review is switched off in production (the status endpoint answers
`{"enabled":false,"reason":"unconfigured"}`), which is why the AI spend
findings sit at P1 and not P0. Draft PR
[#348](https://github.com/cooperability/cooperability.com/pull/348) fixes
`theme-tokens`. Draft PR [#347](https://github.com/cooperability/cooperability.com/pull/347)
proposes the Prompt Composer and Mandelbrot items carried here as
`prompt-composer-v3` and `mandelbrot-theme`.

## What the site must do

Priority follows this order. An item ranks by which of these it protects.

1. **Correct and usable for every visitor**, on a phone or a desktop, in
   either theme, with a keyboard or a screen reader.
2. **Bounded in cost.** Nothing spends past `AI_BUDGET_USD`, and no single
   visitor can take a feature offline for everyone else.
3. **Cheap to leave unattended.** A failure shows up somewhere the owner will
   look, and every switch has an undo.
4. **Legible to recruiters and to agents.** The AI work is visible and
   running, and the docs describe the code that exists.

**Out of scope here:** writing resource content (`src/resources/*.mdx`),
weekly Dependabot bumps (the `triage-dependabot` skill batches those), and
Candlelight game tuning ([Candlelight Beta](Candlelight-Beta.md) owns its
playtest backlog).

## How to pick up an item

1. Take the first open card in the [ranked index](#ranked-index) whose
   **Depends on** items are all done. Skip cards marked **Owner only**: they
   spend money, choose a license, or cannot be undone.
2. Check nobody has it: `gh pr list --state open --search '"<id>" in:title,body'`. A card
   with an open PR is taken.
3. Branch from a fresh `main`. Use the card id as the commit scope, for
   example `fix(ai-store-guard): fail closed on the memory store in prod`.
4. For a bug, write the test from **Done when** first and watch it fail.
5. Pass `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
6. In the same PR, set only the card's **Status** cell in the index to
   `Done, #NNN`. Two card PRs on adjacent rows still conflict on that table:
   rebase and keep both cells. The owner moves finished
   cards to the [Done log](#done-log). Open the PR as a draft. Never merge it.

**Priority.** P0: live harm now (wrong medical output, spend without a
ceiling, an exposed secret, the site down). Drop everything. P1: a defect
visitors hit today, an accessibility failure, or a blocker for another P1.
P2: a clear improvement with a named payoff. P3: polish, hygiene, optional.
Within a tier, cards are in pick order.

**Effort.** S: one PR, a few source files plus their tests. M: one PR with a new test
harness or many files. L: several PRs.

**Kind.** Bug: wrong today. Chore: no behaviour change for visitors. Epic: a
new capability.

## Ranked index

| #   | Id                                                    | Kind  | Pri | Effort | Depends on                        | Status                 |
| --- | ----------------------------------------------------- | ----- | --- | ------ | --------------------------------- | ---------------------- |
| 1   | [`opioid-methadone`](#opioid-methadone)               | Bug   | P0  | S      | none                              | In review, #350        |
| 2   | [`opioid-input`](#opioid-input)                       | Bug   | P0  | S      | none                              | In review, #350        |
| 3   | [`opioid-factors`](#opioid-factors)                   | Bug   | P1  | M      | `opioid-methadone`                | Open                   |
| 4   | [`theme-tokens`](#theme-tokens)                       | Bug   | P1  | S      | none                              | In review, #348        |
| 5   | [`focus-contrast`](#focus-contrast)                   | Bug   | P1  | S      | `theme-tokens`                    | Open                   |
| 6   | [`responsive-css`](#responsive-css)                   | Bug   | P1  | M      | none                              | Open                   |
| 7   | [`candlelight-ios-select`](#candlelight-ios-select)   | Bug   | P1  | S      | none                              | Open                   |
| 8   | [`skillicons-local`](#skillicons-local)               | Bug   | P1  | S      | none                              | Done, #361             |
| 9   | [`ai-store-guard`](#ai-store-guard)                   | Bug   | P1  | S      | none                              | Open                   |
| 10  | [`ai-caller-cap`](#ai-caller-cap)                     | Bug   | P1  | M      | none                              | Open                   |
| 11  | [`ai-go-live`](#ai-go-live)                           | Chore | P1  | S      | `ai-store-guard`, `ai-caller-cap` | Owner only             |
| 12  | [`offline-applets`](#offline-applets)                 | Bug   | P2  | S      | none                              | Open                   |
| 13  | [`mandelbrot-theme`](#mandelbrot-theme)               | Bug   | P2  | S      | none                              | Open                   |
| 14  | [`candlelight-controls`](#candlelight-controls)       | Bug   | P2  | S      | none                              | Open                   |
| 15  | [`mandelbrot-fixes`](#mandelbrot-fixes)               | Bug   | P2  | M      | none                              | Open                   |
| 16  | [`prompt-composer-desktop`](#prompt-composer-desktop) | Epic  | P2  | M      | none                              | Open                   |
| 17  | [`resources-frontmatter`](#resources-frontmatter)     | Bug   | P2  | S      | none                              | Open                   |
| 18  | [`a11y-in-ci`](#a11y-in-ci)                           | Chore | P2  | M      | `theme-tokens`                    | Open                   |
| 19  | [`ai-switch-failsafe`](#ai-switch-failsafe)           | Bug   | P2  | S      | none                              | Open                   |
| 20  | [`ai-billing-check`](#ai-billing-check)               | Chore | P2  | S      | none                              | Open                   |
| 21  | [`error-tracking`](#error-tracking)                   | Epic  | P2  | M      | none                              | Open                   |
| 22  | [`csp-enforce`](#csp-enforce)                         | Chore | P2  | S      | `error-tracking`                  | Open                   |
| 23  | [`ai-evals`](#ai-evals)                               | Epic  | P2  | M      | none                              | Open                   |
| 24  | [`json-ld-demos`](#json-ld-demos)                     | Epic  | P2  | S      | none                              | Open                   |
| 25  | [`case-study`](#case-study)                           | Epic  | P2  | M      | `ai-go-live`                      | Open                   |
| 26  | [`ai-fence-escape`](#ai-fence-escape)                 | Chore | P3  | S      | none                              | Open                   |
| 27  | [`ai-reservation-margin`](#ai-reservation-margin)     | Chore | P3  | S      | none                              | Open                   |
| 28  | [`audit-workflow`](#audit-workflow)                   | Chore | P3  | S      | none                              | Open                   |
| 29  | [`pnpm-integrity`](#pnpm-integrity)                   | Chore | P3  | S      | none                              | Open                   |
| 30  | [`mdx-cleanup`](#mdx-cleanup)                         | Chore | P3  | S      | none                              | Open                   |
| 31  | [`dead-code`](#dead-code)                             | Chore | P3  | S      | none                              | Open                   |
| 32  | [`src-tree-merge`](#src-tree-merge)                   | Chore | P3  | M      | `dead-code`                       | Open                   |
| 33  | [`swc-gitignore`](#swc-gitignore)                     | Chore | P3  | S      | none                              | Open                   |
| 34  | [`sw-kill-switch`](#sw-kill-switch)                   | Chore | P3  | S      | none                              | Open                   |
| 35  | [`offline-fallback`](#offline-fallback)               | Epic  | P3  | S      | `offline-applets`                 | Open                   |
| 36  | [`tw-animate-css`](#tw-animate-css)                   | Chore | P3  | S      | none                              | Open                   |
| 37  | [`small-fixes`](#small-fixes)                         | Bug   | P3  | S each | none                              | Open                   |
| 38  | [`prompt-composer-v3`](#prompt-composer-v3)           | Epic  | P3  | M      | none                              | Open, proposed in #347 |
| 39  | [`ai-cost-dashboard`](#ai-cost-dashboard)             | Epic  | P3  | S      | `ai-go-live`                      | Open                   |
| 40  | [`ai-haiku-fallback`](#ai-haiku-fallback)             | Epic  | P3  | S      | `ai-evals`                        | Open                   |
| 41  | [`og-images`](#og-images)                             | Epic  | P3  | M      | none                              | Open                   |
| 42  | [`applet-icons`](#applet-icons)                       | Epic  | P3  | S      | none                              | Open                   |
| 43  | [`rss-feed`](#rss-feed)                               | Epic  | P3  | S      | none                              | Open                   |
| 44  | [`visual-polish`](#visual-polish)                     | Chore | P3  | S each | `focus-contrast` for some         | Open                   |
| 45  | [`seo-site-audit`](#seo-site-audit)                   | Chore | P3  | S      | none                              | Owner only             |
| 46  | [`license`](#license)                                 | Chore | P3  | S      | none                              | Owner only             |

## P0

`ai-store-guard` also becomes P0 the moment `ANTHROPIC_API_KEY` is set in
production before it lands. Until both opioid cards land, the owner may want
to take `/demos/opioid-converter` down or put a warning on it.

### `opioid-methadone`

Methadone's morphine equivalence is wrong in both directions.

`Bug` · P0 · S · Depends on: none · The owner confirms the source table in
the PR

- **Why.** `src/components/opioid-converter/OpioidConverter.tsx:124` squares
  the methadone dose to get morphine milligram equivalents (MME). Line 133
  converts back with `sqrt(total * 4)`, whose exact inverse is
  `dose² / 4`, not `dose²`. So X mg of methadone always shows a methadone
  equivalence of 2X mg (Confirmed by reading the code). Against the CDC 2022
  guideline factor of 4.7, the output runs 4.3x high at 20 mg/day (400 MME
  against 94) and 17x high at 80 mg/day (6,400 against 376). An inflated
  MME, used to rotate a methadone patient to another opioid, points toward
  an overdose. The tool's own description
  (`src/components/opioid-converter/opioid_converter.mdx:4`) offers it for
  "determining appropriate methadone conversions".
- **Test that pins the bug.**
  `src/__tests__/components/opioid-converter.test.tsx:38-44` asserts that
  10 mg methadone equals 100 MME. A correct fix turns it red. Rewrite it
  against the cited source.
- **Do.** Replace the square with a sourced method: the CDC 2022 linear
  factor (4.7, in the guideline's Table,
  [MMWR rr7103a1](https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm)), or a
  tiered table. The CDC opioid-cds library
  ([Library-ConversionFactors](https://fhir.org/guides/cdc/opioid-cds/Library-ConversionFactors.html))
  still carries the 2016 tiers (4, 8, 10, 12 by dose band), not 4.7, as
  fetched on 2026-10-11.
  Make the morphine-to-methadone output the exact inverse, or remove it:
  CDC warns against using MME totals for opioid rotation. Show the source
  on the page, with a visible "not a substitute for clinical judgment"
  notice. The only disclaimer today is in `OPIOID-CONVERTER-README.md:136`.
- **Done when.** Methadone 20 mg/day gives the cited value (94 MME on the
  linear factor). Methadone X round-trips to X. Both tests fail on today's
  code.

### `opioid-input`

A typed decimal dose becomes ten times the dose.

`Bug` · P0 · S · Depends on: none

- **Why.** Each dose input is controlled by a number
  (`OpioidConverter.tsx:143` stores `Number(value)`, `:214` renders
  `dailyDose || ''`). Typing "2." stores 2, the field redraws as "2", and the
  next keystroke makes "25". Typing "0" stores 0, which is falsy, so the
  field blanks and "0.5" ends up as 5. Every fractional dose is hit:
  hydromorphone 0.5 mg, Duragesic 37.5 µg/h, Butrans 7.5 µg/h. Confirmed in
  jsdom with one change event per keystroke. The browser behaviour is
  Probable, since this is how React controlled inputs work. The same path
  shows "NaN mg" for "abc", a negative MME for "-100", and Infinity for
  "1e400". The `pattern` attribute does not stop typing.
- **Do.** Keep the raw string per row in state. Accept only
  `^\d*\.?\d*$`. Parse to a number only when computing totals, and treat
  anything unparseable as 0.
- **Done when.** A test typing "2", ".", "5" into Morphine shows "2.5" and a
  total of 3 mg (the page rounds). "0.5" stays "0.5". "abc" and
  "-100" never show NaN or a negative total. Each fails on today's code.

## P1

### `opioid-factors`

Pin every conversion factor to one cited table, and say so on the page.

`Bug` · P1 · M · Depends on: `opioid-methadone`

- **Why.** The live table mixes guideline vintages and cites nothing.
  Hydromorphone is 4 (CDC 2016), while tramadol is 0.2 (CDC 2022, where
  hydromorphone is 5). Pentazocine is 0.2, against 0.37 in the CDC
  opioid-cds library. Levorphanol (7.5), tapentadol (0.367) and Butrans
  (4.5 per µg/h) differ from CMS values. Those three are Probable or
  Unverified, from the reviewer's recall. Tests pin only morphine and oxycodone exactly,
  so 12 of the 14 factors can change to another non-zero value without a
  test failing. The display name "Pentazocin" is
  misspelled.
- **Do.** Pick one table (CDC 2022 is the default choice). Make every factor
  match it, and cite it under the calculator. Add a table-driven test that
  pins all 14 factors. Delete the unused
  `src/components/opioid-converter/utils/calculations.ts` and its unused
  `types.ts` exports. Nothing imports them, and their hydromorphone factor
  (5) disagrees with the live one (4).
- **Done when.** The table-driven test passes and fails if any factor
  changes. Hydromorphone 10 mg gives 50 MME on CDC 2022 (40 today).

### `theme-tokens`

Every shadcn colour token is an invalid colour.

`Bug` · P1 · S · Depends on: none · **In review:**
[#348](https://github.com/cooperability/cooperability.com/pull/348)

- **Why.** `src/styles/global.css` defines `--primary`, `--muted`, `--ring`
  and the rest as `oklch(...)`, and its `@theme` block wraps each in
  `hsl(var(--x))` (lines 19-44). The browser drops the declaration. The
  default `Button` has no fill, a checked `Checkbox` has no fill,
  `text-muted-foreground` is not muted, and `focus-visible:ring-ring` draws no
  focus ring on any Radix control (WCAG 2.4.7). axe and Lighthouse both
  passed while this was broken, because neither tests focus visibility.
- **Do.** After the owner merges #348, update the `@theme` example in
  `docs/Tooling.md` (line 498), which #348 leaves showing
  `hsl(var(--border))`. Remove the palette-class workarounds marked in
  `src/components/prompt-composer/ComponentSelector.tsx:39` and
  `AiReview.tsx:13-14`.
- **Done when.** `src/__tests__/styles/global-css.test.ts` (added in #348)
  passes, and tabbing through `/`, `/demos` and `/demos/prompt-composer`
  shows a ring on every control in both themes.

### `focus-contrast`

Focus rings and muted labels meet WCAG AA contrast.

`Bug` · P1 · S · Depends on: `theme-tokens`

- **Why.** With #348 merged, the ring is `--ring` at 50% alpha, measured at
  1.56:1 on white. WCAG 1.4.11 asks for 3:1. The muted "(Ongoing)" and
  "(2025)" labels on `/demos` (`src/app/demos/page.tsx:28,123`) read
  borderline on black. Some icon-only buttons have no screen-reader name
  ([Accessibility](Accessibility.md), Outstanding). Checking before #348
  merges is wasted work, because today the ring does not render at all.
- **Do.** Raise the ring to at least 3:1 in both themes. Measure each muted
  label against its background. Give every icon-only button an
  `aria-label` or visually hidden text. Cover the nav pill, theme toggle and
  quote refresh icon.
- **Done when.** A test or a recorded measurement shows 3:1 or better for
  the ring and 4.5:1 for muted text, in both themes. `pnpm a11y` reports 0
  violations.

### `responsive-css`

Replace `useResponsive` layout switching with CSS breakpoints.

`Bug` · P1 · M · Depends on: none

- **Why.** During SSR and hydration the hook returns `isDesktop: true`
  (`src/hooks/useResponsive.ts:63-72`). `src/sections/Header.tsx:69`
  therefore server-renders the desktop nav on phones and swaps to the
  hamburger once JS loads. That is a layout shift on every mobile page load,
  on every route. `src/app/resources/resources-list.tsx:11` does the same. The Footer
  used the hook too until #347 (merged 2026-10-11) removed it, which moved
  the Header line to `:65`.
- **Do.** Render both layouts and pick with Tailwind breakpoint classes
  (`md:hidden`, `hidden md:flex`). Make `resources-list.tsx` a server
  component once it no longer needs the hook. Delete the hook if nothing
  else imports it, and update the `useResponsive` section of
  `docs/Performance.md`.
- **Done when.** The server HTML for `/` contains the mobile nav markup, and
  a jsdom test with no `window.innerWidth` set renders both nav variants
  with the right breakpoint classes. That test fails against the current
  hook.

### `candlelight-ios-select`

Held buttons on iOS highlight like selected text and lag.

`Bug` · P1 · S · Depends on: none

- **Why.** On iOS, a Candlelight button held down keeps highlighting as
  though it were text being selected, and input lags at game-critical
  moments (reported by the owner on an iPhone). The shell root already sets
  `user-select: none`, `-webkit-user-select: none`,
  `-webkit-touch-callout: none` and a transparent tap highlight
  (`src/components/game/Handheld.module.css:33-36`), and the root cancels
  `contextmenu` (`src/components/game/Handheld.tsx:305`). So the highlight
  comes from something those rules do not reach. Suspects, none confirmed:
  a child that resets `user-select`, a passive `touchstart` listener that
  lets Safari start its long-press selection, or an element outside the
  root such as the top bar.
- **Do.** Reproduce on a real iPhone in Safari and as an installed app.
  Find which element takes the selection (Safari Web Inspector over USB).
  Fix at that element, for example `user-select: none` on every control and
  its label, or a non-passive `touchstart` that calls `preventDefault` on
  the controls only. Keep scrolling and pinch blocked as today.
- **Done when.** Holding each button for 3 seconds on iOS Safari and in the
  installed app shows no highlight, loupe or callout, and the game reads the
  press with no visible delay. Record the device and iOS version in the PR.
  The QA scenarios in [Candlelight Beta](Candlelight-Beta.md) still pass.

### `skillicons-local`

Close the open image-optimizer source set for skillicons.dev.

`Bug` · P1 · S · Depends on: none

- **Why.** `next.config.js:50-59` allows `https://skillicons.dev/icons/**`
  with any query string. A visitor can request
  `/_next/image?url=https%3A%2F%2Fskillicons.dev%2Ficons%3Fi%3D<anything>&w=64&q=75`
  with endless distinct `i` values, and each one is a new source image for
  Vercel Image Optimization. That spends quota or money outside any ledger.
  The match is Confirmed (Next's `matchRemotePattern`, run locally). The
  billing effect is Probable and depends on the Vercel plan. The same remote
  pattern is why `dangerouslyAllowSVG` is on.
- **Do.** Download the icon set the site uses into `public/icons/stack/` as
  static SVGs. Point `src/components/ActiveIcon.tsx` at them. Remove the
  remote pattern and `dangerouslyAllowSVG`. Update [Icons and SVG](Icons.md)
  and the README trust boundary (skillicons.dev stops being a runtime third
  party).
- **Done when.** `next.config.js` has no `remotePatterns` and no
  `dangerouslyAllowSVG`. Every stack icon on `/demos` renders in both
  themes from a local file.

### `ai-store-guard`

Fail closed when the AI spend ledger has no shared store in production.

`Bug` · P1 (P0 once a key is set) · S · Depends on: none · Blocks:
`ai-go-live`

- **Why.** `getStore()` falls back to an in-memory store whenever the
  Upstash variables are missing, and logs nothing
  (`src/lib/ai/store.ts:134-140`). In production that gives every cold
  serverless instance its own fresh budget, so total spend scales with
  instance count. `pnpm ai:off` and `pnpm ai:status` talk to Upstash from a
  laptop, so they report a healthy shared ledger the function never reads.
  The comment at `store.ts:10-11` says the store kind is surfaced by the
  status endpoint. It is not: `Availability` in `switch.ts` has no `kind`
  field, and nothing outside `store.ts` reads `.kind`.
- **Early symptom.** The Anthropic Console bill is the only signal today.
  After this lands: the status endpoint reports `store: "memory"`.
- **Do.** When `VERCEL_ENV === 'production'` and the store is memory, answer
  503 `unavailable`. Add `store: kind` to the GET status body and to
  `scripts/ai-switch.mjs` status output. Fix the `store.ts:10-11` comment.
- **Files.** `src/lib/ai/store.ts`, `src/lib/ai/switch.ts`,
  `src/lib/ai/critique.ts`, `scripts/ai-switch.mjs`, their tests,
  [AI Review](AI-Review.md).
- **Done when.** A test with `VERCEL_ENV=production` and no KV variables gets
  503 from POST and `store: "memory"` from GET. Reverting the guard turns it
  red.

### `ai-caller-cap`

Stop one visitor from draining the period budget for everyone.

`Bug` · P1 · M · Depends on: none · Blocks: `ai-go-live`

- **Why.** Per instance, one IP gets 5 requests at once plus 1 every 12 s
  (`src/app/api/ai/critique/route.ts:19`). A client that posts an 8,000-character prompt, waits for the 200 headers
  and disconnects keeps the full worst-case reservation: 61,360 micro-USD
  for ASCII and 96,562 for CJK text (measured with `reservationMicro`).
  About 51 CJK requests fill the default $4.90 of admissible budget, roughly
  9 minutes from one address on one instance. Every visitor then gets `budget` until the UTC
  month rolls over (`src/lib/ai/budget.ts:51-55`). The money stays capped.
  The feature does not stay up. The old roadmap line called the global
  per-IP limit "fairness, not cost". It is the availability defence.
- **Do.** Reserve against a per-caller counter
  (`ai:spend:ip:<ipKey>:<period>`) capped at about 10% of the ceiling, in the
  same store and the same reserve call as the global one. When the share is spent, answer 429 with
  `Retry-After` set to the period end. Leave the GET status global. Give the
  per-caller key the same TTL as the period key. For the cross-instance
  per-IP limit, move the token buckets into Upstash, or have the owner add
  a Vercel Firewall rate-limit rule on `/api/ai/critique` (dashboard, no
  code). A caller rotating many addresses stays the residual risk, which
  the global ceiling still bounds. Consider
  `AI_BUDGET_WINDOW=week` to shorten any outage. Add a threat-model row to
  [AI Review](AI-Review.md).
- **Done when.** A test where one `ipKey` makes N disconnecting requests
  stops at the share cap while a second `ipKey` is still admitted.

### `ai-go-live`

Switch AI review on in production.

`Chore` · P1 · S · Depends on: `ai-store-guard`, `ai-caller-cap` · **Owner
only** (spends money)

- **Why.** Prompt Composer's AI review is the site's headline AI work, and
  it is dark in production. Turning it on is worth more to a recruiter than
  any new AI epic.
- **Do.** Add Upstash for Redis from the Vercel Marketplace. Set
  `ANTHROPIC_API_KEY` and `AI_BUDGET_USD` for the **Production** environment
  only (Vercel defaults new variables to every environment, including
  Preview). Put the key in its own Claude Console workspace with a spend
  limit. Steps in [AI Review](AI-Review.md#setup).
- **Recommended first:** `error-tracking`, so a client-side failure after
  launch is visible.
- **Done when.** `GET /api/ai/critique` reports enabled with
  `store: "upstash"`, and one review completes from the live page.

## P2

### `offline-applets`

Make the three installable applets open offline.

`Bug` · P2 · S · Depends on: none

- **Why.** [PWA Suite](PWA.md) sells each applet as an installable app, but
  `scripts/build-sw.mjs:46` precaches only the `/demos/candlelight` HTML. An
  installed Opioid Converter opened offline shows the browser's error page.
- **Do.** Add `/demos/opioid-converter`, `/demos/prompt-composer` and
  `/demos/mandelbrot-explorer` to `additionalPrecacheEntries`, revisioned by
  build id as Candlelight is. Prompt Composer's AI review still needs the
  network: check that `AiReview.tsx` shows its error state, not a spinner,
  when offline.
- **Done when.** A unit test asserts all four demo URLs are in
  `additionalPrecacheEntries`. In a production build, each applet loads with
  the network off in DevTools after one online visit.

### `mandelbrot-theme`

Make Mandelbrot Explorer follow the site's theme toggle.

`Bug` · P2 · S · Depends on: none · Proposed in #347

- **Why.** `MandelbrotExplorer.module.css` switches palettes on
  `@media (prefers-color-scheme: light)`, the OS setting. The rest of the
  site switches on the `next-themes` class. The toggle changes nothing on
  that page, and on a dark OS it stays dark in the site's light mode.
- **Do.** Re-key the light overrides to the theme class, as the site's
  other components do.
- **Done when.** Toggling the theme on `/demos/mandelbrot-explorer` changes
  its palette on a dark-OS browser.

### `candlelight-controls`

Move Candlelight's touch controls toward the bottom of the screen in
landscape, and up slightly in portrait.

`Bug` · P2 · S · Depends on: none

- **Why.** In landscape the d-pad and face buttons fill full-height columns
  either side of the screen
  (`src/components/game/Handheld.module.css:44-50`, grid areas
  `'dpad screen face'`), which puts them higher than a thumb rests. In
  portrait the control group sits centred between two equal spacer rows
  (`Handheld.module.css:137-160`). The owner reports portrait is almost
  right but could sit slightly higher.
- **Do.** In landscape, anchor `dpad` and `face` to the bottom of their
  columns, clear of `env(safe-area-inset-bottom)`. In portrait, make the
  spacer row below the controls a little taller than the one above, so the
  group rises slightly. Touch only the `@media (orientation: ...)` blocks
  for touch mode, not the `data-mode='external'` layout.
- **Done when.** Screenshots from the browser pass in
  [Candlelight Beta](Candlelight-Beta.md) at a phone landscape viewport
  (844 by 390) show both control clusters in the lower part of the screen,
  and at portrait (390 by 844) show the group slightly above centre. The
  scenario that checks every drawn cap presses its own button still passes.

### `mandelbrot-fixes`

Fix the Mandelbrot render loop and gestures, and test them.

`Bug` · P2 · M · Depends on: none

- **Why.** Every component test mocks `getContext` to null, so the render
  loop (`src/components/mandelbrot-explorer/MandelbrotExplorer.tsx:72-160`)
  never runs under test. Deleting line 151 fails nothing. Defects found by
  tracing the code:
  1. The rAF render chain is never cancelled (`:151`, `:511-513`).
     Unmounting mid-render paints up to 49 more frames to a detached canvas
     and sets state on an unmounted component. Under StrictMode in dev, two
     chains interleave.
  2. The pan preview mixes CSS pixels and canvas pixels (`:58`). On a
     343 px phone the image tracks the finger at 0.69x, then jumps on
     release.
  3. A pinch with both touches at one point divides by zero (`:409`) and
     collapses the view to a single colour until Reset. Rare on a real
     device.
  4. After 8 zooms the `toFixed(4)` readout (`:593`, `:599`) shows equal
     min and max. Past about 30 zooms, float64 precision runs out and the
     render turns blocky.
- **Do.** Track the rAF id and a generation counter, and cancel in the
  effect's cleanup. Scale the drag offset by `canvasSize / rect.width`.
  Guard `pinchDistance > 0`. Use `toPrecision` and cap the zoom depth.
- **Done when.** With a stub context and stub rAF: 500 rows produce 50
  `putImageData` calls, unmount leaves 0 pending frames, and a 50 px drag
  on a 250 px-wide canvas draws at x = 100. Each fails on today's code.

### `prompt-composer-desktop`

A desktop layout for Prompt Composer.

`Epic` · P2 · M · Depends on: none

- **Why.** `src/components/prompt-composer/PromptComposer.tsx` stacks every
  card in one column at all widths (`flex flex-col`). That suits a phone. On
  a wide screen the compiled prompt, Live Check and AI review sit below the
  Components card, so a visitor scrolls away from the fields they are
  editing to see the result.
- **Do.** From the `lg` breakpoint, use two columns: the Components card on
  the left, and on the right the Compiled Prompt, Live Check and AI review
  cards, sticky so they stay in view while the left column scrolls. Keep the
  single column below `lg`. Use Tailwind breakpoint classes only, no
  `useResponsive`.
- **Done when.** At 1440 px wide the Compiled Prompt card is visible beside
  the Components card without scrolling, and at 390 px the order matches
  today. A component test asserts the `lg:` grid classes on the container.

### `resources-frontmatter`

Validate resource front matter when it loads.

`Bug` · P2 · S · Depends on: none

- **Why.** A bad date or a missing title crashes a page at render time with
  an error that names no file. `date: '2025-13-45'` makes date-fns throw
  `RangeError: Invalid time value` in `src/components/date.tsx`. An
  unquoted `date: 2025-05-18` comes back from gray-matter as a `Date`, and
  `parseISO` throws. A missing `title` throws in `src/lib/llms.ts:44,63`
  during the build of `/llms.txt`. All three Confirmed by probe. Every
  current file quotes its dates, so nothing breaks today. The sort in
  `src/app/resources/page.tsx:27` returns -1 for equal dates in both
  directions, which is an inconsistent comparator.
- **Do.** Validate `title` and `date` (a quoted `YYYY-MM-DD` that parses)
  in `src/lib/resources.ts`, and throw with the file name. Sort with
  `b.date.localeCompare(a.date)`.
- **Done when.** Tests feeding each of the three bad inputs get an error
  naming the file at load time.

### `a11y-in-ci`

Run the existing accessibility audit in CI.

`Chore` · P2 · M · Depends on: `theme-tokens`

- **Why.** `scripts/a11y-audit.mjs` already runs axe and Lighthouse on
  Playwright's Chromium, but only by hand. This replaces three older lines
  that would have added a second and third mechanism: Lighthouse CI,
  a separate Playwright E2E suite, and "re-run the audit on a schedule".
- **Do.** `pnpm a11y` starts its own dev server, so CI cannot reuse it
  as is. Add a CI job that runs `NEXT_PUBLIC_AXE_FORCE_THEME=light pnpm build`,
  starts `next start -p 3000` (`scripts/a11y-audit.mjs` hardcodes that port),
  and runs `pnpm a11y:run-audits` with budgets that fail the job. Add one
  Opioid Converter flow: type a dose, check the total. Add one theme-switch check and
  one Tab-through focus check (press Tab until the target is focused, and
  wait out `transition-all` before reading `box-shadow`).
- **Done when.** A PR that removes an `aria-label` from an icon button fails
  CI.

### `ai-switch-failsafe`

Make `AI_REVIEW_ENABLED` fail safe on a typo.

`Bug` · P2 · S · Depends on: none

- **Why.** `disabledByEnv` turns review off only for a known falsy word
  (`src/lib/ai/switch.ts:8-13`). `AI_REVIEW_ENABLED=flase` or `=disable`
  leaves it on. The budget parser already fails safe on typos.
- **Do.** Treat unset as on, a known truthy word as on, and anything else as
  off.
- **Done when.** A test shows `flase` and `disable` report `disabled`, and
  `true` and unset report enabled.

### `ai-billing-check`

Confirm what Anthropic bills for aborted and retried requests.

`Chore` · P2 · S · Depends on: none

- **Why.** Two Unverified gaps. A client abort before the first event ends in
  `finish('failed')`, which charges 0 (`src/lib/ai/critique.ts:294-300`).
  If Anthropic bills input for an accepted request that was then aborted,
  an abort loop spends without being counted. The SDK's default
  `maxRetries: 2` (`src/lib/ai/client.ts:13`) could put three billed
  attempts under one reservation.
- **Do.** Answer both from Anthropic's docs or one Console usage check. Set
  `maxRetries` explicitly. If aborted prefill is billed, settle `failed`
  after send at the input cost.
- **Done when.** [AI Review](AI-Review.md) states both answers with their
  source, and the code matches.

### `error-tracking`

See client-side runtime errors.

`Epic` · P2 · M · Depends on: none

- **Why.** Nothing reports a client-side exception today. Any enforcement
  switch (`csp-enforce`, `ai-go-live`) should have that visibility first.
- **Do.** Pick Sentry or Vercel's own, cookieless, sampled. Wire it into
  `src/app/global-error.tsx` and `error.tsx`. Keep the privacy statement
  accurate.
- **Done when.** A thrown error on a preview deploy shows up in the tracker
  with its route.

### `csp-enforce`

Enforce the CSP that already ships in report-only mode.

`Chore` · P2 · S · Depends on: `error-tracking`

- **Why.** The old roadmap said enforcement needs a per-request nonce. It
  does not: the policy already allows `'unsafe-inline'` scripts
  (`next.config.js:14`). It ships as `Content-Security-Policy-Report-Only`
  (`next.config.js:43`) with no `report-uri` or `report-to`, so violations
  reach only the console of whoever opens DevTools.
- **Do.** On a preview deploy, open every route (each applet, Candlelight,
  a resource page, the 404) with the console open and record any
  violation. Fix or allow each one. Then rename the header to
  `Content-Security-Policy`, and correct the comment at
  `next.config.js:5-11`, which still says enforcement needs a nonce. A nonce policy that drops `'unsafe-inline'` is
  [parked](#parked-epics).
- **Done when.** Production sends an enforced `Content-Security-Policy` and
  a preview walk-through records zero violations.

### `ai-evals`

Catch reviewer-prompt and schema regressions.

`Epic` · P2 · M · Depends on: none

- **Why.** Nothing stops a prompt or schema change from silently degrading
  reviews. The old plan ran a live model on every PR. That spends outside
  the ledger, flakes on score ranges, and fails on Dependabot and fork PRs,
  which get no repository secrets.
- **Do.** Two layers. Every PR: deterministic Jest checks of the schema,
  fence escaping and output validation, no network. On demand: a live eval
  of fixture prompts against expected score ranges and suggested
  components, run only on `workflow_dispatch` or changes under
  `src/lib/ai/**`, with its own Console workspace and limit. Include hostile
  fixtures that ask the reviewer to do the task instead
  ([threat #5](AI-Review.md#threat-model)).
- **Done when.** Breaking the response schema fails the Jest layer, and the
  live layer runs green once against the current prompt.

### `json-ld-demos`

Structured data for each demo.

`Epic` · P2 · S · Depends on: none

- **Why.** The home page carries a `Person` block (`src/app/page.tsx:45-69`,
  rendered at `:78-81`).
  The demo pages carry nothing, so search engines see no
  `SoftwareApplication`.
- **Do.** Add a `SoftwareApplication` block to each demo route. Share one serializer that replaces every `<` with `\u003c`, since
  `JSON.stringify` leaves `</script>` intact. Use it for the existing `Person`
  block too.
- **Done when.** Google's Rich Results Test parses each demo page, and a test
  with `</script>` in a field shows no raw closing tag.

### `case-study`

A "how it's built" page for the AI infrastructure.

`Epic` · P2 · M · Depends on: `ai-go-live`

- **Why.** The AI review route (spend ledger, threat model, off switch) is
  the portfolio piece, and nothing on the site explains it to a recruiter.
  It should showcase a feature that is switched on.
- **Do.** One MDX resource drawing on [AI Review](AI-Review.md) and the
  systems diagram in the README.
- **Done when.** The page is linked from `/demos` and from the Prompt
  Composer page.

## P3

### `ai-fence-escape`

Escape every angle bracket in reviewed prompts.

`Chore` · P3 · S · Depends on: none

- **Why.** `src/lib/ai/prompts.ts:37` escapes the exact fence tag in any
  case or spacing. Five lookalikes pass through unchanged (measured):
  `</prompt_to_critique attr>`, `</prompt-to-critique>`,
  `</prompt_to_critique/>`, a zero-width space inside the tag, and fullwidth
  brackets. Impact is low: output is schema-bound, capped and rendered as
  text, so an injection only changes what the injector sees.
- **Done when.** All five come out with no raw `<` inside the fence, and
  threat-model row 6 in [AI Review](AI-Review.md) drops its caveat.

### `ai-reservation-margin`

Make the worst-case reservation hold for fence-dense prompts.

`Chore` · P3 · S · Depends on: none

- **Why.** 400 copies of `<prompt_to_critique>` grow an 8,000-byte prompt to
  a 10,443-byte message. The reservation counts 8,800 for the prompt
  (`src/lib/ai/critique.ts:83-89`), 1,643 under the escaped 10,443. That is
  more than the 1,500-token schema allowance that would otherwise absorb it,
  under the comment's own "tokens ≤ bytes" bound. Real token counts sit far below
  bytes, so no actual undershoot is likely (Probable).
- **Do.** Reserve on the escaped content, or use a 1.3 factor.
- **Done when.** A fence-dense case in `critique.test.ts` (near line 705)
  reserves at least the escaped message bytes plus system bytes plus the
  schema allowance.

### `audit-workflow`

Tidy the security-audit workflow.

`Chore` · P3 · S · Depends on: none

- **Why.** Four loose ends in `.github/workflows/security-audit.yml`. The
  high-severity audit is advisory (`|| true` at line 56) with no written
  reason. A checkout or setup failure on a scheduled run still reaches the
  issue step, which keys on `failure()` scoped to schedule runs (lines 63
  and 67), not on the audit step's outcome. `issues: write` is granted at
  workflow scope, so PR and push runs hold it too. Two advisories have no
  published fix: braces GHSA-vfj7-8cjw-p6xm (high) and sprintf-js
  GHSA-hp3w-g68c-fv3c (moderate), both build or lint time only.
- **Do.** Key the issue step on the audit step's `outcome`. Move
  `issues: write` to a schedule-only job. Make `high` blocking with an
  allowlist for the two advisories above, or write down why it stays
  advisory. Override both once fixes ship.
- **Done when.** A forced checkout failure on a scheduled run opens no
  issue, and PR runs show no `issues: write` in the token permissions.

### `pnpm-integrity`

Pin pnpm by hash.

`Chore` · P3 · S · Depends on: none

- **Why.** `packageManager` in `package.json` is `pnpm@11.24.0` with no
  integrity hash, so corepack trusts the registry for the binary. CI and
  `vercel.json` repeat the bare version.
- **Done when.** `packageManager` carries `+sha512.<hash>`, and a tampered
  hash fails the Vercel-shaped CI job.

### `mdx-cleanup`

Remove the MDX pipeline nothing uses.

`Chore` · P3 · S · Depends on: none

- **Why.** `remark` and `remark-html` have no importer (`git grep`).
  `@next/mdx`, `withMDX` and the `md`/`mdx` `pageExtensions`
  (`next.config.js:101-113`) apply to zero routes, since no `.mdx` file sits
  under `src/app`. Dependabot still bumps all of them. Only
  `next-mdx-remote/rsc` and `gray-matter` render resource pages.
- **Do.** Remove `remark`, `remark-html`, `@next/mdx`, `@mdx-js/loader`,
  `@mdx-js/react` and the `withMDX` wrapper. Update the version assertion in
  `src/__tests__/package-manager.test.ts:64` and the README dependency
  table.
- **Done when.** `pnpm build` passes and every `/resources/*` page renders
  as before.

### `dead-code`

Remove code and tracked files nothing uses.

`Chore` · P3 · S · Depends on: none

- **Why.** `components/ui/switch.tsx` and `components/ui/tooltip.tsx` have
  no importer, and neither do their packages `@radix-ui/react-switch` and
  `@radix-ui/react-tooltip` outside them. `public/workbox-7e7a8aeb.js` is
  tracked although `.gitignore:36` ignores `public/workbox-*.js`, so the
  site still serves a leftover from the `next-pwa` era. Keep
  `public/oldSite.html`: `src/resources/linktree.mdx:21` links to it.
- **Done when.** The files and both packages are gone, the README
  dependency table matches, and `pnpm build` and `pnpm test` pass.

### `src-tree-merge`

Move root `components/ui` and `lib/` into `src/`.

`Chore` · P3 · M · Depends on: `dead-code`

- **Why.** shadcn components live in root `components/ui` (8 files) and
  `lib/utils.ts`, while everything else lives under `src/`. `@/*` maps to
  the repo root (`tsconfig.json:19`). `components.json` points its `hooks`
  alias at root `hooks/`, which does not exist. A split, not a duplicate:
  `src/components/ui` does not exist, and 6 of the 8 root files are live.
- **Do.** Keep `@/*` mapped to the root (`tsconfig.json:19` and Jest's
  `moduleNameMapper`). Move the files to `src/components/ui` and
  `src/lib/utils.ts`, rewrite imports to `@/src/...`, and point the
  `components.json` aliases at `@/src/components`, `@/src/lib` and
  `@/src/hooks`. Symlinks are no option: they are disabled on the owner's machine
  and git checks them out as plain copies.
- **Done when.** Root `components/` and `lib/` are gone, every
  `components.json` alias resolves to an existing directory, and
  `pnpm typecheck` and `pnpm test` pass.

### `swc-gitignore`

Ignore `.swc/`.

`Chore` · P3 · S · Depends on: none

- **Why.** `.swc/` is untracked but not ignored (`git check-ignore` exits 1),
  so a careless `git add` can commit the cache.
- **Done when.** `git check-ignore .swc/x` exits 0.

### `sw-kill-switch`

A tested undo for a bad service worker.

`Chore` · P3 · S · Depends on: none

- **Why.** The worker controls `/` and calls `skipWaiting` (`src/sw.js`).
  Its blast radius is small today, since it precaches only content-hashed
  assets and one revisioned page. But no runbook says how to remove a
  broken one from visitors' browsers.
- **Do.** Document a self-unregistering `sw.js` in [PWA Suite](PWA.md),
  and the steps to ship it.
- **Done when.** The runbook exists and was exercised once on a preview.

### `offline-fallback`

An offline page, and `public/` assets in the precache.

`Epic` · P3 · S · Depends on: `offline-applets`

- **Why.** Icons and images under `public/` load on demand, and a route
  that was never visited shows the browser's error page offline.
- **Do.** Precache `public/icons` and `public/images`. Add an offline
  fallback route with network-first navigations, so a fallback can never
  serve stale HTML when the network is up.
- **Done when.** An unvisited route opened offline shows the fallback page.

### `tw-animate-css`

Replace `tailwindcss-animate`.

`Chore` · P3 · S · Depends on: none

- **Why.** It is a Tailwind 3 plugin that Tailwind 4 still loads through
  `@plugin` (`src/styles/global.css:3`). It works today.
  `tw-animate-css` is the Tailwind 4 replacement.
- **Done when.** Accordion and tooltip animations behave as before, and
  `tailwindcss-animate` is out of `package.json`.

### `small-fixes`

Five small correctness fixes, each its own PR or batched.

`Bug` · P3 · S each · Depends on: none

1. **Leading minus in constraints.** `src/components/prompt-composer/compile.ts:64`
   strips any leading `-`, `*` or `•`, so "-1 is invalid" compiles to
   "1 is invalid". Strip only a bullet followed by whitespace
   (`/^[-*•]\s+/`).
2. **Lint fix ids.** No test checks that the option ids lint offers as
   fixes (`quality-grounding`, `quality-unknown`) exist in `OPTIONS_BY_ID`.
   Renaming one adds a phantom id that still counts as good. Add the test.
3. **Unicode in lint.** `lint.ts:47` counts a CJK task with no spaces as one
   word, so it stays "weak". `lint.ts:245` misses the curly-apostrophe
   "don’t".
4. **Quote marks.** Two quotes in `src/lib/quotes.ts:28-29` lack their
   opening quote mark. Add a test that every quote opens with one.
5. **Duplicate slugs.** A `foo.md` beside a `foo.mdx` would produce duplicate
   static params (Hypothesis, untraced). Add a test or a guard.

- **Done when** (each). A test that fails on today's code passes.

### `prompt-composer-v3`

Four Prompt Composer features, each its own PR.

`Epic` · P3 · M · Depends on: none · Proposed in #347

1. **Target-model setting.** "Think first" and the length advice assume the
   user knows whether their model reasons on its own. A radio for reasoning
   or non-reasoning would hide or relabel "Think first". Touches the
   catalog, `ComponentSelector`, `compile`, `lint` and their tests.
2. **JSON schema field.** The JSON output option asks only for "valid JSON".
   Add an optional field, shown when JSON is picked, that compiles into an
   `<output_schema>` tag, plus a hint to use structured outputs.
3. **System and user split.** API users want the two parts separately.
   Context, quality and interaction go to a system pane, input and task to a
   user pane.
4. **Start from a preset.** Load a prompt from
   `src/resources/LLMPrompts.mdx` into the composer's fields.

- **Done when** (each). The feature has a component test that fails
  without it, and the compiled prompt for an existing preset is unchanged
  when the feature is unused.

### `ai-cost-dashboard`

Aggregate the per-review cost lines.

`Epic` · P3 · S · Depends on: `ai-go-live`

- **Why.** Each review logs one `ai.critique` JSON line with tokens, charge
  and latency (`src/lib/ai/critique.ts:262`). `pnpm ai:status` already shows
  period spend. What is missing is a p95 latency and a per-day view.
- **Do.** A saved Vercel Observability query. No exporter until that falls
  short.
- **Done when.** One saved query shows daily spend and p95 latency.

### `ai-haiku-fallback`

A cheaper model for AI review.

`Epic` · P3 · S · Depends on: `ai-evals`

- **Why.** `claude-haiku-4-5` costs about half as much. Only the eval
  harness can show its reviews hold up. Prompt caching stays off: see the
  note in `src/lib/ai/pricing.ts`.
- **Done when.** The live eval passes on the fallback model, and the model
  choice is one constant.

### `og-images`

Generated Open Graph images per page and demo.

`Epic` · P3 · M · Depends on: none

- **Do.** `opengraph-image.tsx` per route with `next/og`.
- **Done when.** Each demo URL unfurls with its own image in a link preview.

### `applet-icons`

Per-applet icons with maskable variants.

`Epic` · P3 · S · Depends on: none

- **Why.** Only Candlelight has its own icons (`public/icons/game/`). The
  other three applets share `web-app-manifest-*.png`, so they look identical
  on a home screen.
- **Done when.** Each applet's `.webmanifest` lists its own 192 px, 512 px
  and maskable icons, and the recipe in [PWA Suite](PWA.md) says how.

### `rss-feed`

RSS or JSON feed for resources.

`Epic` · P3 · S · Depends on: none

- **Done when.** `/feed.xml` validates and lists every published resource.

### `visual-polish`

Nine independent items from the 2026-08-24 screenshot review. Each is one
small PR. Do item 8 after `focus-contrast`, since dimming dates works against
the contrast fix.

`Chore` · P3 · S each · Depends on: see item 8

1. **Visible homepage heading.** An `<h1>` exists but is visually hidden
   (`src/app/page.tsx:82-83`). Promote "Hi, I'm Cooper!" to a visible
   heading separate from the intro.
2. **One accent colour** beyond link blue, so a primary call to action reads
   differently from an inline link.
3. **Row hover state** on Demos and Resources list rows.
4. **One card style.** The homepage quote box is bordered and transparent,
   while the Demos accordions are filled navy rectangles.
5. **Cap the measure** of body copy at about 65 to 75 characters
   (`max-w-prose`).
6. **Show nesting on Demos.** Sub-projects are nested by left padding alone.
   Add a tree line or tint.
7. **Fewer stack icons per row.** Rows with the most icons pack 5 or 6
   badges. Standardize the gap or cap at "+N".
8. **Dim resource dates** and give them a fixed column. After
   `focus-contrast`.
9. **Balance the Resources page.** The 2026-08-24 screenshot showed 3
   entries and a dead zone above the footer. Center the list, add a short
   intro line, or shrink the min-height.

### `seo-site-audit`

Audit what `site:cooperability.com` returns.

`Chore` · P3 · S · **Owner only** (needs Search Console)

- **Done when.** Every indexed URL is a live route on `www`, and stale ones
  are redirected or removed in Search Console.

### `license`

Choose a license.

`Chore` · P3 · S · **Owner only** (a legal choice)

- **Done when.** A `LICENSE` file exists, or the README says the code is
  all rights reserved.

## Parked epics

Not planned. Each lists what would bring it back. Do not start one without
moving it into the ranked list first.

- **RAG or chat over the site's content.** The design was to embed
  `src/resources/**` and the docs at build time and ship a small static
  index, with no vector DB. It is a second paid AI surface, before the first
  is switched on. `llms-full.txt` already serves agents the same
  content. Revisit after `ai-go-live` has run a month inside budget.
- **An MCP server** exposing site tools (opioid conversion, prompt
  composition). [MCP](MCP.md) describes one that
  was never built and now carries a banner saying so. Revisit with a named
  client that would call it.
- **CSP nonces.** Dropping `'unsafe-inline'` forces dynamic rendering on
  every route. Revisit if a script-injection sink ever appears.
- **PWA share targets, deep links, app-store distribution.** No visitor has
  asked. Revisit after `offline-applets`.
- **Vitest.** Coverage thresholds were just set on Jest. Pure churn.
- **commitlint.** The repo squash-merges, so PR titles become the commits,
  and commitlint sees only local commits. If anything, check PR titles in CI.
- **Purge `.yarn/cache` from history with `git filter-repo`.** One-way: it
  rewrites every SHA and breaks every open PR, branch and worktree. CI
  checks out at depth 1 and does not pay for history. GitHub keeps the old
  objects through `refs/pull/*` until Support purges them. The old line said
  the `.git` was 508 MB. The local pack measured 363 MiB on 2026-10-11, of
  which `.yarn/cache` blobs are 175.6 MiB.
  `git clone --filter=blob:none` gives a light clone without a rewrite.
- **HSTS `preload`.** One-way: it ships the domain to browser preload lists,
  which is impractical to reverse. HSTS goes out without it on purpose
  (`next.config.js:37-42`).
- **CODEOWNERS.** On a solo repo it only auto-requests review.
- **Hand registration to Serwist's helper.** `src/app/service-worker.tsx`
  works. No defect to fix.

## Done log

Kept for the reasoning attached, grouped by the category each item had when
it landed.

### Hygiene

- ~~pnpm 11 migration, in full~~ (done: see [PNPM Migration](PNPM-MIGRATION.md))
- ~~Drop the leftover `ls -la && ls -la .yarn` debug prefix from the `build` script~~ (done)
- ~~Fix `engines.yarn: ">=1.22.0"`~~ (done: the field is gone with the pnpm migration)
- ~~Remove `prop-types`~~ (done: Yarn's zero-install cache was already unused, and the pnpm migration deleted the Yarn machinery rather than preserving it)
- ~~Convert the last JS files (`src/components/date.js`, `src/components/providers.js`) to TSX~~ (done: now `src/components/date.tsx` and `src/app/providers.tsx`)
- ~~Serwist precaches `.next`-relative paths rather than the served `/_next/static/…` URLs~~ (done: confirmed every old entry 404'd, and that the manifest also swept in `.next/server` and `.next/cache`, neither of which is reachable over HTTP. Now 42 entries, all verified 200)
- ~~Create `.editorconfig` for consistency~~ (done: root settings agree with Prettier, so `pnpm format` changes nothing because of it)
- ~~Bump `tsconfig` `target` from `es5` to `ES2022`~~ (done: Next's SWC transpilation reads browserslist, not tsconfig `target`, and `lib` was already pinned to `esnext`, so the default-lib jump never applied. One real semantic change rides along: `target: ES2022` flips `useDefineForClassFields` to true, so class fields get `[[Define]]` rather than `[[Set]]` semantics. That matters only when a subclass redeclares a field its base class defines as an accessor. The repo had no classes when this landed. The game has since added nine (`src/components/game/input.ts` `Controls`, `sandbox/world.ts` `World` and seven more), and none uses `extends`, so it stays inert (checked 2026-10-11). Pin it to `false` if a class hierarchy ever lands and the distinction matters)
- ~~OC input fields block numbers but should pop up numpad on mobile~~ (done: added `inputMode="decimal"` and a matching `pattern` to the dose inputs)
- ~~Clean up the root repo with symlinks to subdirectories~~ (superseded by `src-tree-merge`. Symlinks are disabled on the owner's machine)
- ~~Adopt `next/font`~~ (obsolete: the site uses a system font stack, `src/styles/global.css:102-108`, so there is no web font to self-host)
- ~~Point stale agent and docs instructions at the App Router~~ (done 2026-10-11: `frontend-reviewer` in both `.claude/agents/` and `.cursor/agents/` told reviewers the site is Pages Router. The new-applet recipe in [PWA Suite](PWA.md) told agents to create `src/pages/*.tsx` importing `./_app`, which would have added a second router. [Performance](Performance.md), [Tooling](Tooling.md) and the Mandelbrot and Opioid component READMEs cited `src/pages` paths. [MCP](MCP.md) carries an "aspirational" banner. `AGENTS.md` listed seven shared skills under names that no longer exist)

### AI infrastructure

- ~~Wire **Prompt Composer** to a live model~~ (done: Prompt Composer v2's AI review streams a scorecard on the live check's six dimensions, a top fix, one-click suggested components and a one-click rewrite. See [AI Review](AI-Review.md))
- ~~Decide and document an AI usage/privacy stance in `PrivacyStatement.mdx`~~ (done: what is sent, when, to whom, that nothing is stored or logged, and that the review is opt-in per click)
- ~~Rate-limit + abuse-guard any public AI endpoint~~ (done: per-IP token buckets keyed on the IPv6 /64, a worst-case-reserved spend ledger with a 98% cutoff, an off switch that needs no redeploy, a `Sec-Fetch-Site` check, and a 14-item threat model in [AI Review](AI-Review.md#threat-model). The buckets are per instance: see `ai-caller-cap`)
- ~~Add `public/llms.txt` + `llms-full.txt`~~ (done in #299, served from `src/app/llms.txt` and `src/app/llms-full.txt`)
- ~~Add an `/api` LLM route using the Anthropic SDK with streaming responses, and a shared `src/lib/ai/` client module~~ (done: `POST /api/ai/critique` streams from `claude-sonnet-5`, the cheaper of the two models this line listed, with the handler in `src/lib/ai/critique.ts` because Next 16 allows no extra exports from a route file)
- ~~Add server-side prompt-injection hygiene~~ (done: the system prompt is a server-side constant, caller text only enters the user turn fenced in tags with any case or spacing of the fence tag escaped, and the key is read only in `src/lib/ai/client.ts`. The route also requires `application/json`, so a cross-site simple POST cannot spend budget from a visitor's browser. Lookalike tags still pass: see `ai-fence-escape`)
- ~~Add a root `CLAUDE.md` + repo-local skills/agents under `.claude/` / `.cursor/`~~ (done: see `CLAUDE.md`, `AGENTS.md`)

### Framework and architecture

- ~~**Migrate Pages Router → App Router**~~ (done: see [App Router Notes](App-Router.md))
- ~~Replace the hand-rolled `<Head>` in `layout.tsx` with the Metadata API / `generateMetadata`~~ (done: `<html lang="en">` is now real, and every route's tags come from `metadata`/`viewport` exports)
- ~~Add `_document` equivalents / custom `404` + `500` pages and a top-level error boundary~~ (done: `src/app/not-found.tsx`, `error.tsx`, `global-error.tsx`)
- ~~Move the inline `dangerouslySetInnerHTML` service-worker registration out of `_app.tsx`~~ (done: it's now `src/app/service-worker.tsx`, a `useEffect` with no inline script. Handing registration to Serwist's own helper is [parked](#parked-epics))
- ~~Reconsider `next-mdx-remote` vs. compile-time MDX~~ (settled: `/resources/[slug]` uses `next-mdx-remote/rsc`, so no MDX compiler ships to the client. The `@next/mdx` wiring in `next.config.js` turned out to serve no route: see `mdx-cleanup`)

### CI/CD and quality gates

- ~~Stop the security-audit workflow from opening a false-alarm issue on any failed step ([issue #253](https://github.com/cooperability/cooperability.com/issues/253))~~ (done in 142f903, #297. The issue's linked run showed `yarn npm audit --severity critical` crashing with an unhandled `RequestError` on malformed registry JSON, not a real advisory, and `pnpm audit --audit-level critical` found nothing on 2026-09-15. `--ignore-registry-errors` stops a registry crash from reading as a finding, and the issue step runs only on scheduled runs. Issue #253 closed 2026-09-17. The residual, a checkout or setup failure still reaching the issue step, is in `audit-workflow`)
- ~~Pin GitHub Actions to commit SHAs and set explicit least-privilege `permissions:` on each workflow~~ (done: every `uses:` carries a full SHA plus a `# vX.Y.Z` comment Dependabot keeps current, and the existing `permissions:` blocks were reviewed per job and already least-privilege, so they stay as they were. `issues: write` at workflow scope in `security-audit.yml` is the exception: see `audit-workflow`)
- ~~Add `SECURITY.md` and a PR template~~ (done: `SECURITY.md` and `.github/pull_request_template.md`. `CODEOWNERS` is parked and `LICENSE` is the `license` card)
- ~~Test coverage is thin outside the AI route and Prompt Composer. Still to prioritize: `mandelbrot-explorer/utils/calculations.ts`, then set coverage thresholds~~ (done: `calculations.ts` is at 100% from tests derived from the math, and `pnpm test:ci` enforces global and per-file thresholds two points under the 2026-10-02 measurement)
- ~~**`yarn lint` is broken**~~ (fixed: see [Lint Gate](Lint-Gate.md). `pnpm lint` exits 0)
- ~~`next.config.js` sets `eslint.ignoreDuringBuilds: true`~~ (removed: Next 16 dropped the `eslint` key from `next.config.js` entirely, so it was a no-op that only produced a build warning)
- ~~`yarn test` is `jest --watch`, so it's unusable in CI. Add `test:ci`~~ (done: `pnpm test` is `jest --ci --watchAll=false`, `pnpm test:watch` is the watcher, and `pnpm test:ci` collects coverage via `test-exclude@7`)
- ~~Add a real CI workflow (the repo used to ship only the security-audit workflow).~~ (done: `.github/workflows/ci.yml` gates PRs on lint, typecheck, test, build, and a Vercel-shaped install)

### Security and runtime hardening

- ~~Add real security headers via `next.config.js` `headers()`~~ (done: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` and HSTS are enforced on every route)
- ~~Delete or repurpose the placeholder `src/pages/api/hello.ts`~~ (done: deleted, and a replacement would now be an `app/api/*/route.ts` Route Handler)
- ~~Audit committed artifacts: `accessibility-reports/` and `tsconfig.tsbuildinfo` shouldn't be in git~~ (done: both untracked and ignored. `.swc/` is untracked but not ignored: see `swc-gitignore`. `next-env.d.ts` is tracked because `pnpm typecheck` needs its CSS-module and image declarations)
- ~~Decide the canonical host deliberately~~ (decided in practice, Probable: inferred from config and the redirect, not stated by the owner. The host is `https://www.cooperability.com`. `metadataBase` in `src/app/layout.tsx:16` and `next-sitemap.config.js:3` both use it, and the apex answers 308 to `www`, configured in the Vercel dashboard rather than the repo)

### Content and product

- ~~The README's dependency list has drifted (missing Radix, lucide, next-sitemap, serwist…)~~ (done: the README's "Project dependencies" section now lists Radix, lucide-react, next-sitemap, and serwist)
