# Performance & Responsive Design Guide

## Table of Contents

- [Overview](#overview)
- [Dynamic Imports & Code Splitting](#dynamic-imports--code-splitting)
- [Cumulative Layout Shift (CLS) Reduction](#cumulative-layout-shift-cls-reduction)
- [Fluid Spacing with CSS clamp()](#fluid-spacing-with-css-clamp)
- [Responsive Design Strategy](#responsive-design-strategy)
- [Breakpoint Implementation](#breakpoint-implementation)
- [Responsive Best Practices](#responsive-best-practices)
- [Tailwind Configuration](#tailwind-configuration)
- [Measurement & Monitoring](#measurement--monitoring)
- [Testing Checklist](#testing-checklist)

---

## Overview

This document is the **source of truth** for performance optimization and responsive design across the Co-Operability.com project. It covers bundle optimization, layout stability, and breakpoint strategy.

**Key Metrics Targeted:**

- **FCP (First Contentful Paint)**: Time to first visible content
- **LCP (Largest Contentful Paint)**: Time to largest content element
- **CLS (Cumulative Layout Shift)**: Visual stability during load
- **INP (Interaction to Next Paint)**: Input responsiveness

**Key Principle:** Breakpoints should be chosen based on **content requirements**, not device categories. Design should adapt where the layout naturally breaks.

---

## Dynamic Imports & Code Splitting

### What It Is

Dynamic imports allow components to load on-demand rather than being included in the initial JavaScript bundle. Combined with disabled SSR, this is particularly effective for:

- Complex interactive components
- Canvas-based visualizations
- Components with heavy dependencies

### Implementation Pattern

**Reference Implementation:** `src/app/demos/prompt-composer/prompt-composer-client.tsx`

```tsx
import dynamic from 'next/dynamic'

const PromptComposer = dynamic(
  () => import('@/src/components/prompt-composer/PromptComposer'),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false, // Client-only to reduce server bundle
  }
)
```

### When to Disable SSR

Disable SSR (`ssr: false`) when:

1. **Component requires browser APIs** (Canvas, WebGL, localStorage)
2. **Heavy client-side computation** (fractal rendering, complex calculations)
3. **Large dependency trees** (charting libraries, rich text editors)
4. **No SEO benefit** from server-rendered content

### Project Examples

| Component          | Bundle Reduction | Rationale                             |
| ------------------ | ---------------- | ------------------------------------- |
| PromptComposer     | ~40KB            | Complex UI with shadcn/ui components  |
| OpioidConverter    | ~15KB            | Medical calculator, client-only       |
| MandelbrotExplorer | ~30KB            | Canvas API, computationally intensive |

**See:**

- `src/app/demos/prompt-composer/prompt-composer-client.tsx`
- `src/app/demos/opioid-converter/opioid-converter-client.tsx`
- `src/app/demos/mandelbrot-explorer/mandelbrot-explorer-client.tsx`

---

## Cumulative Layout Shift (CLS) Reduction

### What It Is

CLS measures visual stability—how much content shifts during page load. Poor CLS creates a jarring user experience and hurts Core Web Vitals scores.

### Loading Skeleton Pattern

Loading skeletons reserve space for dynamically loaded components, preventing layout shift when they render.

**Reference Implementation:** `src/app/demos/prompt-composer/prompt-composer-client.tsx:11-22`

```tsx
loading: () => (
  <div className="container mx-auto p-4 animate-pulse">
    <div className="text-center mb-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto" />
    </div>
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="flex-1 h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  </div>
)
```

### CLS Best Practices

**✅ DO:**

1. **Match skeleton dimensions** to actual component layout
2. **Use `animate-pulse`** for visual feedback during load
3. **Include responsive classes** (`lg:flex-row`) in skeletons
4. **Reserve space for images** with explicit dimensions
5. **Use theme-aware colors** (`dark:bg-gray-700`)

**❌ DON'T:**

1. Show empty containers that suddenly fill with content
2. Load fonts that change text dimensions
3. Inject ads or dynamic content without reserved space
4. Use spinners without reserving layout space

### Pick Layouts in CSS, Not JavaScript

The server has no viewport. A layout chosen from `window.innerWidth` has to
guess one for the server render, and every visitor whose screen disagrees
watches the layout swap once JavaScript loads. `/stash` did this on every
phone until the `useResponsive` hook was removed. Use breakpoint classes
instead, so one markup serves the server render and every viewport.

---

## Fluid Spacing with CSS clamp()

### What It Is

`clamp()` creates fluid values that scale smoothly between minimum and maximum bounds based on viewport width, eliminating the need for multiple breakpoint-specific values.

### Implementation

**Reference Implementation:** `src/styles/global.css:129`

```css
:root {
  --spacing-container: clamp(0.5rem, 2vw, 2rem);
}
```

### How clamp() Works

```
clamp(MIN, PREFERRED, MAX)
```

| Parameter | Value    | Meaning                |
| --------- | -------- | ---------------------- |
| MIN       | `0.5rem` | Never smaller than 8px |
| PREFERRED | `2vw`    | 2% of viewport width   |
| MAX       | `2rem`   | Never larger than 32px |

**Behavior:**

- At 320px viewport: `2vw = 6.4px` → uses MIN (8px)
- At 800px viewport: `2vw = 16px` → uses PREFERRED (16px)
- At 1600px+ viewport: `2vw = 32px+` → uses MAX (32px)

### Use Cases

```css
/* Fluid container padding */
.container {
  padding: var(--spacing-container);
}

/* Fluid typography */
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}

/* Fluid gaps */
.grid {
  gap: clamp(1rem, 3vw, 2rem);
}
```

### Benefits Over Breakpoints

| Approach    | Code             | Result            |
| ----------- | ---------------- | ----------------- |
| Breakpoints | 5+ media queries | Jumpy transitions |
| clamp()     | 1 line           | Smooth scaling    |

---

## Responsive Design Strategy

### Industry Standards

#### Framework Breakpoints (2024-2025)

| Framework       | xs     | sm     | md     | lg     | xl      | 2xl     |
| --------------- | ------ | ------ | ------ | ------ | ------- | ------- |
| **Tailwind**    | -      | 640px  | 768px  | 1024px | 1280px  | 1536px  |
| **Bootstrap 5** | <576px | ≥576px | ≥768px | ≥992px | ≥1200px | ≥1400px |

#### Modern Device Widths

| Category        | Width Range | Examples                   |
| --------------- | ----------- | -------------------------- |
| Small phones    | 320-375px   | iPhone SE, older Android   |
| Standard phones | 375-414px   | iPhone 12-15, most Android |
| Large phones    | 414-480px   | iPhone Pro Max, phablets   |
| Small tablets   | 600-768px   | iPad Mini                  |
| Tablets         | 768-1024px  | iPad, Android tablets      |
| Desktops        | 1024px+     | Laptops and desktops       |

### Our Breakpoint Strategy

#### Why 526px for the Stash list?

The list in `src/app/stash/stash-list.tsx` stacks each title above its date
at 525px and below, and puts them on one row from `min-[526px]:`.

- Sits between phone (<480px) and small tablet (600px+)
- Captures most smartphones in portrait mode
- Provides breathing room above standard phone widths

#### CSS Custom Properties

**Implementation:** `src/styles/global.css`

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  --spacing-container: clamp(0.5rem, 2vw, 2rem);
}
```

---

## Breakpoint Implementation

### Decision Tree

```
Does this need a mobile/desktop split?
    │
    ├─ YES → Does the component have CSS media queries?
    │         │
    │         ├─ YES → Match that breakpoint
    │         │
    │         └─ NO → Use Tailwind responsive classes
    │
    └─ NO → Use Tailwind responsive classes directly
```

### When to Use Each Approach

| Approach              | When to Use              | Example                |
| --------------------- | ------------------------ | ---------------------- |
| **Tailwind classes**  | Layout-only changes      | `flex-col md:flex-row` |
| **Custom breakpoint** | Component-specific needs | Matches existing CSS   |

### Codebase Examples

#### Example 1: Footer Layout

**File:** `src/sections/Footer.tsx`

Uses Tailwind only. Desktop and mobile show the same six icons, so one
`flex-wrap justify-between` row serves both and no hook is needed.

#### Example 2: Header Navigation

**File:** `src/sections/Header.tsx`

Uses Tailwind and CSS only. Every width gets the same three icon links, and the
selector decides what to draw from its own width with container queries, not
from the viewport. Wide enough for every name, all three show. Wide enough for
one, only the current page keeps its name and the others show their icon, with
the name left in the link as `sr-only` text. Narrower than that, icons alone.

The logo, selector and theme switch share one height, `--hdr-h`, defined on the
`.Header` rule in `utils.module.css`. It grows with the viewport from 36px to
45px, and so does the gap between them, so on the narrowest phone they sit a
few pixels apart and on a wide one they get room. One markup serves the server
render and every viewport, so nothing swaps after hydration.

#### Example 3: Pure Tailwind Approach

When no JavaScript logic is needed, use Tailwind directly:

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-1/4">Sidebar</aside>
  <main className="w-full md:w-3/4">Content</main>
</div>
```

#### Example 4: Component-Specific Breakpoint

**File:** `src/components/mandelbrot-explorer/MandelbrotExplorer.module.css`

Uses 375px breakpoint for iteration controls—matches the smallest modern phones where UI needs vertical stacking.

---

## Responsive Best Practices

### ✅ DO

1. **Start with Tailwind classes** for layout-only responsive changes
2. **Document custom breakpoints** with clear rationale
3. **Test on real devices** - simulators don't catch everything
4. **Use flexible layouts** - flexbox, grid, clamp() over fixed breakpoints

### ❌ DON'T

1. Create breakpoints for device names ("iPhone 12 width")
2. Read the viewport in JavaScript to pick a layout
3. Hardcode pixel values in multiple places
4. Ignore the "in-between" - test tablet sizes (600-900px)
5. Forget landscape orientation - phones can be 812px wide
6. Rely solely on breakpoints - use flexible layouts

---

## Tailwind Configuration

### Current Configuration

**File:** the `@theme` block in `src/styles/global.css`

Uses Tailwind's default breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`

### Optional: Add Custom Breakpoint

If the Stash list breakpoint is needed frequently in Tailwind classes:

```css
/* src/styles/global.css */
@theme {
  --breakpoint-xs: 526px; /* Same as min-[526px]: on the Stash list */
}
```

**Usage:** `hidden xs:block`, `flex-col xs:flex-row`

**Trade-off:** Adds to bundle size (minimal). Only add if `xs:` classes are needed frequently.

---

## Measurement & Monitoring

### Vercel Speed Insights

The project uses `@vercel/speed-insights` for Real User Monitoring (RUM).

**Configuration:** `src/app/layout.tsx`

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

// The App Router entry point reads the route itself, so it takes no route prop
;<SpeedInsights />
```

### Bundle Analysis

```bash
pnpm analyze  # Runs next build with ANALYZE=true
```

### Key Metrics to Monitor

| Metric      | Target   | Tool                       |
| ----------- | -------- | -------------------------- |
| FCP         | < 1.8s   | Lighthouse, Speed Insights |
| LCP         | < 2.5s   | Lighthouse, Speed Insights |
| CLS         | < 0.1    | Lighthouse, Speed Insights |
| Bundle Size | Minimize | `pnpm analyze`             |

---

## Testing Checklist

### Performance Testing

- [ ] Run Lighthouse audit in incognito mode
- [ ] Test on throttled network (Fast 3G)
- [ ] Verify loading skeletons appear correctly
- [ ] Check for layout shift during hydration
- [ ] Monitor Speed Insights dashboard for regressions

### Responsive Testing

| Width  | Device Category       | Tailwind       |
| ------ | --------------------- | -------------- |
| 320px  | Small phone           | -              |
| 375px  | Standard phone        | -              |
| 526px  | Stash list row starts | `min-[526px]:` |
| 640px  | Tailwind sm           | `sm:`          |
| 768px  | Tablet                | `md:`          |
| 1024px | Desktop               | `lg:`          |
| 1280px | Large desktop         | `xl:`          |

**Browser DevTools:** Chrome/Edge/Firefox all have device emulation presets.

**Real Device Testing:** Always test on actual phones/tablets when possible. Touch targets, font rendering, and performance differ from simulators.

---

## Summary

### Performance Optimizations

| Optimization      | Implementation                        | Impact                      |
| ----------------- | ------------------------------------- | --------------------------- |
| Dynamic Imports   | `next/dynamic` with `ssr: false`      | ~85KB bundle reduction      |
| Loading Skeletons | Tailwind `animate-pulse` placeholders | CLS prevention              |
| Fluid Spacing     | `clamp()` CSS function                | Eliminates breakpoint jumps |

### Breakpoint Summary

| Breakpoint  | Value  | Implementation         |
| ----------- | ------ | ---------------------- |
| Stash list  | 526px  | `min-[526px]:` classes |
| Tailwind sm | 640px  | `sm:` classes          |
| Tailwind md | 768px  | `md:` classes          |
| Tailwind lg | 1024px | `lg:` classes          |
| Tailwind xl | 1280px | `xl:` classes          |

### Source of Truth

- `src/styles/global.css` - CSS custom properties
- `src/styles/global.css` `@theme` block - Tailwind breakpoints (defaults, none overridden)
- This document - Patterns and best practices

---

**Related Documentation:**

- [SEO.md](./SEO.md) - Search engine optimization
- [PWA.md](./PWA.md) - Progressive Web App configuration
- [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) - File organization

---

_Last Updated: December 2024_
