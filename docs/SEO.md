- **SEO**: Invisible h1 headers

## SEO Strategy & Implementation

### Completed SEO Tasks

- **✅ Google Search Console (GSC) Integration:** Monitoring search performance and indexing
- **✅ Meta Descriptions:** Compelling descriptions for search results
- **✅ Header Tags:** Hierarchical structure with accessible H1 tags
- **✅ Image Alt Text:** Descriptive text for accessibility and SEO
- **✅ Technical SEO:**
  - HTTPS security (standard with Vercel)
  - Mobile-responsive design
  - Site speed optimization (monitored via Vercel Speed Insights)
  - 301 redirects implemented in `next.config.js` for old URLs (`/skills` → `/demos`, `/prompts` → `/stash`, and `/resources` and `/resources/*` → `/stash` and `/stash/*` since the section was renamed on 2026-10-13)
- **✅ Internal Linking:** Strategic cross-page linking for navigation and SEO
- **✅ Sitemap Submission:** Up-to-date XML sitemap submitted to GSC

### SEO Maintenance Tasks

- **[ ] Content Strategy:** Continue incorporating "Cooper Reed" and "cooperability.com" naturally in content
- **[ ] Regular GSC Audits:** Monitor for indexing issues and optimization opportunities
- **[ ] Content Freshness:** Keep content updated and relevant

### Quick Guide: Google Search Console Setup

1. **Access GSC:** [Google Search Console](https://search.google.com/search-console)
2. **Add Property:** Select "Domain" property type, enter `cooperability.com`
3. **DNS Verification:** Add TXT record from GSC to domain registrar DNS settings
4. **Submit Sitemap:** Add `sitemap.xml` in GSC Sitemaps section
5. **Monitor:** Review performance and indexing status regularly

### Addressing Search Result Issues

Historical "Untitled" listings and old paths (`/skills`, `/prompts`) have been resolved with:

- Proper `<title>` tags on all pages
- 301 redirects in `next.config.js`
- Updated sitemap submission
- GSC monitoring for re-indexing progress

### Indexing Issue Log

#### `/my-new-applet` reported as Not found (404), 2026-10-26

GSC emailed a new "Not found (404)" reason on 2026-10-26. The report named one
URL, `https://cooperability.com/my-new-applet`, last crawled 2026-10-23.

- **Cause (Probable):** the site never had that page. The slug was a
  placeholder in the applet tutorial in [PWA.md](PWA.md), which included the
  literal URL `https://cooperability.com/my-new-applet` in a test step. The
  public GitHub repo is the only place that string appeared. Git history shows
  it only in `docs/`, never in `src/` or `public/`, and no live page contained
  it. GSC does not say where it found the URL.
- **Fix:** the tutorial now uses `<applet-slug>`, which is not a valid URL
  path, and points its paths at `/demos/<applet-slug>` to match the real applet
  manifests.
- **In GSC:** leave the entry alone. A URL that never had a page should return
  a 404. Do not click Validate Fix: Google would get a 404 again and mark the
  validation failed. The entry drops out of the report on its own.

The same check on 2026-10-28 found all 13 sitemap URLs returning 200, and no
broken link among the 89 internal links on those pages.

## TODO

Quick wins from an audit of the live site on 2026-11-16. Each item names what
was measured.

- **[ ] Canonical tags on every page.** Only `/` has one (`alternates.canonical`
  in `src/app/page.tsx`). The other 12 sitemap pages have none. Give each route
  its own `alternates: { canonical: '/demos' }`, and build `/stash/${slug}` in
  `generateMetadata` in `src/app/stash/[slug]/page.tsx`. Never set a canonical
  in the root layout: every page that does not set its own inherits it, and
  would point Google at the wrong URL.
- **[ ] Meta descriptions on 4 stash pages.** `linktree`, `LLMPrompts`,
  `OnlineTools` and `PriorInventions` ship no `<meta name="description">`, so
  Google writes its own snippet. Add a `description:` line to each file's
  frontmatter. `src/app/stash/[slug]/page.tsx` already reads it.
- **[ ] Share image on every page.** Only `/` sets `og:image`. The other 12
  pages share as text-only cards. Each page's `openGraph` replaces the
  layout's (metadata does not deep-merge, see [App-Router.md](App-Router.md)),
  so either add `images` to each, or try a file-based `src/app/opengraph-image`.
  Unverified: whether the file-based image survives a page that sets its own
  `openGraph`. Check the rendered `<head>` before relying on it.
- **[ ] A heading and intro in the demo pages' server HTML.** Candlelight,
  Mandelbrot Explorer, Opioid Converter and Prompt Composer load their whole UI
  through `dynamic(..., { ssr: false })`, so the HTML Google first fetches has
  no `<h1>` and almost no text. Google renders JavaScript later. Unverified:
  whether the thin server HTML feeds the "not indexed" counts below. Render the `<h1>`
  and one paragraph in each `page.tsx`, outside the client component.
  Candlelight has no `<h1>` even after rendering: none exists under
  `src/components/game` or its route.
- **[ ] Truthful sitemap dates.** `next-sitemap` stamps all 13 URLs with the
  build time as `lastmod`, plus `changefreq: daily` and `priority: 0.7`.
  Google ignores `changefreq` and `priority`, and trusts `lastmod` only when it
  matches real changes ([Google's sitemap guide](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)).
  Set `autoLastmod: false` in `next-sitemap.config.js`, or use a `transform`
  that reads the stash `date` frontmatter.
- **[ ] Brand suffix on the Opioid Converter title.** It reads "Opioid
  Converter Tool". Every other page title carries "Cooper Reed".
- **[ ] Name the 9 pages Google skipped.** The 2026-10-22 GSC export lists 7
  "Discovered, currently not indexed" and 2 "Crawled, currently not indexed",
  the largest group of the 24 pages Google knows. The export gives counts only.
  Open each row in GSC to get its URLs, then check them against the items above.
