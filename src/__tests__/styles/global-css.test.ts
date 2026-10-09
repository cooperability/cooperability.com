import fs from 'node:fs'
import path from 'node:path'

const css = fs.readFileSync(
  path.join(__dirname, '../../styles/global.css'),
  'utf8'
)

const definitions = new Map<string, string[]>()
for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  definitions.set(name, [...(definitions.get(name) ?? []), value.trim()])
}

const WHOLE_COLOR = /^(?:#|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\()/

describe('global.css theme tokens', () => {
  // hsl(oklch(...)) is invalid, so every utility on that token silently
  // computes to transparent or none: focus rings, borders, hover fills.
  it('never wraps a variable that already holds a whole colour in a colour function', () => {
    expect(definitions.get('--ring')).toHaveLength(2)

    const wrapped = [
      ...css.matchAll(/\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*var\((--[\w-]+)\)/g),
    ]
      .filter(([, name]) => (definitions.get(name) ?? []).some((v) => WHOLE_COLOR.test(v)))
      .map(([match]) => match)

    expect(wrapped).toEqual([])
  })
})
