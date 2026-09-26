import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { metadata } from '../../app/demos/game/page'
import { splashImages } from '../../components/game/splash'

/**
 * iOS never reports a bad launch image or icon: a missing file, or one a pixel
 * off its media query, just shows a blank screen on launch. So every file the
 * page and manifest point at must exist at exactly the size it claims.
 */

const PUBLIC = join(process.cwd(), 'public')

function pngSize(url: string): [number, number] {
  const buf = readFileSync(join(PUBLIC, url))
  // PNG signature (8) + IHDR length and type (8), then width and height.
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
}

function mediaSize(media: string): [number, number] {
  const n = (key: string) =>
    Number(media.match(new RegExp(`${key}: (\\d+)`))![1])
  const ratio = n('-webkit-device-pixel-ratio')
  const portrait = [n('device-width') * ratio, n('device-height') * ratio]
  return media.includes('landscape')
    ? [portrait[1], portrait[0]]
    : [portrait[0], portrait[1]]
}

describe('game home-screen assets', () => {
  const startup = splashImages()

  it('covers every device in both orientations with a distinct file', () => {
    expect(startup.length).toBeGreaterThanOrEqual(24)
    expect(new Set(startup.map((s) => s.media)).size).toBe(startup.length)
  })

  it.each(startup.map((s) => [s.url, s.media]))(
    '%s matches its media query',
    (url, media) => {
      expect(pngSize(url)).toEqual(mediaSize(media))
    }
  )

  it('has every manifest icon at its declared size', () => {
    const manifest = JSON.parse(
      readFileSync(join(PUBLIC, 'icons/game.webmanifest'), 'utf8')
    ) as { icons: { src: string; sizes: string }[] }
    for (const { src, sizes } of manifest.icons) {
      const [w, h] = sizes.split('x').map(Number)
      expect([src, pngSize(src)]).toEqual([src, [w, h]])
    }
  })

  it('scopes the manifest to the game so it installs as its own app', () => {
    const manifest = JSON.parse(
      readFileSync(join(PUBLIC, 'icons/game.webmanifest'), 'utf8')
    )
    expect(manifest.start_url).toBe('/demos/game')
    expect(manifest.scope).toBe('/demos/game')
    expect(metadata.manifest).toBe('/icons/game.webmanifest')
  })
})
