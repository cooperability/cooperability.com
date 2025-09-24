# [Co-Operability.com](https://www.cooperability.com)

My Next.js portfolio website, running on Vercel. I'm parting with IPFS because it's too expensive to keep a responsive page there.

## TODO:

- OC input fields block numbers but should pop up numpad on mobile
- SEO; site:cooperability.com

## Linting, Formatting, and Testing

- **Automation**: `husky` and `lint-staged` automatically run a pre-commit lint, format, and test of staged files.
- **Available Scripts:**
- `yarn dev`: Runs `next dev`, starting the local server
- `yarn lint`: Runs **ESLint** (See `eslint.config.mjs`), extending `next/core-web-vitals`, checking for Next.js errors and style issues.
- `yarn format`: Runs **Prettier** (See `.prettierrc.json`) to automatically format all project files. Integrated with ESLint via `eslint-config-prettier` to avoid conflicting rules.
- `yarn test`: Runs **Jest** to automatically test; Jest also automatically tests during the pre-commit hook.
- `yarn analyze`: Runs `cross-env ANALYZE=true next build` to build the project and open an interactive bundle analyzer to inspect bundle sizes.
- `yarn run access`: Starts the development server, then runs a series of accessibility checks: ESLint for static analysis, Axe-core for runtime WCAG checks, and Lighthouse for an accessibility audit. Reports are saved to the `./accessibility-reports/` directory. You should review these reports and update the `src/resources/AccessibilityStatement.mdx` file accordingly.

## Privacy Policy, SEO, Analytics

- **Privacy**: Privacy-forward Next Analytics is used instead of Google Analytics for better anonymization.
- **SEO**: Invisible h1 headers

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

#Abandon all hope ye who read below here

## Key Learnings from Recent Development (MDX, Theming, Layouts)

1. **Date Sorting Implementation:**
   -When implementing date-sorting for posts:
   - Direct string comparison with `localeCompare()` is more reliable than creating new Date objects for ISO 8601 formatted dates (YYYY-MM-DD)
   - Complex date parsing can lead to TypeScript construct signature errors and unnecessary type assertions

2. **Using React Components in MDX:**
   - When using `next-mdx-remote` (or similar libraries) to render MDX pages dynamically (e.g., for blog posts under `/resources/[slug].tsx`), components imported _inside_ the `.mdx` file must also be explicitly passed to the `<MDXRemote />` component via its `components` prop in the page rendering file (`[slug].tsx`).

3. **CSS Modules and Theming (`next-themes`):**
   **\* Attempting to define global theme styles using `:root` or attribute selectors like `[data-theme='dark']` directly within a **CSS Module\*\* file (e.g., `utils.module.css`) will cause build errors. CSS Modules expect locally scoped class names or `:global(...)` syntax for non-scoped rules.S
   - For theme switching integrated with `next-themes`, the effective pattern is to define **theme-specific classes** within the CSS Module (e.g., `.dropdownLight`, `.dropdownDark`).
   - React components should then use the `useTheme` hook from `next-themes` to get the current theme (`'light'` or `'dark'`) and conditionally apply the corresponding theme classes alongside base structural classes (e.g., `className={\`\${styles.dropdown} \${isDarkMode ? styles.dropdownDark : styles.dropdownLight}\`}`).

4. **Tailwind CSS and Next.js Integration:**
   - If Tailwind utility classes are present in the rendered HTML (verified via browser inspector) but the corresponding CSS rules are not being applied (styles don't appear in the computed styles), it often indicates an issue with Tailwind's CSS generation process.
   - Ensure the `content` array in `tailwind.config.js` correctly includes paths to all files where Tailwind classes are used (e.g., `./components/**/*.{js,ts,jsx,tsx}`, `./sections/**/*.{js,ts,jsx,tsx}`).
   - Verify that `styles/global.css` (or your main CSS entry point imported in `_app.tsx`) contains the `@tailwind base;`, `@tailwind components;`, and `@tailwind utilities;` directives.
   - Modern Next.js versions (10+) generally handle Tailwind integration seamlessly _without_ requiring a separate `postcss.config.js` file, provided `tailwindcss` and `autoprefixer` are installed. Adding an explicit `postcss.config.js` can conflict with Next.js's built-in PostCSS setup. If encountering issues, try removing `postcss.config.js` and restarting the development server.

5. **Opioid Converter Integration & Mobile Refinement:**
   - Integrated the standalone `OpioidConverter` by creating `/opioid-converter` with a custom `OpioidConverterLayout` (bypassing the default layout via `Page.getLayout` and `_app.tsx` checking `Component.getLayout`; required exporting `NextPageWithLayout`). Refactored the component to use React hooks (`useState`, `useCallback`, `useEffect`) and styled with CSS Modules (using `clamp()` for responsive sizing).
   - Extensive mobile refinement for the data-dense table was required beyond standard responsive techniques, involving adjustments to CSS Grid (`grid-template-columns`), input `min-width`, header text wrapping (`white-space: normal`), and element `gap`.

6. **Case Sensitivity in File Names (Windows vs. Linux Deployment):**
   - **Problem**: Images and assets may work locally on Windows (case-insensitive file system) but fail in production on Vercel/Linux (case-sensitive file system).
   - **Symptoms**: Files load correctly in local development but return 404 errors in production deployment.
   - **Solution**: Use `git mv oldName.png newName.png` to rename files in git to match the exact case used in code references. For example, if code references `linkedin.png` but git tracks `Linkedin.png`, use `git mv public/images/Linkedin.png public/images/linkedin.png`.
   - **Prevention**: Always use consistent lowercase naming for assets, or ensure file names in git exactly match their references in code.

### Advanced Jest Setup and TypeScript Learnings

Setting up Jest with Next.js, TypeScript, and ESLint involved several key insights, particularly for ensuring correct type checking for test utilities and robustly testing dynamic components:

1.  **Jest-DOM Matcher Types (`toBeInTheDocument`, etc.):**
    - While `@testing-library/jest-dom` provides its own types, and `jest.setup.js` (with `import '@testing-library/jest-dom';`) correctly extends Jest's matchers at runtime, TypeScript's static type checking (especially within IDEs and ESLint) can be tricky.
    - **Solution:** The most reliable fix for `Property 'toBeInTheDocument' does not exist...` type errors was to explicitly add `"types": ["jest", "@testing-library/jest-dom"]` to the `compilerOptions` in the **root `tsconfig.json`**. While a `tsconfig.jest.json` can specify these, ensuring they are in the root `tsconfig.json` helps IDEs and ESLint consistently pick them up.
    - Remember to restart your IDE/TypeScript server and sometimes even clear `node_modules` (followed by a reinstall) after significant TypeScript configuration changes if type errors persist unexpectedly.

2.  **Mocking `Math.random` for Component State:**
    - When testing components that use `Math.random()` in their `useState` initializer (e.g., to pick a random initial quote), directly mocking `global.Math.random` needs to be active _before_ the component's first render in a test.
    - **Testing Strategy:** For increased robustness and simpler test logic, instead of asserting exact random outputs, consider a strategy that:
      1.  Captures the initial state's rendered value.
      2.  Simulates an interaction that should change the state.
      3.  Captures the new state's rendered value.
      4.  Asserts that the new value is different from the initial value.
          This tests the change mechanism effectively. A simplified `Math.random` mock (e.g., returning distinct values like 0.1 then 0.8 on subsequent calls) can still be useful to ensure different values are generated by the component.

3.  **ESLint and `jest.config.js`:**
    - The `jest.config.js` file, especially when using `next/jest`, typically uses `require()`. If your ESLint setup (e.g., with `@typescript-eslint`) disallows `require()`, add `// eslint-disable-next-line @typescript-eslint/no-require-imports` above the specific `require()` line in `jest.config.js`.

4.  **Integrating Jest with `lint-staged`:**
    - To run Jest tests on staged files during pre-commit, add the following to your `lint-staged` configuration (e.g., in `package.json`):
      ```json
      "*.{js,jsx,ts,tsx}": [
        // ... other commands like prettier, eslint ...
        "jest --bail --findRelatedTests --passWithNoTests"
      ]
      ```
    - `--bail`: Exits on the first test failure.
    - `--findRelatedTests`: Runs tests related to changed files.
    - `--passWithNoTests`: Prevents an error if no tests are found for the staged files, which is crucial for `lint-staged`.

## Bundle Analysis & Optimization

### How to Interpret Bundle Analyzer Results

Run `yarn analyze` to generate bundle visualization reports in `.next/analyze/`:

- **nodejs.html**: Server-side bundle analysis
- **edge.html**: Edge runtime bundle analysis

#### What to Look For:

**🟢 Good Signs:**

- Balanced rectangle sizes (no single massive dependencies)
- Clear separation between vendor code and application code
- Efficient code splitting across routes

**🟡 Monitor These:**

- **Large Dependencies**:
  - `date-fns`: Ensure tree-shaking with specific imports: `import { format } from 'date-fns'`
  - `@heroicons/react`: Should only include used icons
  - MDX processing libraries: Necessary but watch for bloat

**🔴 Red Flags:**

- Duplicate dependencies across bundles
- Disproportionately large rectangles
- Unused code from large libraries

#### Bundle Optimization Checklist:

- [ ] **Import Optimization**: Use specific imports instead of entire libraries
- [ ] **Dynamic Imports**: Use `React.lazy()` or `next/dynamic` for code splitting
- [ ] **Image Optimization**: Leverage Next.js `Image` component (already using)
- [ ] **Dependency Audit**: Regular review of bundle impact before adding new dependencies
- [ ] **Tree Shaking**: Verify webpack is eliminating unused code

#### Current Bundle Health Status:

- ✅ **Lean Runtime Dependencies**: Well-curated dependency list
- ✅ **Modern Stack**: React 19 + Next.js 15 optimizations
- ✅ **Tree-Shakable Libraries**: Most dependencies support tree-shaking
- ⚠️ **Monitor**: MDX stack and date-fns usage patterns

### Performance Monitoring

Combined with Vercel Analytics and Speed Insights, use bundle analysis to:

1. **Identify bottlenecks** before they impact users
2. **Track bundle size over time** as features are added
3. **Optimize critical paths** for better Core Web Vitals

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
  - 301 redirects implemented in `next.config.js` for old URLs (`/skills` → `/demos`, `/prompts` → `/resources`)
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

## Accessibility Implementation & Testing

### Completed Accessibility Features

- **✅ Semantic HTML5:** Proper structural elements and heading hierarchy
- **✅ Keyboard Navigation:** All interactive elements accessible via keyboard
- **✅ ARIA Attributes:** Enhanced screen reader support for navigation
- **✅ Responsive Design:** Tested across devices and screen sizes
- **✅ Color Contrast:** WCAG AA compliance in light and dark themes
- **✅ Automated Testing Suite:**
  - `eslint-plugin-jsx-a11y`: Static analysis during development
  - `axe-core-cli`: Runtime WCAG testing
  - Lighthouse: Comprehensive accessibility audits
  - Combined in `yarn access` command with reports saved to `./accessibility-reports/`
- **✅ Manual Testing:** Browser dev tools (Axe DevTools) and keyboard navigation testing

### Accessibility Maintenance Tasks

- **[ ] Advanced Testing:** Explore Playwright + Axe-core for CI-integrated theme testing
- **[ ] Button Enhancement:** Ensure all iconic buttons have discernible screen reader text
- **[ ] User Feedback Integration:** Process accessibility feedback for continuous improvement
- **[ ] WCAG Compliance Review:** Regular audits against WCAG 2.1 AA standards

##Known Testing Limitations

- Axe CLI sometimes reports false positives for contrast on dynamically themed content
- Pre-hydration testing doesn't always capture themed states accurately
- Manual browser testing remains the most reliable method for theme-specific accessibility

## PWA & App-like Experience

This project aims to enhance the user experience by transforming the website and its individual applets (e.g., Prompt Composer, Opioid Converter) into installable Progressive Web Apps (PWAs). This provides a more integrated, native-like feel when launched from a user's home screen or desktop.

### Current Progress

- **✅ Iconography:** A comprehensive set of icons has been generated using `realfavicongenerator.net` to ensure proper display across iOS (apple-touch-icon), Android (adaptive icons), and modern browsers.
- **✅ Web App Manifest:** A `site.webmanifest` is linked from `src/components/layout.tsx` and lives at `public/icons/site.webmanifest`.
- **✅ Service Worker (Serwist) & Offline:** Migrated from the deprecated `next-pwa` to community‑maintained **Serwist** (Workbox fork). We use an explicit service worker at `src/sw.js` and inject a precache manifest as a post‑build step via `@serwist/build` (see `scripts/build-sw.mjs`). This approach is robust under Yarn Plug’n’Play (PnP) and avoids plugin resolution pitfalls.
- **✅ Registration:** The SW is registered in `_app.tsx` for production (HTTPS) only.
- **✅ Build Integration:** `package.json` `build` script runs `next build`, then `node scripts/build-sw.mjs`, then `next-sitemap` (which writes sitemap files to `public/`).

### Serwist Migration (from next-pwa)

Rationale: `next-pwa` is deprecated. Serwist is the actively maintained successor to Workbox with feature parity and ongoing updates. We adopted a minimal, predictable setup that works cleanly with Yarn PnP:

- Removed `next-pwa` and its wrappers from `next.config.js`.
- Added `src/sw.js` using Serwist’s API to handle precaching and runtime behavior.
- Injected the precache manifest after the Next build using `@serwist/build` (`scripts/build-sw.mjs`).
- Registered the service worker in `src/pages/_app.tsx` for production only.
- Left icon and manifest handling framework‑agnostic (linked in `layout.tsx`).

References: Serwist docs `https://serwist.pages.dev/`

### How `src/sw.js` and `public/sw.js` relate

- `src/sw.js` is the JavaScript source of your service worker. It’s used at build time by Serwist’s `injectManifest` to analyze and inline the precache manifest and produce the runtime worker.
- `public/sw.js` is the compiled, browser‑consumable service worker that the page actually registers (see `_app.tsx`). Browsers only ever download/execute `sw.js`.
- Edit `src/sw.js` → rebuild → `scripts/build-sw.mjs` regenerates `public/sw.js`. In development, registration is disabled to avoid caching dev assets.

### Per‑route installable experiences (turn a page into its own PWA)

Browsers install URLs, not components. To “install just Prompt Composer,” point a manifest at the Prompt Composer page and load it on that page.

Two practical patterns:

1. Dedicated per‑page manifest (recommended for fully standalone feel)

- Create `public/icons/prompt-composer.webmanifest`:

```json
{
  "name": "Prompt Composer",
  "short_name": "Composer",
  "description": "Research-backed prompt builder",
  "start_url": "/prompt-composer",
  "scope": "/prompt-composer",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

- In `src/pages/prompt-composer.tsx`, add a page‑specific `<link rel="manifest" href="/icons/prompt-composer.webmanifest" />` inside its `<Head>` so that when that URL is opened, the browser associates that manifest with the page.
- Keep the service worker at `/sw.js` (scope `/`) so it can cache all routes; the page‑level manifest only controls install UX (name, icon, start URL, display), not SW scope.

2. One global manifest with shortcuts (good for launchers)

- Add a `shortcuts` array to `public/icons/site.webmanifest` with entries pointing to applet URLs (e.g., `/prompt-composer`). This gives “jump to” actions from the installed app. Example:

```json
{
  "shortcuts": [
    {
      "name": "Prompt Composer",
      "url": "/prompt-composer",
      "icons": [
        {
          "src": "/icons/web-app-manifest-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        }
      ]
    }
  ]
}
```

Notes

- You can use both approaches: global default manifest site‑wide and a per‑page manifest to override on specific routes.
- A component itself (e.g., `PromptComposer.tsx`) isn’t directly installable; its route (`/prompt-composer`) is.

### Lighthouse for per‑page PWAs

- No special configuration changes are needed. Run Lighthouse against the exact URL you want installable (e.g., `http://localhost:3000/prompt-composer`).
- Ensure that page includes the intended `<link rel="manifest" …>` and is controlled by the SW (open DevTools → Application → Service Workers → check “This page is controlled by a service worker”).
- Validate installability, manifest icons, display mode, and offline pass for each applet page you care about.

### Build health & quick optimizations

The sample log shows a healthy build (Next compiled, Serwist injected precache, sitemaps generated). Consider:

- Bundle size: run `yarn analyze` and consider `next/dynamic` for heavy page‑only code (e.g., icon packs, MDX processing) to reduce First Load JS.
- Precache scope: tune `scripts/build-sw.mjs` `globPatterns`/`maximumFileSizeToCacheInBytes` to avoid caching very large assets you don’t need offline.
- Runtime caching: extend `src/sw.js` with image/cache strategies (e.g., Cache‑First for images, Stale‑While‑Revalidate for JS/CSS) for resilience and speed.
- Images: prefer Next Image, modern formats (WebP/AVIF), and proper sizes for applet pages.

### Next Steps & Roadmap

The foundation is now in place. The next phase focuses on enhancing individual applets to behave like true standalone applications.

1.  **Isolate Applet Layouts:**
    - For components like `PromptComposer` and `OpioidConverter`, create dedicated page routes (e.g., `/prompt-composer`, `/opioid-converter`).
    - These pages should use a minimal layout that removes the main site header and footer, creating an immersive, app-like view. Next.js's `getLayout` pattern is ideal for this.

2.  **Deep Linking & Scope Control:**
    - Adjust the `scope` in `site.webmanifest` to be `'/'`. This allows any page to be added to the home screen while retaining the same PWA context.
    - When a user adds a specific applet page (e.g., `cooperability.com/opioid-converter`) to their home screen, the `start_url` in the manifest will open the homepage. To launch the specific applet, we will need to explore solutions like dynamically setting the `start_url` or using a client-side router to redirect based on the launch URL.

3.  **Enhance Offline Functionality:**
    - Extend Serwist runtime caching (in `src/sw.js`) for dynamic data/APIs used by applets so they continue to work offline.
    - Tune strategies (e.g., Stale‑While‑Revalidate, Cache‑First) per route/asset type.

4.  **Refine the "Standalone" Experience:**
    - Ensure that all navigation within an "app" stays within the PWA window. Links to external sites should open in a browser tab.
    - For each applet, review and ensure that its design is fully responsive and feels seamless without the surrounding website chrome.

## Internal Tooling & Architecture Updates (2025-06)

### Tailwind CSS housekeeping

- Added an explicit `/* eslint-disable @typescript-eslint/no-require-imports */` directive at the top of `tailwind.config.js`.
  - Rationale: the config file is intentionally written in CommonJS (`module.exports = …`) per Tailwind's own docs; disabling the rule locally keeps ESLint happy without weakening project-wide TypeScript import safety.
- Removed a redundant `border` + `rounded-full` utility combo that was accidentally bloating the Prompt Composer layout.

### Migrating from _node_modules_ → Yarn Plug'n'Play (PnP)

- The repo is now **zero-install**: dependencies are resolved straight from `.pnp.cjs` instead of a `node_modules` tree.
  - ✅ Smaller checkouts & faster CI.
  - ✅ Deterministic resolution – no phantom packages hiding in sub-folders.
  - ✅ Improved Editor integration via Yarn SDKs.
- **One-time post-clone step for contributors:**  
  `yarn dlx @yarnpkg/sdks vscode` (or `vim`, `intellij`, etc.) – this generates helper wrappers in `.yarn/sdks/` so your IDE's TypeScript server & ESLint can traverse the PnP map.
- The legacy `node_modules` directory is no longer created; remove any editor-level exclusions that targeted it.

### `tsconfig.json → compilerOptions.types` – explicit vs implicit

| Scenario          | What happens when **`types` is _present_**                                                                                                                | What happens when it is **omitted**                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| IDE / tsc startup | Only the packages listed are injected into the global namespace (plus `@types/node` which TS always adds).                                                | **All** `.d.ts` files found under `@types/*` + dependency packages are auto-included. |
| Pros              | ‑ Guarantees deterministic globals.<br>- Prevents polluting the IntelliSense autocomplete with irrelevant libraries.                                      | ‑ Zero maintenance – add a library and its types "just work".                         |
| Cons              | You must remember to list _every_ global type you rely on (React, Jest, Next, etc.) or you'll see "JSX.IntrinsicElements missing" / "Cannot find name X". | Potential for hidden conflicts if two libraries declare the same global symbol.       |

**Project decision:** we keep an _explicit_ list so that test-only helpers (e.g. `jest-dom`) don't leak into production builds, while adding the _required_ runtime globals:

```jsonc
"types": [
  "react", "react-dom", "next",
  "jest", "@testing-library/jest-dom",
  "node"
]
```

If you prefer the implicit behaviour, simply delete the field – Typescript will fall back gracefully. **Never** leave the field half-populated (e.g. only Jest) or JSX support vanishes.

### shadcn/ui adoption

- Added `@/components/ui/*` generated via [`shadcn/ui`](https://ui.shadcn.com).
  - Components are tailwind-powered and live inside `components/ui/`.
  - Style tokens were merged into `tailwind.config.js` under the `extend.colors` section – no runtime CSS needed.
- If you scaffold new components, run `npx shadcn-ui@latest add <component>` and commit the generated files.

### New JSON artefacts & Git hygiene

| Path                              | Generated by   | Purpose                                                                            | **Commit?**                                      |
| --------------------------------- | -------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| `.yarn/sdks/**`                   | `yarn sdks`    | Editor wrappers that load the PnP runtime before launching TS / ESLint / Prettier. | **Yes** – required for other contributors' IDEs. |
| `.next/analyze/*.json` & `*.html` | `yarn analyze` | Bundle-size snapshots. Safe to commit if you want the history, otherwise ignore.   | _Optional_ (currently **gitignored**).           |
| `.pnp.cjs` & `.pnp.loader.mjs`    | Yarn           | PnP mapping & loader – **part of the lockfile**.                                   | **Yes** (already tracked via git).               |

> **Advisory:** Always re-run `yarn install` after upgrading Yarn (it may regenerate `.pnp.cjs`). Commit the diff, then verify editors still resolve packages. For CI, no extra cache key is needed – Yarn's cache key already respects the lockfile hash.

### Quick Yarn upgrade (Corepack)

To upgrade Yarn in this repo non-interactively and avoid Corepack prompts:

```bash
yarn set version 4.10.3
corepack prepare yarn@4.10.3 --activate
yarn install && yarn dedupe --strategy=highest
```

PnP tip: if `recma-jsx` complains about a missing `acorn` peer under PnP, add this to `.yarnrc.yml`:

```yaml
packageExtensions:
  recma-jsx@*:
    dependencies:
      acorn: '*'
```

### Yarn PnP Future-Proofing & Maintenance Guide (June 2025)

This section documents the process undertaken to upgrade the project's dependencies, resolve security vulnerabilities, and troubleshoot a series of complex local and Vercel deployment issues related to Yarn PnP.

#### 1. Initial Successes

The initial phase of the work was successful:

- **Dependencies Updated:** All project dependencies were updated to their latest versions using `yarn up`.
- **Vulnerabilities Resolved:** All Dependabot security alerts were resolved, confirmed by a clean `yarn npm audit`.
- **`.gitignore` Optimized:** The `.gitignore` file was updated to correctly handle Yarn PnP's zero-install cache and to use glob patterns to ignore large SWC binaries.
- **Tests Passed:** The Jest test suite was updated to reflect changes in the application's content, and all tests passed locally.
- **Project Upgraded to Node.js 22:** The project was consistently updated across `package.json`, `.nvmrc`, and `vercel.json` to use the Node.js 22 runtime, aligning local and deployment environments.

---

#### 2. Vercel Deployment Troubleshooting Log

Despite a healthy local state, the branch failed to deploy on Vercel, leading to an extensive troubleshooting process.

- **Initial Failure:** The first Vercel builds failed with the error `Error: Cannot find module './.pnp.cjs'`. This occurred even though the `.pnp.cjs` file was confirmed to be present in the Git commit.

- **Investigation & Theories:**
  - **Vercel Cache:** Redeploying without the build cache did not resolve the issue.
  - **`.gitignore` Conflict:** An outdated `/.pnp` rule in `.gitignore` was suspected of causing Vercel to prune the `.pnp.cjs` file. Removing this rule did not solve the problem.
  - **Yarn Version Mismatch:** A key discovery was made when a build failed with `Unrecognized or legacy configuration settings found: pnpPath`. This error is specific to **Yarn v1 (Classic)**, proving that Vercel was using the wrong Yarn version, despite the `packageManager` field in `package.json`.

- **Attempted Fixes:**
  - **Forcing Corepack:** The `installCommand` in `vercel.json` was updated to `corepack enable && yarn install --immutable`. This successfully forced Vercel to use the correct Yarn v4 binary, but the build _still_ failed with `Cannot find module './.pnp.cjs'`.
  - **Diagnostic Commands:** Diagnostic commands (`ls -la` and `ls -la .yarn`) were added to the `build` script. The logs from these commands confirmed that the `.pnp.cjs` file was inexplicably missing from the Vercel build container's filesystem at runtime, suggesting a deep, unresolved issue with Vercel's build environment for Yarn PnP projects.

---

#### 3. Local Environment Troubleshooting Log

After upgrading to Node.js 22, the local environment began to mirror the CI failures.

- **Symptom:** Running `yarn dev` failed with the `Unrecognized or legacy configuration...` error, indicating the local machine was also using Yarn v1.
- **Fix:** Running `corepack enable` (with administrator privileges) was required to configure Corepack for the new Node.js v22 installation.
- **Final Local Error:** After enabling Corepack, running `corepack yarn dev` resulted in a new error: `Qualified path resolution failed`. This error originates from within Yarn's PnP resolver and indicates that even when the correct Yarn version is running, it cannot locate the `next` executable.

---

#### 4. Resolution & Current Status

The project is now fully functional, both locally and on Vercel. The critical issues were resolved by systematically working through the potential next steps outlined previously.

- **Build Scripts Simplified:** The `node -r ./.pnp.cjs` prefix was removed from the `dev`, `build`, and `start` scripts in `package.json`. This resolved the `Qualified path resolution failed` error by allowing Corepack to manage the PnP environment without conflict.

- **Vercel Configuration Fixed:**
  - The simplified build scripts allowed the Vercel deployment to proceed past the initial PnP resolution error.
  - A subsequent Vercel schema validation error (`should NOT have additional property 'engines'`) was fixed by removing the redundant `engines` block from `vercel.json`, as Vercel now infers this from `package.json`.

- **Security Vulnerabilities Patched:** Persistent Dependabot alerts were fully resolved:
  - The critical `form-data` vulnerability was patched by adding `"form-data": "4.0.4"` to the `resolutions` field in `package.json`.
  - The low-severity `tmp` vulnerability was patched by adding `"tmp": "0.2.4"` to the `resolutions` field.
  - All high and low-severity `Next.js` vulnerabilities were confirmed to be false positives, as the project's updated Next.js version (`15.4.1`) already contained the necessary patches.

The project is now stable, secure, and successfully deployed on Vercel with the latest dependencies and Node.js 22.
