import {
  AESTHETICS,
  EYES,
  HAIR,
  SEASONS,
  SKIN,
  UNDERTONES,
  analyze,
  applyAesthetic,
  classify,
  harmonies,
  hexToHsl,
  hslToHex,
  type SeasonKey,
} from '../../components/swatch-generator/palette'
import { jpegToPdf } from '../../components/swatch-generator/pdf'

const pick = <T extends { name: string }>(list: T[], name: string) => {
  const found = list.find((f) => f.name === name)
  if (!found) throw new Error(`No feature named ${name}`)
  return found
}

const seasonOf = (
  eyes: string,
  skin: string,
  undertone: string,
  hair: string
) =>
  classify(
    analyze(
      pick(EYES, eyes),
      pick(SKIN, skin),
      pick(UNDERTONES, undertone),
      pick(HAIR, hair)
    )
  )

// Textbook examples from seasonal color analysis: each is the combination
// stylists use to illustrate the season. The scales in analyze() were fit to
// these cases, so they guard against regressions rather than prove the
// calibration independently.
describe('classify', () => {
  it.each<[string, string, string, string, SeasonKey]>([
    ['Light blue', 'Monk 2', 'Cool', 'Ash blonde', 'lightSummer'],
    ['Light blue', 'Monk 3', 'Warm', 'Golden blonde', 'lightSpring'],
    ['Black-brown', 'Monk 10 (deepest)', 'Cool', 'Blue-black', 'deepWinter'],
    ['Dark brown', 'Monk 8', 'Warm', 'Dark brown, warm', 'deepAutumn'],
    ['Hazel', 'Monk 6', 'Warm', 'Auburn', 'warmAutumn'],
    ['Bright blue', 'Monk 1 (lightest)', 'Cool', 'Blue-black', 'brightWinter'],
    ['Gray-green', 'Monk 4', 'Cool', 'Light brown, ash', 'softSummer'],
    ['Hazel', 'Monk 4', 'Olive', 'Medium brown', 'softAutumn'],
    ['Blue-gray', 'Monk 2', 'Cool', 'Salt and pepper', 'coolSummer'],
    ['Blue-green', 'Monk 3', 'Warm', 'Copper red', 'warmSpring'],
  ])(
    '%s eyes, %s %s skin, %s hair is %s',
    (eyes, skin, undertone, hair, season) => {
      expect(seasonOf(eyes, skin, undertone, hair)).toBe(season)
    }
  )

  it('reaches every season from some combination of the dropdowns', () => {
    const reached = new Set<SeasonKey>()
    for (const e of EYES)
      for (const sk of SKIN)
        for (const u of UNDERTONES)
          for (const h of HAIR) reached.add(classify(analyze(e, sk, u, h)))
    expect([...reached].sort()).toEqual(Object.keys(SEASONS).sort())
  })
})

// Style-guide principles for deep skin: season follows undertone and
// softness, not depth alone. Soft Summer runs from fair to deep, and a
// tan-skinned person with ashy brown hair and gray-green eyes can be a Summer.
// Each case accepts every season the principle allows.
describe('classify deep and tan skin', () => {
  it.each<[string, string, string, string, SeasonKey[]]>([
    [
      'Gray-green',
      'Monk 7',
      'Cool',
      'Light brown, ash',
      ['softSummer', 'coolSummer'],
    ],
    ['Gray-green', 'Monk 8', 'Cool', 'Dark brown, ash', ['softSummer']],
    [
      'Gray',
      'Monk 10 (deepest)',
      'Cool',
      'Salt and pepper',
      ['softSummer', 'coolSummer'],
    ],
    ['Hazel', 'Monk 8', 'Warm', 'Medium brown', ['softAutumn', 'warmAutumn']],
    ['Amber', 'Monk 10 (deepest)', 'Warm', 'Chestnut', ['warmAutumn', 'deepAutumn']],
  ])(
    '%s eyes, %s %s skin, %s hair is one of %j',
    (eyes, skin, undertone, hair, seasons) => {
      expect(seasons).toContain(seasonOf(eyes, skin, undertone, hair))
    }
  )

  // Monk 8 to 10 are the deep end of the scale.
  const deepSkins = SKIN.slice(7).flatMap((s) =>
    UNDERTONES.map((u) => [`${s.name} ${u.name}`, s, u] as const)
  )
  const seasonsFor = (
    skin: (typeof SKIN)[number],
    undertone: (typeof UNDERTONES)[number]
  ) =>
    EYES.flatMap((e) =>
      HAIR.map((h) => classify(analyze(e, skin, undertone, h)))
    )

  it.each(deepSkins)(
    '%s skin lands in a Deep season for at most half its combinations',
    (_, skin, undertone) => {
      const all = seasonsFor(skin, undertone)
      const deep = all.filter((k) => k.startsWith('deep')).length
      expect(deep).toBeLessThanOrEqual(all.length / 2)
    }
  )

  it.each(deepSkins.filter(([, , u]) => u.name === 'Cool'))(
    '%s skin can reach a Summer season',
    (_, skin, undertone) => {
      expect(
        seasonsFor(skin, undertone).some((k) => k.endsWith('Summer'))
      ).toBe(true)
    }
  )
})

describe('skin inputs', () => {
  // Published at skintone.google, lightest to deepest.
  it('uses the ten Monk Skin Tone Scale values', () => {
    expect(SKIN.map((s) => s.hex.toLowerCase())).toEqual([
      '#f6ede4',
      '#f3e7db',
      '#f7ead0',
      '#eadaba',
      '#d7bd96',
      '#a07e56',
      '#825c43',
      '#604134',
      '#3a312a',
      '#292420',
    ])
  })

  it('reads olive skin as softer than neutral skin with the same features', () => {
    const [e, s, h] = [
      pick(EYES, 'Hazel'),
      pick(SKIN, 'Monk 5'),
      pick(HAIR, 'Medium brown'),
    ]
    const olive = analyze(e, s, pick(UNDERTONES, 'Olive'), h)
    const neutral = analyze(e, s, pick(UNDERTONES, 'Neutral'), h)
    expect(olive.clarity).toBeLessThan(neutral.clarity)
  })

  it('moves the season from Summer to Spring when only the undertone warms', () => {
    expect(seasonOf('Light blue', 'Monk 2', 'Cool', 'Medium brown')).toMatch(
      /Summer$/
    )
    expect(seasonOf('Light blue', 'Monk 2', 'Warm', 'Medium brown')).toMatch(
      /Spring$/
    )
  })
})

describe('season data', () => {
  it.each(Object.entries(SEASONS))(
    '%s has complete, valid swatches',
    (_, s) => {
      expect(s.best).toHaveLength(10)
      expect(s.neutrals).toHaveLength(5)
      expect(s.avoid).toHaveLength(4)
      const all = [...s.best, ...s.neutrals, ...s.avoid]
      for (const sw of all) expect(sw.hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(new Set(all.map((sw) => sw.hex)).size).toBe(all.length)
    }
  )
})

describe('applyAesthetic', () => {
  const season = SEASONS.softAutumn
  const meanSat = (name: string) => {
    const { featured } = applyAesthetic(
      season,
      AESTHETICS.find((a) => a.name === name)!
    )
    return (
      featured.reduce((sum, sw) => sum + hexToHsl(sw.hex)[1], 0) /
      featured.length
    )
  }

  it('features more saturated colors for Bold than for Minimalist', () => {
    expect(meanSat('Bold')).toBeGreaterThan(meanSat('Minimalist'))
  })

  it('anchors Edgy on the darkest neutral and Minimalist on the lightest', () => {
    const edgy = applyAesthetic(
      season,
      AESTHETICS.find((a) => a.name === 'Edgy')!
    )
    const min = applyAesthetic(
      season,
      AESTHETICS.find((a) => a.name === 'Minimalist')!
    )
    expect(edgy.ratio[0].name).toBe('Coffee')
    expect(min.ratio[0].name).toBe('Oatmeal')
  })

  it('features rose and lilac shades for Romantic', () => {
    const { featured } = applyAesthetic(
      SEASONS.lightSummer,
      AESTHETICS.find((a) => a.name === 'Romantic')!
    )
    expect(featured.map((sw) => sw.name)).toEqual(
      expect.arrayContaining(['Soft rose', 'Lavender'])
    )
  })
})

describe('harmonies', () => {
  it('pairs brown eyes with a blue "eye pop"', () => {
    const [, pop] = harmonies(
      pick(EYES, 'Medium brown'),
      pick(SKIN, 'Monk 6'),
      pick(UNDERTONES, 'Neutral'),
      pick(HAIR, 'Medium brown')
    )
    const [h] = hexToHsl(pop.hex)
    expect(h).toBeGreaterThan(190)
    expect(h).toBeLessThan(230)
  })

  it('keeps gray hair gray instead of inventing a hue', () => {
    const [, , hairEcho] = harmonies(
      pick(EYES, 'Gray'),
      pick(SKIN, 'Monk 3'),
      pick(UNDERTONES, 'Neutral'),
      pick(HAIR, 'Salt and pepper')
    )
    expect(hexToHsl(hairEcho.hex)[1]).toBeLessThan(0.08)
  })

  // Makeup guides pair cool undertones with pink and berry blush and warm
  // ones with peach and coral.
  it('turns the flush rosier for cool skin than for warm skin', () => {
    const flushHue = (undertone: string) => {
      const [h] = hexToHsl(
        harmonies(
          pick(EYES, 'Hazel'),
          pick(SKIN, 'Monk 5'),
          pick(UNDERTONES, undertone),
          pick(HAIR, 'Medium brown')
        )[4].hex
      )
      return h > 180 ? h - 360 : h
    }
    expect(flushHue('Cool')).toBeLessThan(-10)
    expect(flushHue('Warm')).toBeGreaterThan(0)
  })

  it('round-trips hsl conversion', () => {
    for (const hex of ['#C27B60', '#1F3F9F', '#8A8D5A']) {
      const [h, s, l] = hexToHsl(hex)
      expect(hslToHex(h, s, l)).toBe(hex)
    }
  })
})

describe('jpegToPdf', () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2, 3, 0x0a, 4, 0xff, 0xd9])
  const pdf = jpegToPdf(jpeg, 2160, 3000)
  const text = Buffer.from(pdf).toString('latin1')

  it('points every xref entry at its object', () => {
    const start = Number(text.match(/startxref\n(\d+)\n%%EOF$/)![1])
    expect(text.slice(start, start + 4)).toBe('xref')
    const entries = text
      .slice(start)
      .split('\n')
      .slice(3, 8)
      .map((line) => Number(line.slice(0, 10)))
    entries.forEach((offset, i) =>
      expect(text.slice(offset, offset + 8)).toBe(`${i + 1} 0 obj\n`)
    )
  })

  it('embeds the jpeg bytes unchanged with their exact length', () => {
    expect(text).toContain(`/Length ${jpeg.length} >>`)
    const at = text.indexOf('stream\n') + 'stream\n'.length
    expect([...pdf.slice(at, at + jpeg.length)]).toEqual([...jpeg])
  })

  it('sizes the page to the image aspect ratio', () => {
    expect(text).toContain('/MediaBox [0 0 540 750]')
  })
})
