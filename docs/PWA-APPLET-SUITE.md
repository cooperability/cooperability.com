# PWA Applet Suite Architecture

## Overview
This document explains how the Co-Operability portfolio website creates a **suite of installable PWA applets** - individual tools that can be added to a mobile home screen with their own names and identities while sharing the same icon set and service worker infrastructure.

---

## 🎯 The Goal

Instead of having a single "Co-Operability" app, users can install:
- **"Prompt Composer"** - from `/prompt-composer`
- **"Opioid Converter"** - from `/opioid-converter`
- **"Co-Operability"** - the main portfolio site from `/`

Each appears as a separate app on the home screen with its own name, but they all:
- ✅ Use the same icon set (shared brand identity)
- ✅ Share the same service worker (efficient caching)
- ✅ Maintain their specific identity when installed

---

## 🏗️ Architecture Components

### 1. **Web App Manifests** (The Identity Cards)

Each applet has its own manifest file in `public/icons/`:

```
public/icons/
├── site.webmanifest           # Main portfolio site
├── prompt-composer.webmanifest # Prompt Composer applet
└── opioid-converter.webmanifest # Opioid Converter applet
```

**What each manifest defines:**

| Property | Purpose | Example |
|----------|---------|---------|
| `name` | Full app name shown during install | "Prompt Composer" |
| `short_name` | Name shown under icon (limited space) | "Composer" |
| `description` | What the app does | "Research-backed prompt builder" |
| `start_url` | URL that opens when app launches | "/prompt-composer" |
| `scope` | URLs considered "part of this app" | "/prompt-composer" |
| `display` | How app appears | "standalone" (no browser UI) |
| `theme_color` | Browser chrome color | "#3b82f6" (blue) |
| `icons` | App icons (shared across all apps) | References to `/icons/*.png` |

### 2. **Manifest Links** (The Connection)

Each page includes a specific `<link rel="manifest">` in its `<Head>`:

**In `src/pages/prompt-composer.tsx`:**
```tsx
<Head>
  {/* This tells the browser: "Use the Prompt Composer identity for THIS page" */}
  <link rel="manifest" href="/icons/prompt-composer.webmanifest" />
  
  {/* iOS-specific naming (Apple doesn't fully support manifest files) */}
  <meta name="apple-mobile-web-app-title" content="Prompt Composer" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#3b82f6" />
</Head>
```

**In `src/pages/opioid-converter.tsx`:**
```tsx
<Head>
  <link rel="manifest" href="/icons/opioid-converter.webmanifest" />
  <meta name="apple-mobile-web-app-title" content="Opioid Converter" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#10b981" />
</Head>
```

### 3. **Global Layout** (The Default)

The main `Layout` component (`src/components/layout.tsx`) links to the default site manifest:

```tsx
<Head>
  <link rel="manifest" href="/icons/site.webmanifest" />
  <meta name="apple-mobile-web-app-title" content="Co-Operability" />
</Head>
```

**How manifest precedence works:**
- When a page includes its own `<link rel="manifest">`, it **overrides** the global one
- The browser uses the **last** manifest link it encounters
- Page-specific manifests win over layout manifests

### 4. **Service Worker** (Shared Infrastructure)

The service worker (`public/sw.js`) has a **scope of `/`** which means:
- ✅ It caches ALL routes (`/`, `/prompt-composer`, `/opioid-converter`)
- ✅ All applets benefit from offline capability
- ✅ No duplication - one worker serves everything

**Key insight:** Manifest scope and service worker scope are INDEPENDENT:
- **Manifest scope** (`"/prompt-composer"`) controls app identity and what URLs open within the app
- **Service worker scope** (`"/"`) controls what URLs can be cached and served offline

### 5. **Shortcuts** (Quick Access)

The main site manifest includes a `shortcuts` array:

```json
{
  "shortcuts": [
    {
      "name": "Prompt Composer",
      "url": "/prompt-composer"
    },
    {
      "name": "Opioid Converter", 
      "url": "/opioid-converter"
    }
  ]
}
```

**What this does:**
- On Android: Long-press the main app icon → see shortcuts to jump directly to applets
- On iOS: Not currently supported (as of iOS 17)
- Acts as a launcher menu for your app suite

---

## 📱 User Experience Flow

### Scenario 1: Installing the Prompt Composer

1. User visits `https://cooperability.com/prompt-composer` on Safari
2. Browser reads the page and finds `<link rel="manifest" href="/icons/prompt-composer.webmanifest">`
3. Safari uses that manifest to understand this is the "Prompt Composer" app
4. User taps **Share** → **Add to Home Screen**
5. Installation dialog shows:
   - Icon: Your shared icon set
   - Name: "Prompt Composer" (from manifest `name`)
6. App appears on home screen as "Composer" (from manifest `short_name`)
7. When launched:
   - Opens to `/prompt-composer` (from manifest `start_url`)
   - Displays in standalone mode (no browser UI)
   - Service worker enables offline use

### Scenario 2: Installing the Main Site

1. User visits `https://cooperability.com/`
2. Browser finds the global manifest from `Layout` component
3. Installs as "Co-Operability"
4. Android users can long-press icon → see shortcuts to jump to applets

### Scenario 3: Installing Multiple Applets

- Each installation creates a **separate app icon** on the home screen
- Each has its own name
- All share the same visual icon (brand consistency)
- Browser treats them as distinct apps

---

## 🛠️ How to Add a New Applet

Want to add a new tool (e.g., "Task Tracker") to your suite? Follow these steps:

### Step 1: Create a manifest file

**File:** `public/icons/task-tracker.webmanifest`
```json
{
  "name": "Task Tracker",
  "short_name": "Tasks",
  "description": "Simple task management tool",
  "start_url": "/task-tracker",
  "scope": "/task-tracker",
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

### Step 2: Update the page component

**File:** `src/pages/task-tracker.tsx`
```tsx
import Head from 'next/head'
import Layout from '@/src/components/layout'
import TaskTracker from '@/src/components/TaskTracker'

const TaskTrackerPage = () => {
  return (
    <Layout home={false}>
      <Head>
        <title>Task Tracker | Co-Operability</title>
        <meta name="description" content="Simple task management tool" />
        
        {/* PWA-specific manifest */}
        <link rel="manifest" href="/icons/task-tracker.webmanifest" />
        
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-title" content="Task Tracker" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#8b5cf6" />
      </Head>
      
      <TaskTracker />
    </Layout>
  )
}

export default TaskTrackerPage
```

### Step 3: Add to shortcuts (optional)

**File:** `public/icons/site.webmanifest`
```json
{
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
      "name": "Task Tracker",
      "url": "/task-tracker"
    }
  ]
}
```

### Step 4: Test

```bash
yarn dev
# Visit http://localhost:3000/task-tracker
# Check DevTools → Application → Manifest
# Verify name, icons, start_url are correct
```

---

## 🧪 Testing Your PWA Applets

### Browser DevTools Checklist

1. **Chrome/Edge DevTools:**
   - Navigate to your applet page
   - Open DevTools → **Application** tab
   - Click **Manifest** in sidebar
   - Verify:
     - ✅ Correct manifest file is loaded
     - ✅ Name/short_name are applet-specific
     - ✅ Icons are present
     - ✅ Start URL matches the applet route

2. **Service Worker Verification:**
   - DevTools → **Application** → **Service Workers**
   - Should show: "This page is controlled by a service worker"
   - Scope should be "/"

3. **Installability:**
   - Chrome shows install icon in address bar if all criteria met
   - Click to test installation flow

### Mobile Testing (iOS Safari)

1. Visit applet URL on iPhone
2. Tap **Share** button
3. Tap **Add to Home Screen**
4. Verify:
   - ✅ Shows correct applet name (not "Co-Operability")
   - ✅ Shows your icon
   - ✅ Preview shows correct page
5. After installing:
   - Tap the icon
   - Should open directly to the applet (no navigation needed)
   - Should display in standalone mode (no Safari UI)

### Mobile Testing (Android Chrome)

1. Visit applet URL
2. Look for "Add to Home Screen" banner or menu option
3. Verify same criteria as iOS

---

## 🎨 Choosing Theme Colors

Each applet manifest has a `theme_color` that controls the browser chrome:

```json
{
  "theme_color": "#3b82f6"  // This colors the status bar and browser UI
}
```

**Current theme colors:**
- **Main site:** `#ffffff` (white) - neutral, professional
- **Prompt Composer:** `#3b82f6` (blue-500) - matches AI/tech theme
- **Opioid Converter:** `#10b981` (emerald-500) - medical/healthcare green

**Best practices:**
- Match your app's primary brand color
- Ensure good contrast with white text (status bar readability)
- Test on both iOS and Android

---

## 🔍 Troubleshooting

### Problem: "Add to Home Screen" shows wrong name

**Cause:** Manifest not being read correctly

**Solutions:**
1. Check `<link rel="manifest">` is in the page's `<Head>`
2. Verify manifest file exists at the specified path
3. Clear browser cache and reload
4. Check DevTools → Application → Manifest for errors

### Problem: App opens in browser instead of standalone

**Cause:** `display` mode not set or `scope` mismatch

**Solutions:**
1. Ensure manifest has `"display": "standalone"`
2. Verify `start_url` is within `scope`
3. Re-install the app (removing old one first)

### Problem: Icons not showing up

**Cause:** Icon paths incorrect or sizes missing

**Solutions:**
1. Verify icon paths start with `/` (e.g., `/icons/...`)
2. Ensure at least 192x192 and 512x512 sizes are included
3. Check icon files actually exist in `public/icons/`

### Problem: Service worker not activating

**Cause:** HTTPS required, or SW registration failed

**Solutions:**
1. PWAs require HTTPS (except localhost)
2. Check console for SW registration errors
3. DevTools → Application → Service Workers → check status

---

## 📊 Architecture Diagram

```
User visits /prompt-composer
         ↓
Next.js renders page
         ↓
Page's <Head> includes:
- <link rel="manifest" href="/icons/prompt-composer.webmanifest">
- Apple meta tags
         ↓
Browser reads manifest:
{
  "name": "Prompt Composer",
  "start_url": "/prompt-composer",
  "scope": "/prompt-composer"
}
         ↓
User taps "Add to Home Screen"
         ↓
iOS/Android creates app icon with name "Prompt Composer"
         ↓
User taps icon on home screen
         ↓
Opens /prompt-composer in standalone mode
         ↓
Service worker (scope: "/") handles caching
```

---

## 🚀 Future Enhancements

### Custom Icons Per Applet

Currently all applets share the same icon. To give each its own:

1. Create applet-specific icons:
   ```
   public/icons/
   ├── prompt-composer-192.png
   ├── prompt-composer-512.png
   ├── opioid-converter-192.png
   └── opioid-converter-512.png
   ```

2. Update manifests to reference specific icons:
   ```json
   {
     "icons": [
       {
         "src": "/icons/prompt-composer-192.png",
         "sizes": "192x192"
       }
     ]
   }
   ```

### Deep Linking

Add `share_target` to manifests to allow sharing content directly into your applets:

```json
{
  "share_target": {
    "action": "/prompt-composer/share",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text"
    }
  }
}
```

### App Categories

Help app stores categorize your applets:

```json
{
  "categories": ["productivity", "utilities"]
}
```

---

## 📚 Resources

- [Web App Manifests (MDN)](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Install Criteria](https://web.dev/install-criteria/)
- [Service Worker Scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/scope)
- [iOS PWA Support](https://developer.apple.com/videos/play/wwdc2018/239/)

---

## 💡 Key Takeaways

1. **One service worker, multiple app identities** - Efficient and maintainable
2. **Page-level manifests override global ones** - Gives each route its own identity
3. **iOS needs extra meta tags** - Apple's PWA support is limited, meta tags bridge gaps
4. **Shortcuts enhance main app** - Acts as a launcher for your suite
5. **Scope controls app boundaries** - Keep it tight for focused experiences

Your portfolio is now a **comprehensive suite of installable web apps**! 🎉
