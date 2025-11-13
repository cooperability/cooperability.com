# [Co-Operability.com](https://www.cooperability.com)

My Next.js portfolio website on Vercel. Several smaller projects within.

## TODO:

- OC input fields block numbers but should pop up numpad on mobile
- SEO; site:cooperability.com
- Create `.editorconfig` for consistency
- Add `.npmrc` for Yarn users

## Developer Tooling

This project uses a comprehensive suite of quality control tools. For complete documentation, see **[docs/Tooling.md](docs/Tooling.md)**.

**Quick Reference:**

- `yarn dev` - Start development server
- `yarn lint` / `yarn lint:mdx` - ESLint checking (includes MDX validation)
- `yarn format` / `yarn format:mdx` - Prettier formatting
- `yarn test` - Jest + React Testing Library
- `yarn typecheck` - TypeScript validation
- `yarn analyze` - Webpack bundle analysis
- `yarn access` - Accessibility audits (ESLint + Axe-core + Lighthouse)

**Key Technologies:**

- **Linting:** ESLint with TypeScript, Next.js, and MDX support
- **Formatting:** Prettier with automatic MDX prose wrapping
- **Testing:** Jest with @testing-library/react and jest-dom matchers
- **Automation:** Husky + lint-staged for pre-commit quality checks
- **Package Management:** Yarn Plug'n'Play (PnP) for zero-install, deterministic dependencies
- **UI Components:** shadcn/ui (Tailwind + Radix UI primitives)
- **Bundle Analysis:** Webpack Bundle Analyzer for optimization
- **Accessibility:** Automated testing with axe-core CLI and Lighthouse
- **Icons:** skillicons.dev (theme-aware tech stack icons via simple-icons.org)

See **[docs/Tooling.md](docs/Tooling.md)** for setup instructions, troubleshooting, and best practices.

## Responsive Design & Breakpoints

This project uses a **content-first responsive design strategy** with clearly defined breakpoints:

- **Primary breakpoint:** 525px (`useResponsive` hook) for site-wide mobile/desktop splits
- **Component-specific breakpoints:** Used when components have unique layout requirements (e.g., 375px for Mandelbrot Explorer)

**Philosophy:** Break where content naturally requires it, not at arbitrary device widths.

See **[docs/ResponsiveDesign.md](docs/ResponsiveDesign.md)** for complete breakpoint strategy, implementation guidelines, and best practices.

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

7. **Unified Link Components and External Navigation Patterns:**
   - When refactoring navigation components for visual consistency (adding inverse-color active states and hover animations to the mobile Sidebar), a seemingly simple task—converting the Resume external link to use the new `SidebarLink` component—revealed an important architectural decision point. The component needed substantial enhancement to support both internal navigation (using Next.js `Link` for client-side routing and prefetching) and external links (using standard `<a>` tags with security attributes like `rel="noopener noreferrer"`). This is architecturally significant because it establishes a **single source of truth** for all navigation styling and behavior while respecting the fundamental distinction between internal and external navigation. Mixing these concerns carelessly can lead to SEO penalties (external links without proper `rel` attributes), broken prefetching (Next.js Link wrapping external URLs), or inconsistent UX (some links behaving differently despite appearing identical). The solution—a conditional render based on an `external` prop—ensures that every link in the sidebar receives identical visual treatment (inverse backgrounds, vertical sliding selectors, theme-aware colors) while maintaining semantic correctness and framework-specific optimizations. This pattern is now reusable across the application wherever unified link presentation is needed, demonstrating how **design system consistency requirements can drive meaningful architectural improvements** rather than superficial styling changes.

## Accessibility

This project follows WCAG 2.1 AA standards with automated testing via ESLint, Axe-core, and Lighthouse.

**Run audits:** `yarn access` (saves reports to `./accessibility-reports/`)

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

## Package Management (Yarn PnP)

This project uses **Yarn Plug'n'Play (PnP)** for zero-install, deterministic dependency resolution.

**Benefits:**

- ✅ Faster CI (smaller checkouts)
- ✅ Deterministic resolution (no phantom packages)
- ✅ Better editor integration via Yarn SDKs

**One-time setup after cloning:**

```bash
yarn dlx @yarnpkg/sdks vscode  # or vim, intellij, etc.
```

**Important Files:**

- `.pnp.cjs` - PnP manifest (commit to git)
- `.yarn/sdks/**` - Editor wrappers (commit to git)
- `.yarnrc.yml` - Yarn configuration

**Upgrading Yarn:**

```bash
yarn set version 4.10.3
corepack prepare yarn@4.10.3 --activate
yarn install && yarn dedupe --strategy=highest
```

See **[docs/Tooling.md#yarn-plugnplay-pnp](docs/Tooling.md#yarn-plugnplay-pnp)** for troubleshooting and Vercel deployment details.
