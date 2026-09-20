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

Report through the repository's **Security** tab, using **Report a vulnerability**. That opens a private advisory visible only to the maintainer.

If that option is not there, private reporting has not been turned on yet. Open a [GitHub issue](https://github.com/cooperability/cooperability.com/issues) saying only that you have a security report and asking for a private channel. Keep the details out of it. A GitHub issue is public the moment you file it, so a description complete enough to act on would disclose the problem to everyone before a fix exists.

This is a single-maintainer personal site. There is no committed response-time window.
