# PWA Applet Testing Checklist

## Quick Test Guide

### 🖥️ Desktop Testing (Chrome/Edge)

#### 1. Test Prompt Composer Manifest
```
✅ Navigate to: http://localhost:3000/prompt-composer
```

**In DevTools (F12):**
1. Go to **Application** tab
2. Click **Manifest** in left sidebar
3. **Verify:**
   - [ ] Name: "Prompt Composer"
   - [ ] Short name: "Composer"
   - [ ] Start URL: "/prompt-composer"
   - [ ] Theme color: "#3b82f6" (blue)
   - [ ] Icons: All 4 icons visible in preview

#### 2. Test Opioid Converter Manifest
```
✅ Navigate to: http://localhost:3000/opioid-converter
```

**In DevTools:**
1. Same steps as above
2. **Verify:**
   - [ ] Name: "Opioid Converter"
   - [ ] Short name: "Opioid Calc"
   - [ ] Start URL: "/opioid-converter"
   - [ ] Theme color: "#10b981" (green)
   - [ ] Icons: All 4 icons visible

#### 3. Test Main Site Manifest
```
✅ Navigate to: http://localhost:3000/
```

**In DevTools:**
1. Same steps
2. **Verify:**
   - [ ] Name: "Co-Operability"
   - [ ] Shortcuts: Shows 2 shortcuts (Prompt Composer, Opioid Converter)

#### 4. Service Worker Check (All Pages)
```
✅ Navigate to any page
```

**In DevTools → Application → Service Workers:**
- [ ] Status: "activated and is running" (or will be after build)
- [ ] Scope: "/" 
- [ ] Source: /sw.js

---

### 📱 iOS Testing (Safari - MOST IMPORTANT)

#### Test on Actual iPhone (Required for true PWA testing)

**Step 1: Test Prompt Composer**
1. Open Safari on iPhone
2. Navigate to: `https://cooperability.com/prompt-composer` (after deployment)
   - Or use ngrok/tunneling for localhost: `https://your-tunnel-url.ngrok.io/prompt-composer`
3. Tap **Share** button (square with arrow)
4. Scroll down, tap **Add to Home Screen**
5. **VERIFY:** Name shows "Prompt Composer" (NOT "Co-Operability")
6. Tap **Add**
7. **CHECK:** Icon on home screen is labeled "Prompt Composer"
8. Tap icon to launch
9. **VERIFY:**
   - Opens directly to Prompt Composer (no URL bar visible)
   - Status bar color matches theme color
   - No Safari UI (true standalone mode)

**Step 2: Test Opioid Converter**
1. Same steps as above but with `/opioid-converter`
2. **VERIFY:** Name shows "Opioid Converter"
3. Install and launch
4. **CHECK:** Different app from Prompt Composer

**Step 3: Test Both Installed**
- [ ] Both icons appear on home screen
- [ ] Each has its own name
- [ ] Each opens to its own URL
- [ ] Both use the same icon image (brand consistency)

---

### 🤖 Android Testing (Chrome)

#### Test on Android Device

**Step 1: Test Prompt Composer**
1. Open Chrome on Android
2. Navigate to applet URL
3. Look for "Add to Home screen" banner or:
   - Tap menu (⋮) → **Add to Home screen**
4. **VERIFY:** Name shows "Prompt Composer"
5. Tap **Add**
6. Launch from home screen
7. **CHECK:** Opens in standalone mode

**Step 2: Long-Press Main App**
1. Install main site first
2. Long-press the "Co-Operability" icon
3. **VERIFY:** Context menu shows shortcuts:
   - "Prompt Composer"
   - "Opioid Converter"
4. Tap a shortcut
5. **CHECK:** Jumps directly to that applet

---

## 🛠️ Common Issues & Fixes

### Issue: DevTools shows wrong manifest

**Fix:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear cache: DevTools → Network tab → Check "Disable cache"
3. Check manifest syntax: Run through JSON validator

### Issue: Icons not appearing

**Check:**
```bash
# Verify files exist
ls -la public/icons/
```

Should see:
- `web-app-manifest-192x192.png`
- `web-app-manifest-512x512.png`
- `apple-touch-icon.png`
- `favicon-96x96.png`

### Issue: iOS still shows old name

**Fix:**
1. Delete the app from home screen
2. Close Safari completely (swipe up from app switcher)
3. Reopen Safari
4. Navigate to applet URL
5. Re-add to home screen

### Issue: Service worker not working

**Remember:** 
- Service workers require HTTPS (or localhost)
- They don't work in incognito/private mode on some browsers
- Changes require a full rebuild and redeployment

---

## 🚀 Deployment Checklist

Before pushing to production:

- [ ] All manifest files are valid JSON
- [ ] All icon paths are correct (start with `/`)
- [ ] Theme colors are set appropriately
- [ ] Descriptions are clear and concise
- [ ] Service worker is rebuilt (`yarn build`)
- [ ] Test on staging environment
- [ ] Test installation on iOS device
- [ ] Test installation on Android device
- [ ] Verify offline functionality (if implemented)

---

## 📊 Testing Matrix

| Feature | Chrome Desktop | Safari iOS | Chrome Android | Status |
|---------|----------------|------------|----------------|--------|
| Manifest loaded | ✅ | ✅ | ✅ | |
| Correct name | ✅ | ✅ | ✅ | |
| Icons display | ✅ | ✅ | ✅ | |
| Standalone mode | ✅ | ✅ | ✅ | |
| Theme color | ✅ | ⚠️ (Limited) | ✅ | |
| Shortcuts | ✅ | ❌ (Not supported) | ✅ | |
| Service worker | ✅ | ✅ | ✅ | |

---

## 🎯 Quick Verification Commands

### Check manifest files exist
```bash
ls -la public/icons/*.webmanifest
```

Expected output:
```
opioid-converter.webmanifest
prompt-composer.webmanifest
site.webmanifest
```

### Validate JSON syntax
```bash
# Install jq if not already installed
# macOS: brew install jq
# Windows: choco install jq

jq . public/icons/prompt-composer.webmanifest
jq . public/icons/opioid-converter.webmanifest
jq . public/icons/site.webmanifest
```

If valid, they'll pretty-print. If invalid, you'll see syntax errors.

### Check page includes manifest link
```bash
# Search for manifest links in page files
grep -n "rel=\"manifest\"" src/pages/prompt-composer.tsx
grep -n "rel=\"manifest\"" src/pages/opioid-converter.tsx
```

Expected: Should find the links we added

---

## 💡 Pro Tips

1. **Use Real Device Testing:** Simulators/emulators don't always reflect true PWA behavior
2. **Test Offline:** After installing, turn on airplane mode and launch the app
3. **Check Network Tab:** Verify service worker is serving cached resources
4. **Use Lighthouse:** Run PWA audits in DevTools for automated checks
5. **Test Updates:** After changing manifests, users may need to reinstall

---

## 🐛 Debug Logging

Add this to your page to debug manifest loading:

```javascript
// Temporary debug code - add to page component
useEffect(() => {
  const manifestLink = document.querySelector('link[rel="manifest"]')
  console.log('Active manifest:', manifestLink?.getAttribute('href'))
  
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistration().then(reg => {
      console.log('SW registered:', !!reg)
      console.log('SW scope:', reg?.scope)
    })
  }
}, [])
```

---

Happy testing! 🎉

**Next Steps:**
1. Start dev server: `yarn dev`
2. Test each applet URL in Chrome DevTools
3. Deploy to staging
4. Test on real iOS device
5. Deploy to production
6. Celebrate your app suite! 🎊
