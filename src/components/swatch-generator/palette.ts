// Seasonal color analysis. Each feature carries a hand-assigned warmth
// (-1 cool to +1 warm) and, for eyes and hair, a clarity (-1 muted to +1
// clear). Depth and contrast come from the hex values themselves.

export type Feature = { name: string; hex: string; warmth: number }
export type ClearFeature = Feature & { clarity: number }
export type Swatch = { name: string; hex: string }

export const EYES: ClearFeature[] = [
  { name: 'Black-brown', hex: '#2B1A12', warmth: 0, clarity: 0.5 },
  { name: 'Dark brown', hex: '#3E2516', warmth: 0.3, clarity: 0.3 },
  { name: 'Medium brown', hex: '#6B4423', warmth: 0.5, clarity: 0 },
  { name: 'Light brown', hex: '#8B5A2B', warmth: 0.6, clarity: -0.1 },
  { name: 'Amber', hex: '#B07A2A', warmth: 0.9, clarity: 0.3 },
  { name: 'Hazel', hex: '#8E7A3E', warmth: 0.5, clarity: -0.5 },
  { name: 'Green', hex: '#4F7D4A', warmth: 0.2, clarity: 0.2 },
  { name: 'Emerald green', hex: '#2E8B57', warmth: 0, clarity: 0.7 },
  { name: 'Gray-green', hex: '#7C8C7A', warmth: -0.2, clarity: -0.7 },
  { name: 'Turquoise', hex: '#4AA3A0', warmth: 0.2, clarity: 0.6 },
  { name: 'Bright blue', hex: '#2F6FD1', warmth: -0.6, clarity: 0.9 },
  { name: 'Medium blue', hex: '#4F7AB5', warmth: -0.5, clarity: 0.2 },
  { name: 'Light blue', hex: '#8DB3D9', warmth: -0.4, clarity: 0.1 },
  { name: 'Blue-gray', hex: '#7D8FA3', warmth: -0.5, clarity: -0.6 },
  { name: 'Gray', hex: '#8A8F95', warmth: -0.4, clarity: -0.4 },
]

export const SKIN: Feature[] = [
  { name: 'Porcelain, cool', hex: '#F6E3DC', warmth: -0.8 },
  { name: 'Fair, pink undertone', hex: '#F1D0C4', warmth: -0.6 },
  { name: 'Fair, neutral', hex: '#F0D5BE', warmth: 0 },
  { name: 'Fair, peach undertone', hex: '#F3D2B0', warmth: 0.6 },
  { name: 'Light, cool beige', hex: '#E3BFA8', warmth: -0.4 },
  { name: 'Light, warm golden', hex: '#E6BE95', warmth: 0.7 },
  { name: 'Light olive', hex: '#D8B994', warmth: 0 },
  { name: 'Medium, neutral', hex: '#C99C77', warmth: 0 },
  { name: 'Medium, golden', hex: '#C8955F', warmth: 0.7 },
  { name: 'Medium olive', hex: '#B88D63', warmth: 0 },
  { name: 'Medium, cool rosy', hex: '#C4917F', warmth: -0.5 },
  { name: 'Tan, warm', hex: '#A8724A', warmth: 0.6 },
  { name: 'Tan, cool', hex: '#9E6E5A', warmth: -0.4 },
  { name: 'Deep, warm', hex: '#7D4B2C', warmth: 0.5 },
  { name: 'Deep, neutral', hex: '#6E4630', warmth: 0 },
  { name: 'Deep, cool', hex: '#5C3A2E', warmth: -0.6 },
  { name: 'Very deep, warm', hex: '#4A2C1C', warmth: 0.4 },
  { name: 'Very deep, cool', hex: '#3A2620', warmth: -0.5 },
]

export const HAIR: ClearFeature[] = [
  { name: 'Platinum blonde', hex: '#E8E0CE', warmth: -0.6, clarity: 0.2 },
  { name: 'Ash blonde', hex: '#C5B497', warmth: -0.6, clarity: -0.6 },
  { name: 'Golden blonde', hex: '#D9B36C', warmth: 0.8, clarity: 0.4 },
  { name: 'Honey blonde', hex: '#C99A55', warmth: 0.7, clarity: 0.1 },
  { name: 'Strawberry blonde', hex: '#D49A6A', warmth: 0.8, clarity: 0.1 },
  { name: 'Dark ash blonde', hex: '#A08A6C', warmth: -0.4, clarity: -0.6 },
  { name: 'Light brown, ash', hex: '#8A7461', warmth: -0.4, clarity: -0.6 },
  { name: 'Light brown, golden', hex: '#9C7044', warmth: 0.6, clarity: -0.1 },
  { name: 'Copper red', hex: '#B5562B', warmth: 1, clarity: 0.6 },
  { name: 'Auburn', hex: '#8A3A22', warmth: 0.8, clarity: 0.2 },
  { name: 'Medium brown', hex: '#6B4C35', warmth: 0, clarity: -0.3 },
  { name: 'Chestnut', hex: '#6E3B23', warmth: 0.6, clarity: 0.1 },
  { name: 'Dark brown, ash', hex: '#3D2E26', warmth: -0.4, clarity: -0.2 },
  { name: 'Dark brown, warm', hex: '#4A2E1E', warmth: 0.3, clarity: 0 },
  { name: 'Soft black', hex: '#2A2522', warmth: -0.1, clarity: 0.2 },
  { name: 'Blue-black', hex: '#121216', warmth: -0.8, clarity: 0.6 },
  { name: 'Salt and pepper', hex: '#8E8B87', warmth: -0.5, clarity: -0.4 },
  { name: 'Silver', hex: '#D8D8D8', warmth: -0.7, clarity: 0.2 },
]

export type Metal =
  'Gold' | 'Silver' | 'Rose gold' | 'Copper' | 'Pewter' | 'Platinum' | 'Brass'

// Shadow and highlight stops for drawing each metal as a gradient.
export const METALS: Record<Metal, [string, string]> = {
  Gold: ['#B8892F', '#F3D88A'],
  Silver: ['#9EA3A8', '#EDEFF1'],
  'Rose gold': ['#B7766A', '#F1C4B5'],
  Copper: ['#9A4E2A', '#E39A6D'],
  Pewter: ['#6E7173', '#B9BBBD'],
  Platinum: ['#C9CCCE', '#F7F8F8'],
  Brass: ['#9C7A2B', '#E1C66E'],
}

export type Season = {
  name: string
  summary: string
  best: Swatch[]
  neutrals: Swatch[]
  metals: Metal[]
  avoid: Swatch[]
}

const s = (name: string, hex: string): Swatch => ({ name, hex })

export const SEASONS = {
  lightSpring: {
    name: 'Light Spring',
    summary: 'Light, warm and clear. Delicate warm pastels.',
    best: [
      s('Peach', '#F9B49B'),
      s('Coral', '#F28B74'),
      s('Apricot', '#F6B26B'),
      s('Buttercup', '#F4D06F'),
      s('Spring green', '#9BD38A'),
      s('Mint', '#A8E0C4'),
      s('Light aqua', '#7FD3CF'),
      s('Periwinkle', '#9CA8E6'),
      s('Warm pink', '#F59AB3'),
      s('Light violet', '#B9A3E3'),
    ],
    neutrals: [
      s('Ivory', '#FBF3E4'),
      s('Cream', '#F2E3C6'),
      s('Light camel', '#D6B98C'),
      s('Warm gray', '#BDB3A6'),
      s('Light navy', '#4A5D8A'),
    ],
    metals: ['Gold', 'Rose gold'],
    avoid: [
      s('Black', '#111111'),
      s('Burgundy', '#6E1A2E'),
      s('Charcoal', '#36383C'),
      s('Olive drab', '#6B6A3E'),
    ],
  },
  warmSpring: {
    name: 'Warm Spring',
    summary: 'Warm first, then clear. Sunny, golden brights.',
    best: [
      s('Golden yellow', '#F9C23C'),
      s('Golden peach', '#FBB57C'),
      s('Tangerine', '#F79533'),
      s('Warm coral', '#F57F5B'),
      s('Salmon', '#F99D80'),
      s('Tomato red', '#E64A2E'),
      s('Chartreuse', '#B9D24A'),
      s('Leaf green', '#6BBF59'),
      s('Warm turquoise', '#24B4A5'),
      s('Cornflower', '#6D8FDB'),
    ],
    neutrals: [
      s('Ivory', '#FAF0DC'),
      s('Warm beige', '#E3CBA8'),
      s('Camel', '#C19A6B'),
      s('Golden brown', '#8B5A2B'),
      s('Warm navy', '#34508A'),
    ],
    metals: ['Gold', 'Brass'],
    avoid: [
      s('Black', '#111111'),
      s('Icy pink', '#F4D7E3'),
      s('Blue-gray', '#7B8794'),
      s('Magenta', '#B0136E'),
    ],
  },
  brightSpring: {
    name: 'Bright Spring',
    summary: 'Clear first, then warm. Saturated, high-energy color.',
    best: [
      s('Poppy red', '#E8382F'),
      s('Hot coral', '#FF5F4A'),
      s('Orange', '#FF8A1E'),
      s('Clear yellow', '#FFD93B'),
      s('Apple green', '#8BD045'),
      s('Kelly green', '#2BB24C'),
      s('Bright turquoise', '#12C4C0'),
      s('Royal periwinkle', '#6F7FE8'),
      s('Violet', '#8C5BD6'),
      s('Warm bright pink', '#FF5C8A'),
    ],
    neutrals: [
      s('Warm white', '#FFF8EC'),
      s('Camel', '#C69C6D'),
      s('Warm gray', '#8E8679'),
      s('Chocolate', '#5A3A26'),
      s('Bright navy', '#1F3A93'),
    ],
    metals: ['Gold', 'Brass'],
    avoid: [
      s('Dusty rose', '#C49A9A'),
      s('Muted sage', '#A3B19B'),
      s('Mauve gray', '#9C8A94'),
      s('Olive drab', '#6B5E3A'),
    ],
  },
  lightSummer: {
    name: 'Light Summer',
    summary: 'Light, cool and soft. Airy, powdery pastels.',
    best: [
      s('Powder blue', '#A9C6E8'),
      s('Sky blue', '#8DB9E2'),
      s('Soft rose', '#E6A6B6'),
      s('Watermelon', '#EF8A9A'),
      s('Raspberry sorbet', '#D1739A'),
      s('Lavender', '#BFA9DB'),
      s('Periwinkle', '#9AA4DA'),
      s('Soft aqua', '#93D1CC'),
      s('Cool mint', '#A9D9C3'),
      s('Soft plum', '#A47FA6'),
    ],
    neutrals: [
      s('Soft white', '#F6F4F2'),
      s('Light gray', '#C9CBD0'),
      s('Rose beige', '#D9C1B9'),
      s('Taupe gray', '#9E958F'),
      s('Soft navy', '#4C5C82'),
    ],
    metals: ['Silver', 'Rose gold'],
    avoid: [
      s('Black', '#111111'),
      s('Orange', '#F07A1A'),
      s('Mustard', '#C9A227'),
      s('Rust', '#A9471E'),
    ],
  },
  coolSummer: {
    name: 'Cool Summer',
    summary: 'Cool first, then soft. Blue-based, gentle mid-tones.',
    best: [
      s('Rose pink', '#D9788E'),
      s('Raspberry', '#B5446E'),
      s('Soft fuchsia', '#C55A9A'),
      s('Plum', '#8A4F7D'),
      s('Lavender', '#A08CC8'),
      s('Powder blue', '#A7C4E0'),
      s('Cornflower', '#6F8FCF'),
      s('Slate blue', '#5A78A8'),
      s('Soft teal', '#4E9A9A'),
      s('Spruce', '#4C8075'),
    ],
    neutrals: [
      s('Soft white', '#F4F3F1'),
      s('Pewter gray', '#8D8F94'),
      s('Blue-gray', '#7E8B9B'),
      s('Rose brown', '#8A6F6E'),
      s('Gray navy', '#3B4A68'),
    ],
    metals: ['Silver', 'Pewter'],
    avoid: [
      s('Orange', '#F07A1A'),
      s('Golden yellow', '#F2B705'),
      s('Camel', '#C19A6B'),
      s('Rust', '#A9471E'),
    ],
  },
  softSummer: {
    name: 'Soft Summer',
    summary: 'Soft first, then cool. Smoky, blended, muted tones.',
    best: [
      s('Dusty rose', '#C99AA0'),
      s('Mauve', '#A87F96'),
      s('Soft raspberry', '#B0607E'),
      s('Soft plum', '#8C6A84'),
      s('Smoky lavender', '#9D93B5'),
      s('Slate blue', '#6C7F9C'),
      s('Cadet blue', '#6C8EA4'),
      s('Muted teal', '#5E8F8C'),
      s('Sage', '#9AAE9A'),
      s('Gray-green', '#7E9585'),
    ],
    neutrals: [
      s('Oyster', '#E8E2DA'),
      s('Rose taupe', '#A08E87'),
      s('Cool gray', '#8D9096'),
      s('Cocoa', '#6E5A55'),
      s('Charcoal blue', '#48505E'),
    ],
    metals: ['Pewter', 'Silver'],
    avoid: [
      s('Black', '#111111'),
      s('Bright orange', '#FF7A00'),
      s('Bright yellow', '#FFE11A'),
      s('Kelly green', '#1AAA3B'),
    ],
  },
  softAutumn: {
    name: 'Soft Autumn',
    summary: 'Soft first, then warm. Earthy, dusty, low-contrast.',
    best: [
      s('Soft terracotta', '#C27B60'),
      s('Muted coral', '#D98A72'),
      s('Muted salmon', '#D8957A'),
      s('Rose brown', '#A6766C'),
      s('Soft gold', '#CDAA5E'),
      s('Moss', '#8A8D5A'),
      s('Muted olive', '#7A7A44'),
      s('Sage', '#9CAF88'),
      s('Dusty teal', '#5E8C84'),
      s('Soft denim', '#6F849A'),
    ],
    neutrals: [
      s('Oatmeal', '#E7DCC8'),
      s('Camel', '#BC9A6E'),
      s('Mushroom', '#A89A88'),
      s('Warm taupe', '#8C7A68'),
      s('Coffee', '#5C4636'),
    ],
    metals: ['Gold', 'Brass'],
    avoid: [
      s('Black', '#111111'),
      s('Pure white', '#FFFFFF'),
      s('Fuchsia', '#D1007A'),
      s('Icy blue', '#CFE8FF'),
    ],
  },
  warmAutumn: {
    name: 'Warm Autumn',
    summary: 'Warm first, then soft. Rich spice and harvest tones.',
    best: [
      s('Rust', '#B5481E'),
      s('Pumpkin', '#D9731B'),
      s('Terracotta', '#C25B3A'),
      s('Brick red', '#A2342A'),
      s('Mustard', '#D4A017'),
      s('Golden wheat', '#D9B26B'),
      s('Olive', '#6E7230'),
      s('Forest green', '#3B5E2E'),
      s('Teal', '#20706E'),
      s('Peacock', '#1C6E78'),
    ],
    neutrals: [
      s('Cream', '#F1E5CE'),
      s('Khaki', '#A89C6B'),
      s('Camel', '#B98952'),
      s('Olive brown', '#5F5333'),
      s('Chocolate', '#4E3020'),
    ],
    metals: ['Gold', 'Copper'],
    avoid: [
      s('Black', '#111111'),
      s('Hot pink', '#F2368D'),
      s('Icy blue', '#CFE8FF'),
      s('Silver gray', '#B7BBC2'),
    ],
  },
  deepAutumn: {
    name: 'Deep Autumn',
    summary: 'Deep first, then warm. Dark, rich, saturated earth.',
    best: [
      s('Burnt orange', '#C0561A'),
      s('Paprika', '#A8361F'),
      s('Deep rust', '#8F3A1C'),
      s('Cranberry', '#8A1E2C'),
      s('Mahogany', '#6B2A20'),
      s('Dark gold', '#B8860B'),
      s('Deep olive', '#4F5124'),
      s('Forest', '#24452E'),
      s('Deep teal', '#134F55'),
      s('Aubergine', '#4B2A3A'),
    ],
    neutrals: [
      s('Cream', '#EFE2C8'),
      s('Camel', '#A9784B'),
      s('Coffee', '#6B4A33'),
      s('Olive brown', '#4C4428'),
      s('Espresso', '#3B2618'),
    ],
    metals: ['Gold', 'Copper'],
    avoid: [
      s('Pastel pink', '#F7C8D8'),
      s('Icy lavender', '#E2DAF2'),
      s('Powder blue', '#BFD7EA'),
      s('Silver gray', '#B7BBC2'),
    ],
  },
  deepWinter: {
    name: 'Deep Winter',
    summary: 'Deep first, then cool. Dark, dramatic jewel tones.',
    best: [
      s('True red', '#C8102E'),
      s('Burgundy', '#6D1230'),
      s('Berry', '#A3005E'),
      s('Deep purple', '#4B1E6D'),
      s('Sapphire', '#1F3F9F'),
      s('Icy blue', '#D5E8F5'),
      s('Emerald', '#00875A'),
      s('Pine', '#0B4A3A'),
      s('Deep teal', '#00575F'),
      s('Icy pink', '#F3D7E6'),
    ],
    neutrals: [
      s('Pure white', '#FFFFFF'),
      s('Dark taupe', '#4A4446'),
      s('Charcoal', '#333438'),
      s('Navy', '#1B2440'),
      s('Black', '#111111'),
    ],
    metals: ['Silver', 'Platinum'],
    avoid: [
      s('Orange', '#F07A1A'),
      s('Camel', '#C19A6B'),
      s('Mustard', '#C9A227'),
      s('Peach', '#F9B49B'),
    ],
  },
  coolWinter: {
    name: 'Cool Winter',
    summary: 'Cool first, then clear. Icy and vivid blue-based color.',
    best: [
      s('Blue red', '#C21E3A'),
      s('Hot pink', '#E0218A'),
      s('Berry wine', '#8B1A4A'),
      s('Royal purple', '#6A2C9E'),
      s('Royal blue', '#2346C8'),
      s('Ice blue', '#D4E9F7'),
      s('Emerald', '#009B77'),
      s('Pine teal', '#00606A'),
      s('Ice pink', '#F2D3E3'),
      s('Lemon ice', '#F4F2B8'),
    ],
    neutrals: [
      s('Pure white', '#FFFFFF'),
      s('Cool gray', '#8A8D94'),
      s('Charcoal', '#333438'),
      s('Navy', '#1B2440'),
      s('Black', '#111111'),
    ],
    metals: ['Silver', 'Platinum'],
    avoid: [
      s('Orange', '#F07A1A'),
      s('Camel', '#C19A6B'),
      s('Rust', '#A9471E'),
      s('Olive', '#6E7230'),
    ],
  },
  brightWinter: {
    name: 'Bright Winter',
    summary: 'Clear first, then cool. High contrast, electric color.',
    best: [
      s('Cherry red', '#E3002C'),
      s('Hot pink', '#FF1F8E'),
      s('Fuchsia', '#D400A5'),
      s('Violet', '#7B2FD9'),
      s('Cobalt', '#0047AB'),
      s('Bright azure', '#0A84FF'),
      s('Turquoise', '#00B5C8'),
      s('Bright emerald', '#00A86B'),
      s('Lemon', '#F8E71C'),
      s('Icy mint', '#CFF5E7'),
    ],
    neutrals: [
      s('Pure white', '#FFFFFF'),
      s('Cool taupe', '#6B6566'),
      s('Charcoal', '#333438'),
      s('True navy', '#14214D'),
      s('Black', '#111111'),
    ],
    metals: ['Silver', 'Platinum'],
    avoid: [
      s('Dusty rose', '#C49A9A'),
      s('Mushroom', '#A89A88'),
      s('Muted olive', '#7A7A44'),
      s('Mustard', '#C9A227'),
    ],
  },
} satisfies Record<string, Season>

export type SeasonKey = keyof typeof SEASONS

// ---- color math ----

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: number[]) {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16))
      .map((v) => v.padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

// CIE L* (0 black to 100 white), the perceptual lightness used for depth and
// contrast.
export function lightness(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const sat = d / (1 - Math.abs(2 * l - 1))
  const h =
    max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4
  return [h * 60, sat, l]
}

export function hslToHex(h: number, sat: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * sat
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  const [r, g, b] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x]
  const m = l - c / 2
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255])
}

// ---- classification ----

export type Axes = { warmth: number; depth: number; clarity: number }

const clamp = (v: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, v))

export function analyze(eyes: ClearFeature, skin: Feature, hair: ClearFeature) {
  const [le, ls, lh] = [eyes, skin, hair].map((f) => lightness(f.hex))
  // The scales below were grid-searched against every case in the logic test.
  // Skin is a quarter of depth, so deep skin alone does not force a Deep
  // season. Hair and eyes set the overall value.
  const warmth = (1.2 * (2 * skin.warmth + hair.warmth + eyes.warmth)) / 4
  const depth = clamp((50 - (0.25 * ls + 0.45 * lh + 0.3 * le)) / 35)
  const contrast = (0.6 * Math.abs(ls - lh) + 0.4 * Math.abs(ls - le)) / 60
  const clarity = clamp(
    contrast - 0.6 + 0.75 * ((eyes.clarity + hair.clarity) / 2)
  )
  return { warmth: clamp(warmth), depth, clarity }
}

// The axis furthest from neutral names the season's family. The second
// characteristic picks which of the two seasons sharing that trait fits.
export function classify({ warmth, depth, clarity }: Axes): SeasonKey {
  const warm = warmth >= 0
  const dominant = [
    ['warmth', Math.abs(warmth)],
    ['depth', Math.abs(depth)],
    ['clarity', Math.abs(clarity)],
  ].sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]

  if (dominant === 'depth') {
    if (depth > 0) return warm ? 'deepAutumn' : 'deepWinter'
    return warm ? 'lightSpring' : 'lightSummer'
  }
  if (dominant === 'clarity') {
    if (clarity > 0) return warm ? 'brightSpring' : 'brightWinter'
    return warm ? 'softAutumn' : 'softSummer'
  }
  // Spring is the light, clear side of warm. Winter is the deep, clear side
  // of cool.
  if (warm) return clarity - depth > 0 ? 'warmSpring' : 'warmAutumn'
  return clarity + depth > 0 ? 'coolWinter' : 'coolSummer'
}

// Plain-language reading of the axes, shown beside the season.
export function describeAxes({ warmth, depth, clarity }: Axes) {
  const pick = (v: number, neg: string, mid: string, pos: string) =>
    v > 0.15 ? pos : v < -0.15 ? neg : mid
  return [
    { label: 'Undertone', value: pick(warmth, 'Cool', 'Neutral', 'Warm') },
    { label: 'Depth', value: pick(depth, 'Light', 'Medium', 'Deep') },
    { label: 'Chroma', value: pick(clarity, 'Soft', 'Balanced', 'Clear') },
  ]
}

// ---- aesthetics ----

type Hsl = [number, number, number]
const hueNear = (h: number, center: number, width: number) =>
  Math.max(
    0,
    1 - Math.min(Math.abs(h - center), 360 - Math.abs(h - center)) / width
  )

export type Aesthetic = {
  name: string
  blurb: string
  // Which neutral anchors the outfit: the lightest, middle or darkest.
  base: 'light' | 'mid' | 'dark'
  score: (hsl: Hsl) => number
}

export const AESTHETICS: Aesthetic[] = [
  {
    name: 'Classic',
    blurb: 'Tailored, timeless mid-tones over a dark base.',
    base: 'dark',
    score: ([, sat, l]) => -Math.abs(l - 0.45) - 0.5 * Math.abs(sat - 0.5),
  },
  {
    name: 'Minimalist',
    blurb: 'Quiet, low-saturation accents over a light base.',
    base: 'light',
    score: ([, sat]) => -sat,
  },
  {
    name: 'Romantic',
    blurb: 'Soft pinks, roses and lilacs, kept light.',
    base: 'light',
    score: ([h, , l]) => Math.max(hueNear(h, 345, 45), hueNear(h, 280, 40)) + l,
  },
  {
    name: 'Bohemian',
    blurb: 'Earthy spice, ochre and leaf tones.',
    base: 'mid',
    score: ([h, sat, l]) =>
      Math.max(hueNear(h, 30, 30), hueNear(h, 90, 40)) -
      Math.abs(l - 0.45) -
      0.3 * sat,
  },
  {
    name: 'Edgy',
    blurb: 'Your deepest, sharpest shades over a dark base.',
    base: 'dark',
    score: ([, sat, l]) => -l + 0.3 * sat,
  },
  {
    name: 'Bold',
    blurb: 'Your most saturated shades, worn loud.',
    base: 'light',
    score: ([, sat, l]) => sat - Math.abs(l - 0.5),
  },
  {
    name: 'Natural',
    blurb: 'Greens, blues and browns from the outdoors.',
    base: 'mid',
    score: ([h, sat, l]) =>
      Math.max(
        hueNear(h, 140, 60),
        hueNear(h, 200, 40),
        hueNear(h, 30, 20) * 0.6
      ) -
      Math.abs(l - 0.45) -
      0.2 * sat,
  },
]

// Four featured best colors plus a 60/30/10 split: base neutral, main color,
// accent color.
export function applyAesthetic(season: Season, aesthetic: Aesthetic) {
  const featured = [...season.best]
    .map((sw) => ({ sw, score: aesthetic.score(hexToHsl(sw.hex)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ sw }) => sw)
  const byLight = [...season.neutrals].sort(
    (a, b) => lightness(a.hex) - lightness(b.hex)
  )
  const base =
    aesthetic.base === 'dark'
      ? byLight[0]
      : aesthetic.base === 'light'
        ? byLight[byLight.length - 1]
        : byLight[Math.floor(byLight.length / 2)]
  return { featured, ratio: [base, featured[0], featured[1]] as const }
}

// ---- harmonies built from the picked colors ----

export function harmonies(
  eyes: Feature,
  skin: Feature,
  hair: Feature
): Swatch[] {
  const [eh, es] = hexToHsl(eyes.hex)
  const [hh, hs, hl] = hexToHsl(hair.hex)
  const [sh, ss, sl] = hexToHsl(skin.hex)
  // Grays have no meaningful hue, so their echo stays gray.
  const hairSat = hs < 0.08 ? hs : Math.max(hs, 0.35)
  return [
    s('Eye echo', hslToHex(eh, Math.max(es, 0.45), 0.42)),
    s('Eye pop', hslToHex(eh + 180, Math.max(es, 0.4), 0.45)),
    s('Hair echo', hslToHex(hh, hairSat, clamp(hl, 0.28, 0.5))),
    s(
      'Your nude',
      hslToHex(sh, Math.min(ss + 0.05, 0.6), clamp(sl - 0.12, 0.2, 0.8))
    ),
    // Skin hues sit near 15 to 35 degrees. Turning 40 back lands on rose,
    // kept near the skin's own depth so deep skin gets berry, not pastel.
    s('Flush', hslToHex(sh - 40, 0.6, clamp(sl + 0.05, 0.35, 0.65))),
  ]
}
