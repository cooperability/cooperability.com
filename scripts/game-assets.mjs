// Generates the game's home-screen icons and iOS launch images into
// public/icons/game/. Run by hand after changing the art or the device list:
//   node scripts/game-assets.mjs
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = 'public/icons/game'
const SHELL = '#1b1b22'

const screens = JSON.parse(
  await readFile('src/components/game/splash-screens.json', 'utf8')
)

// Artwork stays inside the central 80% so the maskable crop never clips it.
const glyph = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="26" y="14" width="48" height="72" rx="6" fill="#c9c6bd"/>
  <rect x="31" y="19" width="38" height="30" rx="2" fill="#0f380f"/>
  <rect x="34" y="22" width="32" height="24" fill="#9bbc0f"/>
  <rect x="39" y="58" width="4" height="12" fill="#2b2b33"/>
  <rect x="35" y="62" width="12" height="4" fill="#2b2b33"/>
  <circle cx="58" cy="67" r="3.2" fill="#9a2257"/>
  <circle cx="64" cy="62" r="3.2" fill="#9a2257"/>
</svg>`

function icon(size, { padded = false } = {}) {
  const art = Math.round(size * (padded ? 0.8 : 1))
  return sharp({
    create: { width: size, height: size, channels: 4, background: SHELL },
  }).composite([
    {
      input: Buffer.from(
        glyph.replace('<svg ', `<svg width="${art}" height="${art}" `)
      ),
    },
  ])
}

await mkdir(OUT, { recursive: true })

await icon(180).png().toFile(`${OUT}/apple-touch-icon.png`)
await icon(192).png().toFile(`${OUT}/icon-192.png`)
await icon(512).png().toFile(`${OUT}/icon-512.png`)
await icon(512, { padded: true }).png().toFile(`${OUT}/icon-maskable-512.png`)

for (const { width, height, ratio } of screens) {
  for (const [w, h] of [
    [width * ratio, height * ratio],
    [height * ratio, width * ratio],
  ]) {
    const art = Math.round(Math.min(w, h) * 0.4)
    const svg = glyph.replace('<svg ', `<svg width="${art}" height="${art}" `)
    await sharp({
      create: { width: w, height: h, channels: 4, background: SHELL },
    })
      .composite([{ input: Buffer.from(svg) }])
      .png({ palette: true })
      .toFile(`${OUT}/splash-${w}x${h}.png`)
  }
}

console.log(`Wrote ${4 + screens.length * 2} images to ${OUT}`)
