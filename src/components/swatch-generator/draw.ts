import { METALS, type Metal, type Swatch } from './palette'

export type Card = {
  // Undefined when seasonal analysis is switched off.
  season?: string
  title: string
  aka?: string
  summary: string
  traits: { label: string; value: string }[]
  features: { label: string; name: string; hex: string }[]
  best?: Swatch[]
  aesthetic?: {
    name: string
    blurb: string
    featured: Swatch[]
    ratio: readonly [Swatch, Swatch, Swatch]
  }
  neutrals?: { swatches: Swatch[]; metals: readonly Metal[] }
  avoid?: Swatch[]
  harmonies?: Swatch[]
}

// Layout is in card units. The bitmap is drawn at 2x so the PDF prints at
// 288 dpi on its 7.5-inch-wide page.
const W = 1080
const SCALE = 2
const M = 72
const GAP = 20
const INK = '#1F1B18'
const MUTED = '#6B635C'
const PAPER = '#FBF8F4'
const LINE = '#DDD5CB'
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'

type Ctx = CanvasRenderingContext2D

function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  size: number,
  {
    color = INK,
    weight = 400,
    font = SANS,
    align = 'left' as CanvasTextAlign,
    maxWidth = Infinity,
  } = {}
) {
  // Shrink rather than clip names longer than their column.
  let px = size
  do {
    ctx.font = `${weight} ${px}px ${font}`
    px -= 1
  } while (ctx.measureText(str).width > maxWidth && px > 10)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.fillText(str, x, y)
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r = 14) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function heading(ctx: Ctx, label: string, y: number) {
  ctx.letterSpacing = '3px'
  text(ctx, label.toUpperCase(), M, y + 22, 22, { weight: 700 })
  const end = M + ctx.measureText(label.toUpperCase()).width + 24
  ctx.letterSpacing = '0px'
  ctx.fillStyle = LINE
  ctx.fillRect(end, y + 14, W - M - end, 2)
  return y + 52
}

// A grid of labelled color chips. Returns the y below it.
function chips(
  ctx: Ctx,
  swatches: Swatch[],
  y: number,
  { cols = swatches.length, h = 120, hex = true, struck = false } = {}
) {
  const w = (W - 2 * M - (cols - 1) * GAP) / cols
  const rowH = h + (hex ? 76 : 50)
  swatches.forEach((sw, i) => {
    const x = M + (i % cols) * (w + GAP)
    const top = y + Math.floor(i / cols) * rowH
    box(ctx, x, top, w, h)
    ctx.fillStyle = sw.hex
    ctx.fill()
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1.5
    ctx.stroke()
    if (struck) {
      ctx.save()
      box(ctx, x, top, w, h)
      ctx.clip()
      ctx.beginPath()
      ctx.moveTo(x, top + h)
      ctx.lineTo(x + w, top)
      // A light halo under a dark line reads on both black and white chips.
      ctx.strokeStyle = PAPER
      ctx.lineWidth = 10
      ctx.stroke()
      ctx.strokeStyle = MUTED
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.restore()
    }
    text(ctx, sw.name, x, top + h + 32, 22, { weight: 600, maxWidth: w })
    if (hex)
      text(ctx, sw.hex, x, top + h + 60, 19, { color: MUTED, maxWidth: w })
  })
  return y + Math.ceil(swatches.length / cols) * rowH
}

function layout(ctx: Ctx, card: Card) {
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, W, ctx.canvas.height / SCALE)
  ctx.textBaseline = 'alphabetic'

  ctx.letterSpacing = '4px'
  text(ctx, 'PERSONAL COLOR SWATCH', M, M + 20, 22, {
    color: MUTED,
    weight: 600,
  })
  ctx.letterSpacing = '0px'
  text(ctx, card.title, M, M + 112, 84, {
    weight: 700,
    font: SERIF,
    maxWidth: W - 2 * M,
  })
  const summary = card.aka
    ? `${card.summary} Also called ${card.aka}.`
    : card.summary
  text(ctx, summary, M, M + 166, 30, { color: MUTED, maxWidth: W - 2 * M })
  text(
    ctx,
    card.traits.map((t) => `${t.label}: ${t.value}`).join('     '),
    M,
    M + 212,
    24,
    { weight: 600, maxWidth: W - 2 * M }
  )

  // The three picked features.
  let y = M + 256
  const colW = (W - 2 * M) / 3
  card.features.forEach((f, i) => {
    const cx = M + i * colW + 40
    ctx.beginPath()
    ctx.arc(cx, y + 40, 40, 0, Math.PI * 2)
    ctx.fillStyle = f.hex
    ctx.fill()
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.letterSpacing = '2px'
    text(ctx, f.label.toUpperCase(), cx + 56, y + 32, 18, {
      color: MUTED,
      weight: 600,
    })
    ctx.letterSpacing = '0px'
    text(ctx, f.name, cx + 56, y + 64, 24, {
      weight: 600,
      maxWidth: colW - 104,
    })
  })
  y += 128

  if (card.best) {
    y = heading(ctx, 'Best colors', y)
    y = chips(ctx, card.best, y, { cols: 5, h: 130 }) + 24
  }

  if (card.aesthetic) {
    const a = card.aesthetic
    y = heading(ctx, `Aesthetic: ${a.name}`, y)
    text(ctx, a.blurb, M, y + 8, 24, { color: MUTED, maxWidth: W - 2 * M })
    y = chips(ctx, a.featured, y + 32, { h: 150 })
    // 60/30/10: base neutral, main color, accent.
    const shares = [0.6, 0.3, 0.1]
    let x = M
    ctx.save()
    box(ctx, M, y, W - 2 * M, 56)
    ctx.clip()
    a.ratio.forEach((sw, i) => {
      const w = (W - 2 * M) * shares[i]
      ctx.fillStyle = sw.hex
      ctx.fillRect(x, y, w, 56)
      x += w
    })
    ctx.restore()
    box(ctx, M, y, W - 2 * M, 56)
    ctx.strokeStyle = LINE
    ctx.lineWidth = 1.5
    ctx.stroke()
    text(
      ctx,
      a.ratio
        .map((sw, i) => `${Math.round(shares[i] * 100)}% ${sw.name}`)
        .join('   '),
      M,
      y + 92,
      22,
      { color: MUTED, maxWidth: W - 2 * M }
    )
    y += 128
  }

  if (card.harmonies) {
    y = heading(ctx, 'Harmonies from your features', y)
    y = chips(ctx, card.harmonies, y, { h: 100 }) + 24
  }

  if (card.neutrals) {
    const { swatches } = card.neutrals
    y = heading(ctx, swatches.length ? 'Neutrals and metals' : 'Metals', y)
    if (swatches.length) y = chips(ctx, swatches, y, { h: 100 })
    card.neutrals.metals.forEach((metal, i) => {
      const cx = M + 36 + i * 300
      const [dark, light] = METALS[metal]
      const g = ctx.createLinearGradient(cx - 36, y - 36, cx + 36, y + 36)
      g.addColorStop(0, light)
      g.addColorStop(0.5, dark)
      g.addColorStop(1, light)
      ctx.beginPath()
      ctx.arc(cx, y + 36, 36, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
      // Platinum's highlight nearly matches the paper without an outline.
      ctx.strokeStyle = MUTED
      ctx.lineWidth = 1.5
      ctx.stroke()
      text(ctx, metal, cx + 52, y + 45, 24, { weight: 600 })
    })
    y += 120
  }

  if (card.avoid) {
    y = heading(ctx, 'Colors to avoid', y)
    y = chips(ctx, card.avoid, y, { h: 90, hex: false, struck: true }) + 24
  }

  ctx.fillStyle = LINE
  ctx.fillRect(M, y, W - 2 * M, 2)
  text(ctx, 'cooperability.com/demos/swatch-generator', M, y + 44, 20, {
    color: MUTED,
  })
  return y + 44 + M - 20
}

let measurer: Ctx | null | undefined

// A first pass on a 1x1 canvas finds the height the enabled sections use, so
// the only full-size bitmap is the target. iOS Safari caps total canvas
// memory, and a second full-size scratch per redraw could exhaust it.
export function drawCard(target: HTMLCanvasElement, card: Card) {
  measurer ??= document.createElement('canvas').getContext('2d')
  const out = target.getContext('2d')
  if (!measurer || !out) return
  const h = layout(measurer, card)
  target.width = W * SCALE
  target.height = Math.ceil(h * SCALE)
  out.scale(SCALE, SCALE)
  layout(out, card)
}
