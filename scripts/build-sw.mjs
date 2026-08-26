import { injectManifest } from '@serwist/build'

async function main() {
  // Glob paths are relative to globDirectory, but precache entries are URLs the
  // browser will request. Everything Next emits under `.next/static` is served
  // from `/_next/static`, so without modifyURLPrefix every entry 404s.
  //
  // Scoped to `static/` on purpose: `.next/server` is server-only output and
  // `.next/cache` is build cache, neither of which is reachable over HTTP.
  const { count, size, warnings } = await injectManifest({
    swSrc: 'src/sw.js',
    swDest: 'public/sw.js',
    globDirectory: '.next',
    globPatterns: ['static/**/*.{js,css,svg,png,webp,woff2}'],
    modifyURLPrefix: { 'static/': '/_next/static/' },
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
