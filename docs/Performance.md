# Performance & Responsive Design Guide

## Table of Contents

- [Overview](#overview)
- [Dynamic Imports & Code Splitting](#dynamic-imports--code-splitting)
- [Cumulative Layout Shift (CLS) Reduction](#cumulative-layout-shift-cls-reduction)
- [Debounced Event Handling](#debounced-event-handling)
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

**Reference Implementation:** `src/pages/demos/prompt-composer.tsx`

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

- `src/pages/demos/prompt-composer.tsx`
- `src/pages/demos/opioid-converter.tsx`
- `src/pages/demos/mandelbrot-explorer.tsx`

---

## Cumulative Layout Shift (CLS) Reduction

### What It Is

CLS measures visual stability—how much content shifts during page load. Poor CLS creates a jarring user experience and hurts Core Web Vitals scores.

### Loading Skeleton Pattern

Loading skeletons reserve space for dynamically loaded components, preventing layout shift when they render.

**Reference Implementation:** `src/pages/demos/prompt-composer.tsx:10-20`

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

### SSR Hydration Mismatch Prevention

When using responsive hooks, SSR can cause hydration mismatches if initial state differs from client state.

**Reference Implementation:** `src/hooks/useResponsive.ts:66-77`

```tsx
// Return safe defaults during SSR/hydration
if (!mounted) {
  return {
    isMobile: false,
    isDesktop: true, // Default to desktop for SSR
    // ...
  }
}
```

**Key insight:** Default to desktop during SSR because:

- Desktop layouts typically have more content
- Prevents content from appearing then disappearing
- Most crawlers render at desktop widths

---

## Debounced Event Handling

### What It Is

Debouncing delays function execution until a pause in rapid events (like window resize). This prevents performance degradation from hundreds of function calls per second.

### Implementation Pattern

**Reference Implementation:** `src/hooks/useResponsive.ts:52-63`

```tsx
useEffect(() => {
  setMounted(true)
  setWidth(window.innerWidth)

  // Debounce resize events
  let timeoutId: ReturnType<typeof setTimeout>
  const debouncedResize = () => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(handleResize, 100)
  }

  window.addEventListener('resize', debouncedResize)
  return () => {
    clearTimeout(timeoutId)
    window.removeEventListener('resize', debouncedResize)
  }
}, [handleResize])
```

### Why 100ms Delay?

- **Imperceptible to users**: 100ms feels instant
- **Significant performance gain**: Reduces calls from 60+/second to ~10/second during resize
- **Responsive enough**: Layout updates within acceptable delay

### When to Debounce

| Event Type          | Debounce? | Delay                  |
| ------------------- | --------- | ---------------------- |
| Window resize       | Yes       | 100-150ms              |
| Scroll position     | Depends   | 16ms (RAF) or 50-100ms |
| Text input (search) | Yes       | 300-500ms              |
| Mouse move          | Rarely    | Use throttle instead   |
| Click/tap           | No        | Immediate              |

### Debounce vs. Throttle

- **Debounce**: Waits for pause, then executes once (resize, search)
- **Throttle**: Executes at regular intervals during activity (scroll animations)

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

#### Primary: useResponsive Hook

**Implementation:** `src/hooks/useResponsive.ts`

The hook provides SSR-safe, debounced breakpoint detection with Tailwind-aligned values:

| Property         | Threshold  | Use Case                    |
| ---------------- | ---------- | --------------------------- |
| `isMobile`       | ≤525px     | Legacy mobile detection     |
| `isSmall`        | <640px     | Small screens (Tailwind sm) |
| `isMedium`       | 640-767px  | Mid-range screens           |
| `isTablet`       | 768-1023px | Tablet detection            |
| `isDesktop`      | ≥1024px    | Desktop layouts             |
| `isLargeDesktop` | ≥1280px    | Wide screen features        |
| `width`          | number     | Current viewport width      |

**Usage:**

```tsx
import { useResponsive } from '@/hooks/useResponsive'

const { isMobile, isDesktop } = useResponsive()
```

#### Why 525px for `isMobile`?

- Sits between phone (<480px) and small tablet (600px+)
- Captures most smartphones in portrait mode
- Provides breathing room above standard phone widths
- Aligns with content layout requirements across most pages

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
    ├─ YES → Does it affect general page layout/navigation?
    │         │
    │         ├─ YES → Use useResponsive hook
    │         │
    │         └─ NO → Does the component have CSS media queries?
    │                   │
    │                   ├─ YES → Match that breakpoint in React
    │                   │
    │                   └─ NO → Use Tailwind responsive classes
    │
    └─ NO → Use Tailwind responsive classes directly
```

### When to Use Each Approach

| Approach               | When to Use                | Example                |
| ---------------------- | -------------------------- | ---------------------- |
| **Tailwind classes**   | Layout-only changes        | `flex-col md:flex-row` |
| **useResponsive hook** | Behavioral/feature changes | Show/hide navigation   |
| **Custom breakpoint**  | Component-specific needs   | Matches existing CSS   |

### Codebase Examples

#### Example 1: Footer Layout

**File:** `src/sections/Footer.tsx:6-7,15-79`

Uses `useResponsive()` for mobile vs. desktop layout:

- **Desktop (>525px):** Social icons + navigation links
- **Mobile (≤525px):** Only centered social icons

#### Example 2: Header Navigation

**File:** `src/sections/Header.tsx:21,104-128`

Uses `useResponsive()` for navigation behavior:

- **Desktop:** Horizontal tab navigation
- **Mobile:** Hamburger menu with sidebar

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
2. **Use `useResponsive`** for behavioral changes at the site level
3. **Match CSS breakpoints** in React when they exist
4. **Document custom breakpoints** with clear rationale
5. **Test on real devices** - simulators don't catch everything
6. **Use semantic names** - `isMobile`, `isDesktop` (not `is525`)
7. **Use flexible layouts** - flexbox, grid, clamp() over fixed breakpoints

### ❌ DON'T

1. Create breakpoints for device names ("iPhone 12 width")
2. Proliferate custom hooks - reuse `useResponsive` when possible
3. Hardcode pixel values in multiple places
4. Ignore the "in-between" - test tablet sizes (600-900px)
5. Forget landscape orientation - phones can be 812px wide
6. Rely solely on breakpoints - use flexible layouts

### Performance Considerations

The `useResponsive` hook includes:

- **Debounced resize handling** (100ms) - prevents excessive re-renders
- **SSR-safe defaults** - prevents hydration mismatch
- **Single event listener** - centralized for all consumers

---

## Tailwind Configuration

### Current Configuration

**File:** `tailwind.config.js`

Uses Tailwind's default breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`

### Optional: Add Custom Breakpoint

If 525px is needed frequently in Tailwind classes:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        xs: '525px', // Matches useResponsive threshold
      },
    },
  },
}
```

**Usage:** `hidden xs:block`, `flex-col xs:flex-row`

**Trade-off:** Adds to bundle size (minimal). Only add if `xs:` classes are needed frequently.

---

## Measurement & Monitoring

### Vercel Speed Insights

The project uses `@vercel/speed-insights` for Real User Monitoring (RUM).

**Configuration:** `src/pages/_app.tsx`

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

// Route prop enables per-page metrics
;<SpeedInsights route={router.pathname} />
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

| Width  | Device Category      | Tailwind | useResponsive       |
| ------ | -------------------- | -------- | ------------------- |
| 320px  | Small phone          | -        | `isSmall`           |
| 375px  | Standard phone       | -        | `isSmall`           |
| 525px  | Our mobile threshold | -        | `isMobile` boundary |
| 640px  | Tailwind sm          | `sm:`    | `isMedium`          |
| 768px  | Tablet               | `md:`    | `isTablet`          |
| 1024px | Desktop              | `lg:`    | `isDesktop`         |
| 1280px | Large desktop        | `xl:`    | `isLargeDesktop`    |

**Browser DevTools:** Chrome/Edge/Firefox all have device emulation presets.

**Real Device Testing:** Always test on actual phones/tablets when possible. Touch targets, font rendering, and performance differ from simulators.

---

## Summary

### Performance Optimizations

| Optimization      | Implementation                        | Impact                      |
| ----------------- | ------------------------------------- | --------------------------- |
| Dynamic Imports   | `next/dynamic` with `ssr: false`      | ~85KB bundle reduction      |
| Loading Skeletons | Tailwind `animate-pulse` placeholders | CLS prevention              |
| Debounced Resize  | 100ms setTimeout pattern              | Smooth resize handling      |
| Fluid Spacing     | `clamp()` CSS function                | Eliminates breakpoint jumps |
| SSR Defaults      | Desktop-first hydration               | Prevents layout shift       |

### Breakpoint Summary

| Breakpoint      | Value  | Implementation                                  |
| --------------- | ------ | ----------------------------------------------- |
| Mobile (legacy) | 525px  | `useResponsive().isMobile`                      |
| Tailwind sm     | 640px  | `sm:` classes, `useResponsive().isSmall`        |
| Tailwind md     | 768px  | `md:` classes, `useResponsive().isTablet`       |
| Tailwind lg     | 1024px | `lg:` classes, `useResponsive().isDesktop`      |
| Tailwind xl     | 1280px | `xl:` classes, `useResponsive().isLargeDesktop` |

### Source of Truth

- `src/hooks/useResponsive.ts` - JavaScript breakpoint detection
- `src/styles/global.css` - CSS custom properties
- `tailwind.config.js` - Tailwind breakpoints
- This document - Patterns and best practices

---

**Related Documentation:**

- [SEO.md](./SEO.md) - Search engine optimization
- [PWA.md](./PWA.md) - Progressive Web App configuration
- [PROJECT-STRUCTURE.md](./PROJECT-STRUCTURE.md) - File organization

---

_Last Updated: December 2024_
