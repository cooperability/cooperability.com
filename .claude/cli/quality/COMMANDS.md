# Quality / gate CLI commands

| Catalog | Contents |
|---------|----------|
| [../test/COMMANDS.md](../test/COMMANDS.md) | Jest |
| [../accessibility/COMMANDS.md](../accessibility/COMMANDS.md) | ARIA lint, axe-core, Lighthouse |

## Fast local gates

```bash
pnpm lint                 # ESLint (js/ts/tsx/mdx) incl. jsx-a11y / ARIA
pnpm lint:mdx             # MDX only
pnpm typecheck            # TypeScript --noEmit
pnpm format               # Prettier write (ask before large rewrites)
pnpm format:mdx           # MDX prettier
```

## Automated tests (summary)

```bash
# Jest (non-interactive)
pnpm test

# Full a11y suite: lint + axe (WCAG2 AA) + Lighthouse a11y on /, /demos, /resources
pnpm access
```

## Security

```bash
pnpm audit                # pnpm audit
pnpm audit:critical       # fail on critical
pnpm audit:fix           # attempt automatic fixes (ask first)
```

## Build / bundle

```bash
pnpm build                # next build + SW + sitemap (heavy)
pnpm analyze              # ANALYZE=true next build
```

## Suggested agent sequences

```bash
# After a code change (unit + static)
pnpm lint && pnpm typecheck && pnpm test

# Before merge (hooks spirit)
pnpm audit:critical && pnpm lint && pnpm typecheck && pnpm test

# When user asks for accessibility / Lighthouse / ARIA runtime checks
pnpm access
```

## Discover in any local project

Map `lint`, `typecheck`/`tsc`, `test`, `access`/`a11y`, `build`, `audit` from package scripts and CI.
