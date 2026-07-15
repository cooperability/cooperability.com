# Quality / gate CLI commands

| Catalog | Contents |
|---------|----------|
| [../test/COMMANDS.md](../test/COMMANDS.md) | Jest |
| [../accessibility/COMMANDS.md](../accessibility/COMMANDS.md) | ARIA lint, axe-core, Lighthouse |

## Fast local gates

```bash
yarn lint                 # ESLint (js/ts/tsx/mdx) incl. jsx-a11y / ARIA
yarn lint:mdx             # MDX only
yarn typecheck            # TypeScript --noEmit
yarn format               # Prettier write (ask before large rewrites)
yarn format:mdx           # MDX prettier
```

## Automated tests (summary)

```bash
# Jest (non-interactive)
yarn jest --ci --watchAll=false

# Full a11y suite: lint + axe (WCAG2 AA) + Lighthouse a11y on /, /demos, /resources
yarn access
```

## Security

```bash
yarn audit                # yarn npm audit
yarn audit:critical       # fail on critical
yarn audit:fix           # attempt automatic fixes (ask first)
```

## Build / bundle

```bash
yarn build                # next build + SW + sitemap (heavy)
yarn analyze              # ANALYZE=true next build
```

## Suggested agent sequences

```bash
# After a code change (unit + static)
yarn lint && yarn typecheck && yarn jest --ci --watchAll=false

# Before merge (hooks spirit)
yarn audit:critical && yarn lint && yarn typecheck && yarn jest --ci --watchAll=false

# When user asks for accessibility / Lighthouse / ARIA runtime checks
yarn access
```

## Discover in any local project

Map `lint`, `typecheck`/`tsc`, `test`, `access`/`a11y`, `build`, `audit` from package scripts and CI.
