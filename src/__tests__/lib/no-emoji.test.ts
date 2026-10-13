import fs from 'fs'
import path from 'path'

/**
 * Emoji come from the viewer's system font, so the same page looks different
 * on every device and cannot follow the theme. UI icons come from
 * lucide-react instead. Text-style symbols such as the game's arrow keys are
 * not matched: only characters that render as emoji by default, or that ask
 * to with U+FE0F.
 */
const EMOJI = /\p{Emoji_Presentation}|\uFE0F/u
const ROOTS = [
  'src/app',
  'src/components',
  'src/sections',
  'src/resources',
  'components',
]
const SOURCE = /\.(tsx?|mdx)$/

function sourceFiles(root: string): string[] {
  return (fs.readdirSync(root, { recursive: true }) as string[])
    .filter((file) => SOURCE.test(file))
    .map((file) => path.join(root, file))
}

describe('rendered source', () => {
  it.each(ROOTS)('has no emoji under %s', (root) => {
    const offenders = sourceFiles(root).filter((file) =>
      EMOJI.test(fs.readFileSync(file, 'utf8'))
    )

    expect(offenders).toEqual([])
  })
})
