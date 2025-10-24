# Progressive Web App (PWA) Suite

**Complete technical reference for the Co-Operability PWA applet architecture**

---

## Table of Contents

1. [What is a PWA?](#what-is-a-pwa)
2. [The Applet Suite Philosophy](#the-applet-suite-philosophy)
3. [Architecture](#architecture)
4. [Implementation Guide](#implementation-guide)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)
7. [Advantages & Disadvantages](#advantages--disadvantages)
8. [Future Enhancements](#future-enhancements)

---

## What is a PWA?

### Core Concept

A **Progressive Web App (PWA)** is a website that behaves like a native mobile app. It can be installed on a device's home screen, works offline, and provides a native-like experience—all without app store distribution.

### Key Technologies

**1. Web App Manifest** (JSON file defining app identity):

```json
{
  "name": "My App",           // Full name shown during install
  "short_name": "App",        // Name shown under icon
  "start_url": "/",           // URL to open on launch
  "display": "standalone",    // Hides browser UI
  "icons": [...]              // App icons
}
```

**2. Service Worker** (JavaScript file enabling offline functionality):

```javascript
// Intercepts network requests, serves cached assets
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request))
})
```

**3. HTTPS** (Required for security):

- PWAs only work on secure origins (HTTPS or localhost)
- Service workers require HTTPS to prevent man-in-the-middle attacks

### PWA Requirements (Install Criteria)

For a site to be installable:

- ✅ Served over HTTPS
- ✅ Has a valid web app manifest
- ✅ Has at least one icon (192x192 or larger)
- ✅ Has a registered service worker
- ✅ Manifest includes `name` (or `short_name`), `start_url`, `display`

---

## The Applet Suite Philosophy

### The Problem

Traditional PWA approach: **one manifest per site**

- User installs site → always shows the same name (e.g., "Co-Operability")
- Can't install individual tools with unique identities
- All pages share the same app identity

### The Solution: Multiple Installable Identities

**Applet Suite approach:** Create a **family of installable apps** from a single codebase.

**Current Implementation:**

- **"Co-Operability"** - Main portfolio site (from `/`)
- **"Prompt Composer"** - Standalone prompt builder (from `/prompt-composer`)
- **"Opioid Converter"** - Standalone medical calculator (from `/opioid-converter`)

**Key Insight:** Each URL can advertise a different manifest, giving each tool its own installable identity while sharing infrastructure.

### Architecture Philosophy

**Shared Infrastructure, Unique Identities**

| Component      | Approach                            | Benefit                           |
| -------------- | ----------------------------------- | --------------------------------- |
| Service Worker | **Shared** - One SW at `/sw.js`     | Efficient caching, no duplication |
| Icons          | **Shared** - Same icon set for all  | Brand consistency                 |
| Manifests      | **Unique** - One per applet         | Each app has its own identity     |
| Codebase       | **Shared** - Single Next.js project | Easy maintenance                  |

**Result:** Users can install "Prompt Composer" as a standalone app, but it uses the same service worker and icons as "Co-Operability"—efficient and maintainable.

---

## Architecture

### Component Overview

```
Co-Operability PWA Suite
├── public/icons/
│   ├── site.webmanifest              # Main site identity
│   ├── prompt-composer.webmanifest   # Prompt Composer identity
│   ├── opioid-converter.webmanifest  # Opioid Converter identity
│   ├── web-app-manifest-192x192.png  # Shared icons
│   ├── web-app-manifest-512x512.png
│   └── apple-touch-icon.png
├── public/sw.js                      # Compiled service worker
├── src/
│   ├── sw.js                         # Service worker source
│   ├── components/layout.tsx         # Layout with skipManifest prop
│   └── pages/
│       ├── index.tsx                 # Main site (uses site.webmanifest)
│       ├── prompt-composer.tsx       # Applet (uses prompt-composer.webmanifest)
│       └── opioid-converter.tsx      # Applet (uses opioid-converter.webmanifest)
└── scripts/build-sw.mjs              # Service worker build script
```

### How Manifest Precedence Works

**The Critical Rule:** Browsers use the **first** `<link rel="manifest">` they encounter in the HTML.

**Problem (Before Fix):**

```html
<head>
  <!-- Layout's manifest (loaded first) -->
  <link rel="manifest" href="/icons/site.webmanifest" />

  <!-- Page's manifest (loaded second, IGNORED) -->
  <link rel="manifest" href="/icons/prompt-composer.webmanifest" />
</head>
<!-- Result: Browser uses site.webmanifest → shows "Co-Operability" -->
```

**Solution (Current):**

```tsx
// Layout component with conditional manifest
<Layout home={false} skipManifest={true}>
  <Head>
    <!-- Only page manifest present -->
    <link rel="manifest" href="/icons/prompt-composer.webmanifest" />
  </Head>
</Layout>
<!-- Result: Browser uses prompt-composer.webmanifest → shows "Prompt Composer" -->
```

### Service Worker Architecture

**File Structure:**

- **`src/sw.js`** - Source file (edited by developers)
- **`public/sw.js`** - Compiled file (generated at build time, served to browsers)

**Build Process:**

```bash
yarn build
  → next build               # Builds Next.js app
  → build-sw.mjs             # Injects precache manifest into src/sw.js → public/sw.js
  → next-sitemap             # Generates sitemap
```

**Service Worker Scope:**

```javascript
// Registration in _app.tsx
navigator.serviceWorker.register('/sw.js', { scope: '/' })
//                                            ↑
//                                  Scope: "/" = caches ALL routes
```

**Key Concept:** Service worker scope (`/`) is **independent** of manifest scope:

- **Service Worker Scope (`/`):** Controls what URLs can be cached (all routes)
- **Manifest Scope (`/prompt-composer`):** Controls what URLs open within the app (app-specific)

### Manifest Anatomy

**Example: Prompt Composer Manifest**

```json
{
  "name": "Prompt Composer", // Full name (install dialog, task switcher)
  "short_name": "Composer", // Home screen label (space-limited)
  "description": "Research-backed...", // App description (app stores, search)
  "start_url": "/prompt-composer", // URL to open on launch
  "scope": "/prompt-composer", // URLs considered "in-app"
  "display": "standalone", // How to display (standalone = no browser UI)
  "theme_color": "#3b82f6", // Browser chrome color (status bar, etc.)
  "background_color": "#ffffff", // Splash screen background
  "icons": [
    // App icons (shared across all applets)
    {
      "src": "/icons/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any" // "maskable" = supports adaptive icons
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

**Property Definitions:**

| Property           | Purpose                        | Example                          | Required                   |
| ------------------ | ------------------------------ | -------------------------------- | -------------------------- |
| `name`             | Full app name (install dialog) | "Prompt Composer"                | Yes\*                      |
| `short_name`       | Home screen label              | "Composer"                       | Yes\*                      |
| `description`      | App description                | "Research-backed prompt builder" | No                         |
| `start_url`        | Launch URL                     | "/prompt-composer"               | Yes                        |
| `scope`            | In-app URL boundary            | "/prompt-composer"               | No (defaults to start_url) |
| `display`          | Display mode                   | "standalone"                     | Yes                        |
| `theme_color`      | Browser chrome color           | "#3b82f6"                        | No                         |
| `background_color` | Splash screen color            | "#ffffff"                        | No                         |
| `icons`            | App icons (array)              | See above                        | Yes (≥192x192)             |

\*At least one of `name` or `short_name` required

### iOS-Specific Meta Tags

**Problem:** Apple doesn't fully support web app manifests (as of iOS 17).

**Solution:** Include Apple-specific `<meta>` tags alongside manifest:

```html
<head>
  <!-- Standard manifest -->
  <link rel="manifest" href="/icons/prompt-composer.webmanifest" />

  <!-- iOS-specific tags (required for proper naming) -->
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-title" content="Prompt Composer" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="theme-color" content="#3b82f6" />
</head>
```

**Why both?**

- Android/Chrome: Uses manifest
- iOS/Safari: Uses meta tags
- Including both ensures cross-platform compatibility

### Shortcuts (Android Only)

**Main manifest includes shortcuts array:**

```json
{
  "shortcuts": [
    {
      "name": "Prompt Composer",
      "short_name": "Composer",
      "url": "/prompt-composer",
      "icons": [
        { "src": "/icons/web-app-manifest-192x192.png", "sizes": "192x192" }
      ]
    },
    {
      "name": "Opioid Converter",
      "short_name": "Opioid Calc",
      "url": "/opioid-converter",
      "icons": [
        { "src": "/icons/web-app-manifest-192x192.png", "sizes": "192x192" }
      ]
    }
  ]
}
```

**User Experience (Android):**

1. User installs main "Co-Operability" app
2. User long-presses the app icon on home screen
3. Context menu shows shortcuts to jump directly to applets
4. Tapping a shortcut opens that specific tool

**iOS Support:** Not currently supported (as of iOS 17)

---

## Implementation Guide

### Step 1: Create a New Manifest File

**File:** `public/icons/my-new-applet.webmanifest`

```json
{
  "name": "My New Applet",
  "short_name": "Applet",
  "description": "Description of what this tool does",
  "start_url": "/my-new-applet",
  "scope": "/my-new-applet",
  "display": "standalone",
  "theme_color": "#8b5cf6",
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

**Customization Points:**

- `name` / `short_name`: Choose descriptive names
- `theme_color`: Pick a color that matches your app's branding (hex code)
- `start_url` / `scope`: Match your route URL
- `description`: Clear, concise explanation (useful for app stores)

### Step 2: Create the Page Component

**File:** `src/pages/my-new-applet.tsx`

```tsx
import Head from 'next/head'
import Layout from '@/src/components/layout'
import MyAppletComponent from '@/src/components/MyAppletComponent'
import { NextPageWithLayout } from './_app'

const MyAppletPage: NextPageWithLayout = () => {
  return (
    <Layout home={false} skipManifest={true}>
      {' '}
      {/* KEY: skipManifest={true} */}
      <Head>
        <title>My New Applet | Co-Operability</title>
        <meta name="description" content="Description of what this tool does" />

        {/* PWA-specific manifest for this applet */}
        <link rel="manifest" href="/icons/my-new-applet.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* iOS-specific meta tags (required for proper naming on Safari) */}
        <meta name="apple-mobile-web-app-title" content="My New Applet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#8b5cf6" />
      </Head>
      <div className="min-h-screen">
        <MyAppletComponent />
      </div>
    </Layout>
  )
}

export default MyAppletPage
```

**Critical Requirements:**

1. ✅ Use main `Layout` component (provides Header, ThemeSwitch, Footer)
2. ✅ Pass `skipManifest={true}` to Layout (prevents global manifest conflict)
3. ✅ Include page-specific manifest link
4. ✅ Include apple-touch-icon link
5. ✅ Include all iOS-specific meta tags
6. ✅ Match `theme-color` between manifest and meta tag

### Step 3: Add to Shortcuts (Optional)

**File:** `public/icons/site.webmanifest`

```json
{
  "name": "Co-Operability",
  "shortcuts": [
    {
      "name": "Prompt Composer",
      "url": "/prompt-composer"
    },
    {
      "name": "Opioid Converter",
      "url": "/opioid-converter"
    },
    {
      "name": "My New Applet", // Add your new applet here
      "url": "/my-new-applet"
    }
  ]
}
```

**Benefits:**

- Android users who install the main app can long-press → jump to your applet
- Acts as a launcher menu for your app suite
- Not required, but enhances discoverability

### Step 4: Test Locally

```bash
# Start development server
yarn dev

# Navigate to applet URL
open http://localhost:3000/my-new-applet

# Open Chrome DevTools
# 1. Press F12
# 2. Go to Application tab
# 3. Click Manifest in sidebar
# 4. Verify:
#    - Name: "My New Applet"
#    - Start URL: "/my-new-applet"
#    - Theme color: your chosen color
#    - Icons: 4 icons visible (192x192, 512x512, etc.)
```

### Step 5: Deploy & Test on Mobile

```bash
# Build and deploy
yarn build
git add .
git commit -m "Add My New Applet PWA"
git push origin main  # Triggers Vercel deployment

# Test on iPhone (REQUIRED - simulators don't work for PWA testing)
# 1. Open Safari on iPhone
# 2. Navigate to: https://cooperability.com/my-new-applet
# 3. Tap Share button
# 4. Tap "Add to Home Screen"
# 5. Verify name shows "My New Applet" (not "Co-Operability")
# 6. Tap Add
# 7. Launch from home screen
# 8. Verify opens to /my-new-applet in standalone mode
```

---

## Testing & Validation

### Desktop Testing (Chrome/Edge DevTools)

**Quick Checklist:**

```bash
✅ Navigate to applet URL (e.g., /prompt-composer)
✅ Open DevTools (F12) → Application tab
✅ Click "Manifest" in sidebar
✅ Verify:
   - Correct name appears
   - Correct start_url
   - Icons preview shows all sizes
   - Theme color matches expectation
   - No errors in console
✅ Check "Service Workers" section
   - Status: "activated and is running"
   - Scope: "/"
```

**View HTML Source:**

```bash
# Verify only ONE manifest link present
curl http://localhost:3000/prompt-composer | grep 'rel="manifest"'

# Expected: Only prompt-composer.webmanifest
# Should NOT see site.webmanifest
```

### iOS Testing (Safari - Most Critical)

**Requirements:**

- ✅ Actual iPhone required (simulators don't accurately test PWA behavior)
- ✅ HTTPS required (use production URL or ngrok for localhost)

**Test Procedure:**

1. **Open Safari** on iPhone
2. **Navigate** to applet URL: `https://cooperability.com/prompt-composer`
3. **Tap Share** button (square with arrow pointing up)
4. **Scroll down**, tap **"Add to Home Screen"**
5. **Verify name** shows "Prompt Composer" (NOT "Co-Operability") ← CRITICAL
6. **Tap "Add"**
7. **Check home screen** - icon should be labeled correctly
8. **Tap icon** to launch
9. **Verify:**
   - Opens directly to `/prompt-composer` (no URL bar visible)
   - No Safari UI (true standalone mode)
   - Header and ThemeSwitch visible
   - Status bar color matches theme color

**Repeat for each applet**

### Android Testing (Chrome)

**Test Procedure:**

1. **Open Chrome** on Android
2. **Navigate** to applet URL
3. **Look for "Add to Home screen"** banner (or Menu → Add to Home screen)
4. **Verify name** shows correctly
5. **Tap "Add"**
6. **Launch** from home screen
7. **Verify** opens in standalone mode

**Test Shortcuts (Android Only):**

1. **Install main site** first
2. **Long-press** "Co-Operability" icon
3. **Verify** context menu shows shortcuts to applets
4. **Tap** a shortcut → should jump directly to that applet

### Lighthouse PWA Audit

**Run comprehensive PWA audit:**

```bash
# Chrome DevTools → Lighthouse tab
# 1. Select "Progressive Web App" category
# 2. Click "Analyze page load"
# 3. Review score (should be 90+)

# Or via CLI:
npx lighthouse https://cooperability.com/prompt-composer \
  --only-categories=pwa \
  --output html \
  --output-path ./pwa-audit.html
```

**What Lighthouse checks:**

- ✅ Installability criteria met
- ✅ Service worker registered
- ✅ Manifest valid
- ✅ Icons correct sizes
- ✅ Offline functionality (if implemented)
- ✅ Display mode set
- ✅ Theme color set

### Validation Commands

**Check manifest files exist:**

```bash
ls -la public/icons/*.webmanifest
# Expected:
# - site.webmanifest
# - prompt-composer.webmanifest
# - opioid-converter.webmanifest
```

**Validate JSON syntax:**

```bash
# Install jq (JSON processor)
# macOS: brew install jq
# Windows: choco install jq

# Validate each manifest
jq . public/icons/prompt-composer.webmanifest
jq . public/icons/opioid-converter.webmanifest
jq . public/icons/site.webmanifest

# If valid: pretty-printed JSON
# If invalid: syntax error message
```

**Check page includes manifest link:**

```bash
grep -n 'rel="manifest"' src/pages/prompt-composer.tsx
grep -n 'rel="manifest"' src/pages/opioid-converter.tsx

# Expected: Should find the manifest links
```

### Testing Matrix

| Feature         | Chrome Desktop | Safari iOS | Chrome Android | Notes              |
| --------------- | -------------- | ---------- | -------------- | ------------------ |
| Manifest loaded | ✅             | ✅         | ✅             | All platforms      |
| Correct name    | ✅             | ✅         | ✅             | Verify per-applet  |
| Icons display   | ✅             | ✅         | ✅             | 192x192 + 512x512  |
| Standalone mode | ✅             | ✅         | ✅             | No browser UI      |
| Theme color     | ✅             | ⚠️ Limited | ✅             | iOS support varies |
| Shortcuts       | ✅             | ❌         | ✅             | Android only       |
| Service worker  | ✅             | ✅         | ✅             | Requires HTTPS     |
| Offline mode    | ✅             | ✅         | ✅             | If implemented     |

---

## Troubleshooting

### Issue: "Add to Home Screen" shows wrong name

**Symptoms:**

- Tap "Add to Home Screen" on `/prompt-composer`
- Dialog shows "Co-Operability" instead of "Prompt Composer"

**Diagnosis:**

```bash
# Check HTML source for duplicate manifests
curl http://localhost:3000/prompt-composer | grep 'rel="manifest"'

# Problem: Multiple manifest links
# <link rel="manifest" href="/icons/site.webmanifest" />        ← Layout's manifest (wrong)
# <link rel="manifest" href="/icons/prompt-composer.webmanifest" />  ← Page's manifest (ignored)
```

**Solutions:**

1. ✅ Verify `skipManifest={true}` passed to Layout component
2. ✅ Check manifest file exists at correct path
3. ✅ Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
4. ✅ Restart dev server
5. ✅ Check DevTools → Application → Manifest for errors

**Root Cause:** Browsers use the **first** manifest link they encounter. If Layout's manifest comes before page's manifest, browser uses Layout's.

### Issue: App opens in browser instead of standalone mode

**Symptoms:**

- App launches but shows browser UI (URL bar, back button)
- Doesn't feel like a native app

**Diagnosis:**

```bash
# Check manifest display mode
jq .display public/icons/prompt-composer.webmanifest
# Should output: "standalone"
```

**Solutions:**

1. ✅ Ensure manifest has `"display": "standalone"`
2. ✅ Verify `start_url` is within `scope`:
   ```json
   {
     "start_url": "/prompt-composer", // Must be within scope
     "scope": "/prompt-composer" // URL boundary
   }
   ```
3. ✅ Delete app from home screen and reinstall
4. ✅ Check iOS Settings → Safari → "Open Links" set to "In App"

**Root Cause:** Scope mismatch or incorrect display mode prevents standalone behavior.

### Issue: Icons not showing

**Symptoms:**

- DevTools Manifest tab shows "No icon available"
- Install dialog shows generic browser icon
- Installed app has wrong icon

**Diagnosis:**

```bash
# Verify icon files exist
ls -la public/icons/*.png

# Check manifest icon paths
jq .icons public/icons/prompt-composer.webmanifest
```

**Solutions:**

1. ✅ Verify icon paths start with `/` (absolute paths):
   - ✅ Correct: `"/icons/web-app-manifest-192x192.png"`
   - ❌ Wrong: `"icons/web-app-manifest-192x192.png"`
2. ✅ Ensure at least 192x192 and 512x512 sizes included
3. ✅ Check icon files actually exist in `public/icons/`
4. ✅ Verify `purpose: "maskable any"` allows fallback rendering
5. ✅ Test icons by opening URLs directly: `http://localhost:3000/icons/web-app-manifest-192x192.png`

### Issue: Service worker not activating

**Symptoms:**

- DevTools → Application → Service Workers shows "Waiting" or nothing
- Offline functionality doesn't work
- Console errors about service worker

**Diagnosis:**

```bash
# Check if service worker file exists
curl http://localhost:3000/sw.js

# Check for registration errors in console
# Look for: "Failed to register service worker"
```

**Solutions:**

1. ✅ **HTTPS required** (except localhost) - PWAs require secure origins
2. ✅ Check console for registration errors
3. ✅ Verify service worker path is correct (`/sw.js`)
4. ✅ DevTools → Application → Service Workers → Click "Update"
5. ✅ Try "Skip waiting" if old worker is stuck
6. ✅ Clear site data: DevTools → Application → Clear storage → Clear site data
7. ✅ Rebuild: `yarn build` (regenerates service worker)

**Root Cause:** Service workers have strict security requirements and can be finicky with updates.

### Issue: iOS still shows old name after changes

**Symptoms:**

- Updated manifest but iOS install still shows old name
- Manifest changes not reflected on device

**Solutions:**

1. ✅ Delete app from home screen completely
2. ✅ Close Safari completely (swipe up from app switcher)
3. ✅ Clear Safari cache: Settings → Safari → Clear History and Website Data
4. ✅ Reopen Safari
5. ✅ Navigate to applet URL
6. ✅ Re-add to home screen

**Root Cause:** iOS aggressively caches manifests and icons. Full cache clear required.

### Issue: DevTools shows wrong manifest

**Symptoms:**

- Navigate to `/prompt-composer`
- DevTools → Manifest shows "Co-Operability" instead of "Prompt Composer"

**Solutions:**

1. ✅ Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. ✅ DevTools → Network tab → Check "Disable cache"
3. ✅ Check manifest syntax: run through JSON validator
4. ✅ Verify manifest file path is correct (check for typos)
5. ✅ Inspect HTML source to see which manifest is actually linked

### Issue: Changes not appearing after deploy

**Symptoms:**

- Made changes to manifest
- Deployed successfully
- Users still see old version

**Solutions:**

1. ✅ Verify changes are in git: `git log --oneline -5`
2. ✅ Check Vercel deployment logs for build success
3. ✅ Hard refresh on production URL
4. ✅ Check Vercel cache: may need to redeploy without cache
5. ✅ Users must reinstall app (updates don't auto-apply to installed PWAs)

**Important:** Manifest changes require reinstallation. Users must delete and re-add the app.

### Debug Logging

**Add to page component for debugging:**

```tsx
useEffect(() => {
  // Check which manifest is active
  const manifestLink = document.querySelector('link[rel="manifest"]')
  console.log('Active manifest:', manifestLink?.getAttribute('href'))

  // Check service worker registration
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistration().then((reg) => {
      console.log('SW registered:', !!reg)
      console.log('SW scope:', reg?.scope)
      console.log('SW active:', reg?.active?.state)
    })
  }
}, [])
```

---

## Advantages & Disadvantages

### Advantages

**For Users:**

- ✅ **Native-like experience** - Feels like a native app (no browser UI)
- ✅ **Easy access** - Lives on home screen with native apps
- ✅ **Fast loading** - Precached assets load instantly
- ✅ **Offline capable** - Works without internet connection (if implemented)
- ✅ **No app store** - Install directly from website, no download
- ✅ **Always up-to-date** - Updates automatically (no manual updates)
- ✅ **Cross-platform** - Works on iOS, Android, desktop
- ✅ **Low friction** - One tap to install (vs multi-step app store process)
- ✅ **No storage bloat** - Smaller than equivalent native app

**For Developers:**

- ✅ **Single codebase** - Write once, run everywhere
- ✅ **Web technologies** - Use HTML/CSS/JS (no Swift/Kotlin)
- ✅ **No app store approval** - Deploy instantly, no review process
- ✅ **Instant updates** - Push updates without app store review
- ✅ **Easy maintenance** - Fix bugs and deploy immediately
- ✅ **SEO benefits** - Same code serves web and PWA
- ✅ **Lower development cost** - No separate native apps needed
- ✅ **Analytics** - Use standard web analytics
- ✅ **A/B testing** - Easy to test and iterate

**For This Project (Applet Suite):**

- ✅ **Multiple app identities from one codebase** - Each tool is its own app
- ✅ **Shared infrastructure** - One service worker, one icon set
- ✅ **Scalable pattern** - Easy to add new applets
- ✅ **Professional presentation** - Shows advanced web capabilities
- ✅ **User engagement** - Installed apps = long-term engagement
- ✅ **No distribution costs** - No app store fees

### Disadvantages

**Technical Limitations:**

- ❌ **Limited native API access** - Can't access all device features
  - No Bluetooth (except Web Bluetooth API, limited)
  - No NFC (except experimental API)
  - No direct file system access (only via File System Access API)
  - No background processing (except limited background sync)
- ❌ **iOS limitations** - Apple's PWA support lags behind Android
  - No push notifications (as of iOS 17)
  - Limited background sync
  - Manifest support incomplete (requires meta tags)
  - Storage can be cleared by OS
- ❌ **HTTPS required** - Can't work on insecure origins
- ❌ **Browser-dependent** - Features vary by browser
- ❌ **No app store presence** - Harder to discover (no search ranking)
- ❌ **Storage limits** - Quota varies by browser/device
- ❌ **No in-app purchases** - Can't use native payment APIs (must use web payments)

**User Experience:**

- ❌ **Less discoverable** - Users must know to add to home screen
- ❌ **Education needed** - Not everyone knows what "Add to Home Screen" means
- ❌ **Icon quality** - May not match native app icon polish
- ❌ **Reinstall for updates** - Manifest changes require reinstallation
- ❌ **Inconsistent behavior** - Experience varies by browser/platform
- ❌ **No app store ratings** - Can't leverage social proof from reviews

**Development Challenges:**

- ❌ **Testing complexity** - Must test on actual devices (simulators insufficient)
- ❌ **Platform differences** - iOS and Android have different capabilities
- ❌ **Service worker complexity** - Caching strategy can be tricky
- ❌ **Debug difficulty** - Harder to debug installed PWAs than web pages
- ❌ **Version management** - Service worker versioning requires care

### When to Use PWAs

**✅ Good Fit:**

- Content-focused apps (news, blogs, documentation)
- Productivity tools (task managers, note-taking, calculators)
- E-commerce sites (shopping, catalogs)
- Social media (timeline viewing, posting)
- Reference tools (converters, lookup tools)
- Portfolio sites with interactive demos (← this project)

**❌ Poor Fit:**

- Apps requiring deep native integration (camera apps, fitness trackers)
- Apps with heavy background processing
- Apps requiring platform-specific SDKs
- Apps needing app store visibility for discovery
- Games requiring high performance (use WebAssembly for better perf)

### This Project's Decision: Applet Suite

**Why PWA suite approach works here:**

1. ✅ **Tools are standalone** - Each applet (Prompt Composer, Opioid Converter) has clear purpose
2. ✅ **Offline-first nature** - Calculators and tools work without internet
3. ✅ **No native APIs needed** - Pure computation, no camera/Bluetooth/etc.
4. ✅ **Portfolio showcase** - Demonstrates advanced web capabilities
5. ✅ **Easy maintenance** - Single codebase, instant updates
6. ✅ **Cross-platform reach** - One implementation works everywhere

**Trade-offs accepted:**

- ❌ No push notifications (not needed for these tools)
- ❌ Limited iOS features (acceptable for target use case)
- ❌ Manual install process (target audience is tech-savvy)

---

## Future Enhancements

### Easy Additions

**1. Custom Icons Per Applet**

Currently all applets share the same icon. To differentiate:

```bash
# Create applet-specific icons
public/icons/
├── prompt-composer-192.png  # New
├── prompt-composer-512.png  # New
├── opioid-converter-192.png # New
└── opioid-converter-512.png # New
```

Update manifest:

```json
{
  "icons": [
    {
      "src": "/icons/prompt-composer-192.png", // Applet-specific
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

**Benefits:** Visual differentiation, clearer app identity

**2. More Applets**

Follow the established pattern to add new tools:

- Mandelbrot Explorer PWA
- Task Tracker
- Portfolio piece showcases

**3. Theme Variations**

Each applet could have unique theme colors matching its purpose:

- Medical tools → Green
- Creative tools → Purple
- Productivity → Blue

### Advanced Features

**1. Deep Linking & State Restoration**

**Current:** App always opens to `start_url`  
**Enhanced:** Restore app state on launch

```json
{
  "start_url": "/prompt-composer?restored=true",
  "shortcuts": [
    {
      "name": "New Prompt",
      "url": "/prompt-composer?action=new"
    }
  ]
}
```

Implement in app:

```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('restored') === 'true') {
    // Restore from localStorage
    restoreAppState()
  }
  if (params.get('action') === 'new') {
    // Clear form, start fresh
    clearForm()
  }
}, [])
```

**2. Share Target API**

**Goal:** Share content directly into your applets

```json
{
  "share_target": {
    "action": "/prompt-composer/share",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

**User Experience:**

1. User reads article on another site
2. Taps "Share"
3. Sees "Prompt Composer" in share menu
4. Taps it → article text pre-filled in prompt builder

**3. Background Sync**

**Goal:** Queue actions when offline, sync when online

```javascript
// In service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-prompts') {
    event.waitUntil(syncPromptsToServer())
  }
})

// In app
navigator.serviceWorker.ready.then((reg) => {
  reg.sync.register('sync-prompts')
})
```

**4. Push Notifications**

**Current:** iOS doesn't support PWA push notifications  
**Future:** When iOS adds support, implement:

```javascript
// Request permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Subscribe to push service
    registration.pushManager.subscribe({...})
  }
})
```

**Use cases:**

- "Your calculation is ready"
- "New prompt template available"
- "Weekly usage summary"

**5. App Categories**

Help app stores and browsers categorize:

```json
{
  "categories": ["productivity", "utilities", "tools"]
}
```

**Benefits:**

- Better discovery in PWA directories
- Contextual suggestions from browsers
- App store submissions (Microsoft Store, etc.)

**6. Screenshots**

Add screenshots to manifest for richer install experience:

```json
{
  "screenshots": [
    {
      "src": "/screenshots/prompt-composer-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Prompt Builder Interface"
    }
  ]
}
```

**Benefits:**

- Shows users what to expect
- Better install conversion
- App store submissions

### Distribution Enhancements

**1. Microsoft Store (Windows)**

PWAs can be submitted to Microsoft Store:

- No code changes needed
- Automated packaging via PWABuilder
- Wider reach to Windows users
- Store presence and discoverability

**Process:**

```bash
# Visit pwabuilder.com
# 1. Enter URL: https://cooperability.com/prompt-composer
# 2. Generate Windows package
# 3. Submit to Microsoft Store
# 4. Users can install via store
```

**2. Google Play Store (Android - TWA)**

Trusted Web Activities allow PWA distribution via Play Store:

- Requires signing key
- Must pass quality checks
- Better discovery than web-only
- In-app billing possible

**Process:**

```bash
# Use Bubblewrap CLI
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://cooperability.com/icons/prompt-composer.webmanifest
bubblewrap build
# Submit to Play Console
```

**3. PWA Directories**

List in PWA directories for better discovery:

- [PWA Directory](https://pwa-directory.com/)
- [Appscope](https://appsco.pe/)
- [ProgressiveWebApp.store](https://progressivewebapp.store/)

**4. App Badging API**

Show unread count on app icon:

```javascript
// Set badge
navigator.setAppBadge(5) // Shows "5" on icon

// Clear badge
navigator.clearAppBadge()
```

**Use cases:**

- Unread notifications
- Pending calculations
- New content available

---

## Quick Reference

### Command Cheatsheet

```bash
# Development
yarn dev                    # Start dev server
yarn build                  # Build for production

# Testing
open http://localhost:3000/prompt-composer    # Test applet
jq . public/icons/*.webmanifest               # Validate manifest JSON
curl http://localhost:3000/sw.js              # Check service worker

# Validation
ls -la public/icons/*.webmanifest              # List manifests
grep 'rel="manifest"' src/pages/*.tsx          # Find manifest links
```

### File Locations

| File                         | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `public/icons/*.webmanifest` | Manifest files (app identities)              |
| `public/sw.js`               | Compiled service worker (served to browsers) |
| `src/sw.js`                  | Service worker source (edit this)            |
| `scripts/build-sw.mjs`       | Service worker build script                  |
| `src/components/layout.tsx`  | Layout with `skipManifest` prop              |
| `src/pages/*-applet.tsx`     | Applet page components                       |

### Deployment Checklist

```
□ Manifest files valid JSON (run jq validation)
□ All icon paths correct (start with /)
□ Theme colors set appropriately
□ Descriptions clear and concise
□ Service worker rebuilt (yarn build)
□ Tested on staging environment
□ Tested on actual iOS device (required)
□ Tested on actual Android device
□ Lighthouse PWA audit passes (score 90+)
□ Verified offline functionality (if implemented)
□ Updated documentation
```

### Browser Support Matrix

| Feature            | Chrome  | Safari     | Firefox    | Edge    |
| ------------------ | ------- | ---------- | ---------- | ------- |
| Web App Manifest   | ✅ Full | ⚠️ Partial | ✅ Full    | ✅ Full |
| Service Workers    | ✅      | ✅         | ✅         | ✅      |
| Standalone Mode    | ✅      | ✅         | ✅         | ✅      |
| Add to Home Screen | ✅      | ✅         | ⚠️ Limited | ✅      |
| Shortcuts          | ✅      | ❌         | ❌         | ✅      |
| Push Notifications | ✅      | ❌         | ✅         | ✅      |
| Background Sync    | ✅      | ❌         | ❌         | ✅      |

---

## Resources

### Official Documentation

- [Web App Manifests (MDN)](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Install Criteria (web.dev)](https://web.dev/install-criteria/)
- [iOS PWA Support (Apple)](https://developer.apple.com/videos/play/wwdc2018/239/)
- [Serwist Documentation](https://serwist.pages.dev/)

### Testing & Validation

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [PWABuilder](https://www.pwabuilder.com/) - Test, package, and publish PWAs
- [Web Manifest Validator](https://manifest-validator.appspot.com/)

### Learning Resources

- [Your First Progressive Web App (web.dev)](https://web.dev/your-first-pwa/)
- [Progressive Web Apps Training (Google)](https://developers.google.com/web/ilt/pwa)
- [PWA Stats](https://www.pwastats.com/) - Case studies and benefits

---

## Key Takeaways

1. **One Service Worker, Multiple Identities**
   - Efficient: Shared caching infrastructure for all applets
   - Flexible: Each route advertises its own PWA identity

2. **Manifest Precedence is Critical**
   - Browsers use the **first** `<link rel="manifest">` they encounter
   - Solution: Conditional manifests with `skipManifest` prop

3. **iOS Needs Extra Love**
   - Apple's manifest support is incomplete
   - Meta tags bridge the gap for proper naming and behavior

4. **Scope is Everything**
   - **Manifest scope** controls app boundaries (what's "in-app")
   - **Service worker scope** controls caching (what can be cached)
   - They're independent concepts!

5. **Test on Real Devices**
   - Simulators/emulators don't accurately reflect PWA behavior
   - iOS and Android testing both required
   - Desktop testing useful but not sufficient

6. **HTTPS is Mandatory**
   - Service workers require secure origins
   - Localhost is exempt for development
   - Production must be HTTPS

7. **Updates Require Reinstallation**
   - Manifest changes don't auto-update for installed users
   - Users must delete and re-add app
   - Service worker updates happen automatically

---

**Your portfolio is now a comprehensive suite of installable web apps!** 🚀

Each tool can be promoted as a standalone utility while maintaining the efficiency of a single codebase. This demonstrates the power of modern web technology and progressive enhancement philosophy: **start with a great website, enhance it into installable apps**.
