import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { injectManifest } from '@serwist/build'
import webpack from 'webpack'

// injectManifest only fills in the precache list. src/sw.js imports serwist,
// and a classic service worker cannot run an import statement, so without
// this step the worker threw on line 1 and never installed on any page.
function bundle() {
  return new Promise((done, fail) => {
    webpack(
      {
        mode: 'production',
        target: 'webworker',
        entry: resolve('src/sw.js'),
        output: { path: resolve('.next'), filename: 'sw-bundle.js' },
      },
      (err, stats) => {
        if (err || stats.hasErrors()) fail(err ?? stats.toString('errors-only'))
        else done()
      }
    )
  })
}

async function main() {
  await bundle()

  // Precaching the game's HTML is what lets it launch from the home screen
  // with no network. The build id revisions it so every deploy refetches it.
  const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim()

  // Glob paths are relative to globDirectory, but precache entries are URLs the
  // browser will request. Everything Next emits under `.next/static` is served
  // from `/_next/static`, so without modifyURLPrefix every entry 404s.
  //
  // Scoped to `static/` on purpose: `.next/server` is server-only output and
  // `.next/cache` is build cache, neither of which is reachable over HTTP.
  const { count, size, warnings } = await injectManifest({
    swSrc: '.next/sw-bundle.js',
    swDest: 'public/sw.js',
    globDirectory: '.next',
    globPatterns: ['static/**/*.{js,css,svg,png,webp,woff2}'],
    modifyURLPrefix: { 'static/': '/_next/static/' },
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    additionalPrecacheEntries: [{ url: '/demos/game', revision: buildId }],
  })
  if (warnings?.length) {
    for (const w of warnings) console.warn(w)
  }
  console.log(`Serwist injected ${count} files, totaling ${size} bytes.`)
  console.log(`Generated public/sw.js from ${process.cwd()}/src/sw.js`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
