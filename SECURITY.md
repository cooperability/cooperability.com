# Security Policy

## Supported versions

This repository ships one deployed target: [www.cooperability.com](https://www.cooperability.com), built from the `main` branch. There are no maintained older versions or release branches. A fix lands as a PR against `main` and reaches production on merge.

## Scope

In scope:

- The deployed site itself (pages, layouts, components)
- API routes under `src/app/api`
- The service worker (`src/app/service-worker.tsx` and its build output)
- HTTP response headers (CSP, security headers, caching)

Out of scope:

- Third-party services the site depends on (Vercel, GitHub, npm registry, analytics). Report those to the provider directly.

## Reporting a vulnerability

GitHub private vulnerability reporting is not yet enabled on this repository. Once it is, report through the repo's **Security** tab using **Report a vulnerability**, which opens a private advisory visible only to the maintainer.

Until then, open a regular [GitHub issue](https://github.com/cooperability/cooperability.com/issues) describing the problem, minus any exploit detail that would put site visitors at risk before a fix ships.

This is a single-maintainer personal site. There is no committed response-time window.
