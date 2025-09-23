import { injectManifest } from '@serwist/build'

async function main() {
  const { count, size, warnings } = await injectManifest({
    swSrc: 'src/sw.js',
    swDest: 'public/sw.js',
    globDirectory: '.next',
    globPatterns: ['**/*.{html,js,css,svg,png,webp,woff2}'],
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
