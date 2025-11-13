# Responsive Design & Breakpoint Strategy

## Table of Contents

- [Overview](#overview)
- [Industry Standards](#industry-standards)
- [Our Breakpoint Strategy](#our-breakpoint-strategy)
- [Implementation Guidelines](#implementation-guidelines)
- [Examples from Codebase](#examples-from-codebase)
- [Best Practices](#best-practices)
- [Tailwind Configuration](#tailwind-configuration)

---

## Overview

This document establishes the **source of truth** for responsive design breakpoints across the Co-Operability.com project. It outlines when to use global breakpoints vs. component-specific breakpoints and provides clear guidelines for maintaining consistency.

**Key Principle:** Breakpoints should be chosen based on **content requirements**, not device categories. Design should adapt where the layout naturally breaks, not at arbitrary "iPhone width" or "iPad width" values.

---

## Industry Standards

### Common Framework Breakpoints (2024-2025)

**Tailwind CSS (Default):**
```
xs:   (not included by default - can add custom)
sm:   640px   (tablets, large phones in landscape)
md:   768px   (small laptops, tablets in landscape)
lg:   1024px  (desktops)
xl:   1280px  (large desktops)
2xl:  1536px  (ultra-wide screens)
```

**Bootstrap 5:**
```
xs:   <576px  (extra small - phones)
sm:   ≥576px  (small - phones in landscape)
md:   ≥768px  (medium - tablets)
lg:   ≥992px  (large - desktops)
xl:   ≥1200px (extra large - large desktops)
xxl:  ≥1400px (extra extra large)
```

**Material Design:**
```
Mobile (Portrait):  0-599px
Mobile (Landscape): 600-839px
Tablet (Portrait):  840-1279px
Desktop:            1280px+
```

**Modern Device Reality:**
```
Small phones:     320px - 375px  (iPhone SE, older Android)
Standard phones:  375px - 414px  (iPhone 12-15, most Android)
Large phones:     414px - 480px  (iPhone Pro Max, Android phablets)
Small tablets:    600px - 768px  (iPad Mini)
Tablets:          768px - 1024px (iPad, Android tablets)
Desktops:         1024px+        (laptops and desktops)
```

---

## Our Breakpoint Strategy

### Global Breakpoint: **525px** (`useResponsive` Hook)

**Location:** `src/hooks/useResponsive.ts`

**Rationale:**
- Sits between phone (< 480px) and small tablet (600px+)
- Captures most modern smartphones in portrait mode
- Provides breathing room above standard phone widths
- Aligns with our content layout requirements across most pages

**Usage:** General mobile vs. desktop differentiation for:
- Header navigation
- Footer layout
- Section layouts
- General page structure

**Example:**
```typescript
const { isMobile } = useResponsive() // true if ≤ 525px
```

### Component-Specific Breakpoint: **375px** (Mandelbrot Explorer)

**Location:** `src/components/mandelbrot-explorer/MandelbrotExplorer.tsx`

**Rationale:**
- Matches CSS media query for iteration controls: `@media (max-width: 375px)`
- Targets very narrow screens where UI components need vertical stacking
- Aligns with iPhone SE / small Android phones (320px - 375px range)
- Prevents instruction overflow on smallest devices

**Usage:** Ultra-narrow screen adaptations when 525px is too generous:
- Complex interactive components with dense controls
- Components that need additional layout shifts for tiny screens
- When CSS and React need synchronized breakpoints

**Example:**
```typescript
const [isNarrowScreen, setIsNarrowScreen] = useState(false)

useEffect(() => {
  const checkScreenWidth = () => {
    setIsNarrowScreen(window.innerWidth <= 375)
  }
  // ... listener setup
}, [])
```

---

## Implementation Guidelines

### When to Use Global Breakpoint (525px)

✅ **Use `useResponsive` hook for:**
- Page-level layout changes (header, footer, sections)
- Navigation behavior (hamburger menu vs. horizontal nav)
- Content reflow that affects multiple components
- Typography scaling decisions
- General mobile vs. desktop feature toggles

### When to Use Component-Specific Breakpoint

✅ **Create custom breakpoint logic when:**
- Component has unique layout requirements that break earlier/later than global breakpoint
- CSS media query already exists and React needs to match it (maintain parity)
- Component is self-contained and won't affect other layouts
- Design requires multiple breakpoint tiers within a single component

⚠️ **Guidelines for custom breakpoints:**
1. **Document the reason** in component comments
2. **Align with CSS** if media queries exist (avoid drift)
3. **Use meaningful names** (e.g., `isNarrowScreen` not `isMobile2`)
4. **Keep it local** - don't create new global hooks unless reused 3+ times

### Decision Tree

```
Does this need a mobile/desktop split?
    │
    ├─ YES → Does it affect general page layout/navigation?
    │         │
    │         ├─ YES → Use useResponsive (525px)
    │         │
    │         └─ NO → Does the component have CSS media queries?
    │                   │
    │                   ├─ YES → Match that breakpoint in React
    │                   │
    │                   └─ NO → Will it be reused across components?
    │                             │
    │                             ├─ YES → Consider adding to useResponsive
    │                             │
    │                             └─ NO → Create local state (document rationale)
    │
    └─ NO → Use Tailwind responsive classes directly
```

---

## Examples from Codebase

### Example 1: Footer (Global Breakpoint)

**File:** `src/sections/Footer.tsx`

```typescript
import { useResponsive } from '../hooks/useResponsive'

const Footer = () => {
  const { isMobile } = useResponsive() // 525px

  return (
    <footer>
      {!isMobile ? (
        /* Desktop: Social icons + navigation links */
        <div className="flex flex-col gap-1">
          <SocialIcons />
          <NavigationLinks />
        </div>
      ) : (
        /* Mobile (≤525px): Only social icons, no nav links */
        <SocialIcons centered />
      )}
      <Copyright />
    </footer>
  )
}
```

**Why 525px?** Footer is a site-wide section that needs consistent behavior with header/navigation. The layout naturally breaks when horizontal space becomes constrained around 525px.

### Example 2: Mandelbrot Explorer (Component-Specific)

**File:** `src/components/mandelbrot-explorer/MandelbrotExplorer.tsx`

**CSS:** `src/components/mandelbrot-explorer/MandelbrotExplorer.module.css`
```css
@media (max-width: 375px) {
  .iterationControls {
    flex-direction: column;
  }
}
```

**React:**
```typescript
const [isNarrowScreen, setIsNarrowScreen] = useState(false)

useEffect(() => {
  const checkScreenWidth = () => {
    setIsNarrowScreen(window.innerWidth <= 375) // Matches CSS!
  }
  // ... setup
}, [])

// In render:
{!isNarrowScreen ? (
  <p><b>Desktop:</b> Click and drag to pan, double-click to zoom in 2×.</p>
) : (
  <p><b>Mobile:</b> Drag to pan, double-tap zooms 2x, pinch to zoom in/out.</p>
)}
```

**Why 375px?** 
1. CSS already defines 375px for iteration control layout
2. Very small screens need different instructions (double-tap vs double-click)
3. Maintains React/CSS parity for this complex interactive component
4. Targets the smallest modern phones (iPhone SE: 375px)

### Example 3: Pure Tailwind Approach

**When you don't need JavaScript logic:**

```tsx
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-1/4">Sidebar</aside>
  <main className="w-full md:w-3/4">Content</main>
</div>
```

No custom breakpoint needed - Tailwind handles it declaratively.

---

## Best Practices

### ✅ DO

1. **Start with Tailwind classes** for layout-only responsive changes
2. **Use `useResponsive`** for behavioral changes and feature toggles at the site level
3. **Match CSS breakpoints** in React when they exist (avoid drift)
4. **Document custom breakpoints** with clear rationale in comments
5. **Test on real devices** - simulators don't catch everything
6. **Use semantic names** - `isNarrowScreen`, `isMobile`, `isDesktop` (not `is525`, `is375`)

### ❌ DON'T

1. **Don't create breakpoints for device names** ("iPhone 12 width") - use content needs
2. **Don't proliferate custom hooks** - reuse `useResponsive` when possible
3. **Don't hardcode pixel values** in multiple places - use constants
4. **Don't ignore the "in-between"** - test tablet sizes (600-900px)
5. **Don't forget landscape orientation** - phones can be 812px wide
6. **Don't rely solely on breakpoints** - use flexible layouts (flexbox, grid, clamp())

### Performance Considerations

```typescript
// ✅ GOOD: Single resize listener with throttling
useEffect(() => {
  const checkWidth = () => setIsNarrow(window.innerWidth <= 375)
  checkWidth()
  window.addEventListener('resize', checkWidth)
  return () => window.removeEventListener('resize', checkWidth)
}, [])

// ❌ BAD: Multiple resize listeners per component instance
// This happens automatically when each component creates its own listener
// Solution: Centralize in useResponsive or use a resize observer library
```

---

## Tailwind Configuration

### Current Configuration

**File:** `tailwind.config.js`

```javascript
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    // Uses Tailwind's default breakpoints:
    // sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
  },
  // ...
}
```

### Recommended: Add Custom Breakpoint (Optional)

If 525px becomes widely used and you want Tailwind utilities for it:

```javascript
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '525px',  // Matches useResponsive threshold
        // Tailwind defaults still available: sm, md, lg, xl, 2xl
      },
    },
  },
  // ...
}
```

**Usage after adding:**
```tsx
<div className="hidden xs:block">
  {/* Visible above 525px */}
</div>

<nav className="flex-col xs:flex-row">
  {/* Vertical below 525px, horizontal above */}
</nav>
```

**Trade-off:** Adds to bundle size (minimal). Only add if you need `xs:` classes frequently.

---

## Testing Checklist

When implementing responsive changes:

- [ ] **320px** - iPhone SE, smallest modern phone
- [ ] **375px** - iPhone 12/13/14 standard, most common mobile size
- [ ] **414px** - iPhone Pro Max, large phones
- [ ] **525px** - Our primary breakpoint (useResponsive)
- [ ] **600px** - Small tablets (iPad Mini portrait)
- [ ] **768px** - Tablets (iPad portrait, Tailwind `md`)
- [ ] **1024px** - Desktops (Tailwind `lg`)
- [ ] **1280px+** - Large desktops (Tailwind `xl`)

**Browser DevTools:** Chrome/Edge/Firefox all have device emulation with common presets.

**Real Device Testing:** Always test on actual phones/tablets when possible. Touch targets, font rendering, and performance differ from simulators.

---

## Future Considerations

### If the project grows significantly:

1. **Centralized breakpoint constants:**
   ```typescript
   // src/constants/breakpoints.ts
   export const BREAKPOINTS = {
     MOBILE: 525,
     NARROW: 375,
     TABLET: 768,
     DESKTOP: 1024,
   } as const
   ```

2. **Enhanced useResponsive:**
   ```typescript
   export function useResponsive() {
     return {
       isMobile: width <= 525,
       isNarrow: width <= 375,
       isTablet: width > 525 && width <= 1024,
       isDesktop: width > 1024,
     }
   }
   ```

3. **Container Queries (CSS):** When browser support improves, consider replacing some width-based queries with container queries for truly component-based responsive design.

---

## Summary

**Primary Breakpoint:** 525px (`useResponsive`) for site-wide mobile/desktop splits

**Secondary Breakpoint:** 375px (component-specific) for ultra-narrow screen adaptations

**Philosophy:** Content-first responsive design - break where the layout naturally needs it, not at arbitrary device widths

**Consistency:** Document deviations, match CSS/React breakpoints, centralize when reused

**Source of Truth:** This document + `src/hooks/useResponsive.ts` + component-specific documentation in code comments

---

*Last Updated: November 2025*

