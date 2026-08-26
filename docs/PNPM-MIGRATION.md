# Yarn 4 PnP → pnpm 11

What actually happened, what broke, and why each decision went the way it did.
Written to be read once, end to end, by someone who will maintain this repo.

---

## 1. The one-paragraph version

The repo ran Yarn 4 in **Plug'n'Play** mode with its package cache committed to
git: 1,379 zip archives, 778 MB in the working tree. It now runs **pnpm 11**
with a content-addressable store outside the repo and a single
`pnpm-lock.yaml`. The migration was done in two stages — a pure mechanism swap
that changed _no_ dependency versions, then a separate upgrade pass — so that
if something breaks you can tell which of the two caused it. Along the way the
migration exposed that **lint, the test suite, and coverage were all broken or
never run on `main`**, because the repo had exactly one CI workflow and it only
audited dependencies.

---

## 2. What PnP was doing, and what replaced it

Yarn PnP does not create `node_modules`. It ships a generated `.pnp.cjs` that
patches Node's module resolver, and packages stay as zip files that Yarn reads
through a virtual filesystem.

|                                  | Yarn 4 PnP                           | pnpm 11                                                      |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| On-disk form                     | Zips in `.yarn/cache`, **committed** | One copy per version in a global store, **outside the repo** |
| How Node finds a package         | `.pnp.cjs` patches the resolver      | A real `node_modules` tree                                   |
| Duplicate copies across projects | Per repo                             | Shared store, hardlinked                                     |
| Undeclared ("phantom") imports   | Hard error (`pnpMode: strict`)       | Hard error (`nodeLinker: isolated`)                          |
| Editor/tooling integration       | `.yarn/sdks` shims, `.vscode` paths  | Native — no shims                                            |

The property worth keeping was **strictness**. Under both systems, importing a
package you did not declare in `package.json` fails. That is not the default
elsewhere: npm and pnpm's `hoisted` mode both flatten everything into one
directory, so a typo'd or undeclared import silently resolves to whatever
happens to be there — until the day a transitive dependency drops it.

pnpm's `isolated` linker gives every package a `node_modules` containing only
_its own_ declared dependencies, then symlinks (junctions, on Windows) into a
single real copy in the store. Strictness is preserved, but through a directory
tree that Jest, ESLint, Next and the TypeScript server can all read natively.
That is why the entire `.yarn/sdks` shim layer and its `.vscode/settings.json`
wiring were **deleted rather than ported**.

> **This happened during the migration and is the best demonstration of it.**
> A script here did `require('js-yaml')` to validate the workflow YAML.
> `js-yaml` _is_ in the dependency tree — it is a transitive dependency, and
> there is even an override pinning it. pnpm refused it anyway, because this
> project never declared it. Under npm it would have worked, right up until it
> didn't.

---

## 3. Configuration: three places it can silently not work

pnpm 11 is aggressive about relocating settings, and the failure mode is almost
always **silence** rather than an error. All three of these were hit here.

### 3.1 `.npmrc` is auth/registry only

pnpm 11 reads `.npmrc` for registry URLs and credentials, and **nothing else**.
Every other setting belongs in `pnpm-workspace.yaml`. A `node-linker=isolated`
line in `.npmrc` is not an error and not a warning — it simply does nothing.

This repo has **no `.npmrc`**, deliberately. One file, `pnpm-workspace.yaml`,
holds all configuration.

### 3.2 `package.json`'s `pnpm` field is dead

pnpm 10 read `pnpm.overrides` and `pnpm.onlyBuiltDependencies` from
`package.json`. pnpm 11 does not. It prints one warning and moves on:

```
[WARN] The "pnpm" field in package.json is no longer read by pnpm.
       The following keys were ignored: "pnpm.overrides", ...
```

If you skim install output, you resolve a completely different dependency tree
and never know.

### 3.3 `allowBuilds` replaced `onlyBuiltDependencies` — and the old key is _ignored_

This one is worse, because there is no warning at all. pnpm 11 **removed**
`onlyBuiltDependencies`, `onlyBuiltDependenciesFile`, `neverBuiltDependencies`,
`ignoredBuiltDependencies` and `ignoreDepScripts`. Every pnpm tutorial written
before pnpm 11 tells you to use `onlyBuiltDependencies`. Copy that and your
native binaries silently never build.

```yaml
# pnpm 10 and every guide currently on the internet -- IGNORED by pnpm 11
onlyBuiltDependencies:
  - sharp

# pnpm 11
allowBuilds:
  sharp: true
```

**How to tell you got it right:** run `pnpm install` against a clean
`node_modules`. If you see `[ERR_PNPM_IGNORED_BUILDS]`, the setting is not
being read.

---

## 4. Install scripts: the migration is a security upgrade

The old `.yarnrc.yml` had `enableScripts: true`. Every package in the tree —
all 1,332 of them — could execute arbitrary code at install time, on developer
machines and on every CI runner.

pnpm denies all install scripts by default and takes an explicit allowlist.
Four packages need theirs, each because it compiles or downloads a native
binary:

| Package         | Why                                         | Reach        |
| --------------- | ------------------------------------------- | ------------ |
| `@swc/core`     | Rust binary; the Jest transform             | dev + build  |
| `sharp`         | libvips; Next.js image optimization         | build        |
| `unrs-resolver` | Rust binary behind ESLint's import resolver | dev          |
| `chromedriver`  | Downloads a browser driver over the network | **dev only** |

Everything else in the tree now gets **no install-time code execution**. This
is the single largest supply-chain improvement in the migration and it came for
free with the default.

> **`chromedriver` is the first thing worth deleting.** It arrives via
> `@axe-core/cli`, is used only by `pnpm access`, and fetches a browser driver
> from the internet on every clean install. It is allowlisted purely so this
> migration changed mechanism and not behaviour. If the accessibility audits
> move to a Lighthouse-only flow, drop both the package and this entry.

---

## 5. Overrides: fix the parent, not the child

Yarn's `resolutions` became pnpm's `overrides`. Same semantics, new name — and
the same trap, which this repo walked into twice.

**An override forces a version on a package whose parent was never written
against it.** Semver ranges exist to express compatibility; an override
overrules that claim without checking it.

### The one we inherited

`glob: ^10.5.0` had been carried over from Yarn. `test-exclude@6` — reached
through `babel-plugin-istanbul`, which Jest uses for coverage — does
`util.promisify(glob)`. glob 9 changed the package to export an _object_
instead of a function. So:

```
TypeError: The "original" argument must be of type function.
            Received an instance of Object
```

Coverage could not run at all. It had been latent under Yarn for as long as the
override existed; nobody noticed because **no CI job ever collected coverage**.
Fixed by overriding `test-exclude: ^7.0.2`, which is written against glob 10.

### The one we chose not to repeat

Two advisories against `ip-address`. The obvious move is
`overrides: { ip-address: ^10 }`. The chain is `socks → ip-address`, and
`socks@2.8.5` declares `ip-address: ^9`. Forcing the child would have recreated
the `test-exclude` failure exactly.

`socks@2.8.9` already declares `ip-address: ^10.1.1`. So the override is on the
**parent**:

```yaml
socks: ^2.8.9
```

The fixed child then arrives legitimately, through a range its parent actually
supports.

> **Rule:** when an advisory names package X, look at what pins X to the old
> version and bump _that_. Override X directly only when nothing upstream will
> ever move, and then expect to own the breakage.

---

## 6. What the migration exposed

None of this was caused by the migration. All of it was found by it, because
migrating meant running commands nobody had run in a while.

### `pnpm lint` never linted anything — it crashed

Three faults stacked, each hidden by the one in front:

1. **`--ext` was removed in ESLint 9.** Flat config decides its own file scope.
2. **`FlatCompat` wrapped `next/core-web-vitals`.** `eslint-config-next` 16
   ships a real flat config array, so pushing it through the eslintrc
   translation layer threw `Converting circular structure to JSON`.
3. **`eslint-config-next` was pinned at `^15.4.8` while `next` was 16.x** — a
   full major behind.

### ESLint was downgraded 10 → 9, on purpose

`eslint-plugin-react`'s **latest** release, 7.37.5, declares:

```json
"peerDependencies": { "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7" }
```

There is no ESLint 10 support, and `eslint-config-next` pulls the plugin in
transitively. On ESLint 10 it dies inside `detectReactVersion` calling
`context.getFilename()`, removed in that major.

The repo had upgraded past its own plugin ecosystem. **Revisit when
`eslint-plugin-react` ships an ESLint 10 peer range** — that is the falsifier
for this decision.

### A test asserted copy that had been rewritten

`src/__tests__/pages/index.test.tsx` looked for a nav link named
`/learnings/i`. The page says "knowledge". The copy changed; the test never
did.

### The common cause

**One workflow existed, and it audited dependencies.** No job ran lint, tests,
or a build. Every failure above is a direct consequence. `ci.yml` now runs all
four on every pull request, which is the actual fix.

---

## 7. Real problems found in the application code

Once ESLint ran, `react-hooks/set-state-in-effect` fired six times. Four are a
**known false-positive class** — the SSR hydration mount guard:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => {
  setMounted(true)
}, [])
```

The server cannot know the theme or the viewport, so the first client render
must match the server's output and only then flip. Setting state there is the
point. Each is silenced **at the single call site** with the reasoning inline;
the rule is deliberately _not_ downgraded globally, so a genuine future
violation still fails the build.

**Two are real, and are documented rather than fixed:**

| Where                | What                                                                                                                                                                                   | Why not fixed here                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `PromptComposer.tsx` | `editedPrompt` is derived from `compiledPrompt` but must stay user-overridable. Correct fix: React's documented "adjust state during render" pattern with a previous-value comparison. | Changes **when a user's manual edits get discarded.** That is a product decision, not a lint fix. |

### 7.1 The OpioidConverter one is now fixed, and it turned up more

Fixed in the order the risk demanded: **characterisation tests first, then the
refactor.** The arithmetic moved verbatim into `calculateTotals` in
`utils/calculations.ts`, 22 tests pin it, and the component now computes during
render with `useMemo` instead of syncing state through an effect.

The tests were **mutation-checked** rather than merely passing: flipping the
Methadone branch from squaring to multiplying turns 3 tests red, and deriving
methadone from the rounded rather than the unrounded total turns 4 red. A suite
that has never been seen to fail is not evidence that anything works.

Writing them surfaced three behaviours that are **pinned, not endorsed**. Each
looks like a bug, and none was changed, because whether they are bugs is a
clinical question rather than a technical one:

1. **Methadone is special-cased to `dose` squared** rather than
   `dose * toMorphine`. Methadone's potency genuinely is non-linear in the daily
   dose, so a special case is expected — but this particular curve is
   unverified here.

2. **Methadone's `toMorphine: 0.25` is dead data.** Nothing reads it, because
   the squaring branch never consults it. Anyone editing that number would see
   no effect at all. A test asserts this explicitly, so if someone wires it back
   in, the suite says so loudly.

3. **The two outputs round inconsistently.** `morphineEq` is the rounded total,
   but `methadoneEq` is derived from the _unrounded_ total. At 3 mg of codeine
   the UI displays **0 mg morphine equivalent beside 1 mg methadone
   equivalent** — which is the single clearest argument for having a clinician
   read this file.

Also worth noting: the Methadone branch matches on `display === 'Methadone'`,
an exact string. Any other spelling silently takes the multiply path.

---

## 8. Measured results

All figures from one machine, warm pnpm store, same instrument on both sides.

### Install and build

|                                                | Before             | After      |
| ---------------------------------------------- | ------------------ | ---------- |
| Committed package files                        | 1,379 zips, 778 MB | 0          |
| Cold install (`rm -rf node_modules`)           | —                  | **14.9 s** |
| Full `build` (Next + service worker + sitemap) | —                  | **12.5 s** |
| Known advisories                               | 53                 | **5**      |

The 5 remaining have **no upstream fix**: `postcss` (4) and `sharp` (1) are
both already at the latest published version.

### Turbopack vs webpack — a trade-off, not a win

Next 16 builds with Turbopack by default. Two runs each, `.next` deleted
between runs, times within ±10 ms run to run:

|                    | Turbopack   | webpack (`--webpack`) |
| ------------------ | ----------- | --------------------- |
| Build time         | **11.98 s** | 28.37 s               |
| Client JS, raw     | 895,800 B   | **687,707 B**         |
| Client JS, gzipped | 236,725 B   | **211,547 B**         |
| `.next/cache`      | 414 KB      | 59 MB                 |

**Turbopack builds 2.4× faster and ships ~25 KB more gzipped JavaScript
(+11.9%).** Route structure and static/SSG/dynamic classification are
identical.

This repo keeps **Turbopack** (Next 16's default; the size gap closes release
over release). If a Lighthouse regression ever traces to bundle size,
`next build --webpack` is a one-word revert. Worth noting that the App Router
branch currently pins `--webpack`, and is therefore paying 2.4× on build time
for that 25 KB.

---

## 9. The thing this migration did _not_ fix: repository size

**Removing `.yarn/cache` from `HEAD` does not shrink the clone.** Git keeps
every blob it has ever seen. The repository is still roughly **378 MiB
packed**, and a fresh `git clone` still downloads all of it.

Actually reclaiming it means rewriting history, which is a genuinely
destructive operation with repo-wide consequences. It is written down here and
deliberately **not** performed:

```bash
# 1. Back up first. This rewrites every commit that touched .yarn.
git clone --mirror git@github.com:cooperability/cooperability.com.git backup.git

# 2. git-filter-repo (NOT filter-branch, which is slow and subtly wrong).
pipx install git-filter-repo

# 3. Drop the paths from all of history.
git filter-repo --path .yarn --path .pnp.cjs --path .pnp.loader.mjs --invert-paths

# 4. Inspect before pushing anything.
git count-objects -vH        # expect size-pack to fall from ~378 MiB

# 5. Force-push every ref. Coordinate first -- see blast radius below.
git push --force --all && git push --force --tags
```

**Blast radius, all of which lands at once:**

- **Every commit SHA changes.** Every open PR becomes unmergeable and must be
  rebuilt from a fresh clone. Do this when the PR queue is empty.
- **Everyone with a clone must re-clone.** A `git pull` into an old clone
  reintroduces the old history.
- Links to commit SHAs — in issues, in PR descriptions, in this document —
  break permanently.
- GitHub keeps unreachable objects for a while; the size drop on the remote is
  not instant.

**When it is worth it:** when clone time is genuinely hurting CI or onboarding.
For a portfolio site, "one 378 MiB clone, once" is often the cheaper trade
against a day of coordination. Decide deliberately rather than by default.

---

## 10. Deploying on Vercel: pin the pnpm version

The pnpm version is pinned through the `packageManager` field rather than left
to the host. That is not fussiness — it is a correctness requirement specific
to this setup:

**pnpm 11 reads `overrides` and `allowBuilds` from `pnpm-workspace.yaml`.
Older pnpm silently ignores that file.** A host that quietly picked pnpm 10
would install with _no overrides and no allowed builds_, produce a different
dependency tree, and not fail.

So the version lives in exactly one place — `packageManager` in
`package.json` — and CI (`pnpm/action-setup` with no `version:` key), Vercel,
and every developer machine all read it from there.

Two Vercel-specific constraints cost real debugging time here:

- **`engines.node` must be a major selector**, e.g. `"22.x"`. Vercel parses it
  to choose a runtime and rejects semver ranges such as `">=22.13.0"`.
- **`ENABLE_EXPERIMENTAL_COREPACK=1`** is what lets Vercel honour
  `packageManager` at all.

---

## 11. Command translation

| Yarn 4                               | pnpm 11                             |
| ------------------------------------ | ----------------------------------- |
| `yarn install --immutable`           | `pnpm install --frozen-lockfile`    |
| `yarn add -D x`                      | `pnpm add -D x`                     |
| `yarn dlx x`                         | `pnpm dlx x`                        |
| `yarn why x`                         | `pnpm why x`                        |
| `yarn npm audit --severity critical` | `pnpm audit --audit-level critical` |
| `yarn <script>`                      | `pnpm <script>`                     |
| `yarn node x.js`                     | `pnpm exec node x.js`               |
| _(n/a)_                              | `pnpm peers check`                  |

`pnpm audit` is worth calling out: **pnpm 11 no longer proxies audit through
the npm CLI.** It queries npm's bulk advisories endpoint directly, the flag is
`--audit-level` rather than `--severity`, and advisory filtering moved from CVE
ids to GHSA ids (`auditConfig.ignoreCves` → `ignoreGhsas`).

---

## 12. Follow-up work, in priority order

1. ~~Characterisation tests for `OpioidConverter`, then the `useMemo`
   refactor.~~ **Done** — see §7.1. What remains there is a clinical review of
   three pinned behaviours, not engineering work.
2. **Decide the `PromptComposer` edit-discard semantics,** then apply React's
   adjust-during-render pattern.
3. **tailwindcss 3 → 4** (Dependabot #214). A real migration — new config
   format, rewritten cascade layers — with visual consequences on every page.
   Its own PR, with a human looking at the result.
4. **Close the 20 open Dependabot PRs.** They carry `yarn.lock` diffs and
   cannot rebase onto a tree with no `yarn.lock`. Dependabot reopens them
   against `pnpm-lock.yaml`.
5. **Drop `chromedriver`** if the accessibility flow can run on Lighthouse
   alone (§4).
6. **Raise test coverage.** One test file covers one page. `ci.yml` now
   collects coverage, so the number is at least visible.
7. **Revisit ESLint 10** when `eslint-plugin-react` supports it (§6).
