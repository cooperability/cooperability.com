import { Serwist } from 'serwist'

// Service worker source in plain JavaScript. This file is used by
// scripts/build-sw.mjs (Serwist injectManifest) to generate public/sw.js.

const serwist = new Serwist({
  // __SW_MANIFEST will be injected at build time by @serwist/build
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
})

serwist.addEventListeners()
