import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import ActiveIcon, { STACK_ICONS } from '../../components/ActiveIcon'

/**
 * The stack icons on /demos are served from public/icons/stack. A remote
 * pattern for skillicons.dev let any visitor push endless distinct source
 * images through the image optimizer, so the config must not come back.
 */

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
})

beforeEach(() => window.localStorage.clear())

function iconSrc(theme: 'light' | 'dark') {
  render(
    <ThemeProvider attribute="class" enableSystem defaultTheme={theme}>
      <ActiveIcon href="https://example.com" iconName="nextjs" />
    </ThemeProvider>
  )
  return screen.getByRole('img').getAttribute('src')
}

describe('ActiveIcon stack icons', () => {
  it.each(['light', 'dark'] as const)(
    'serves the %s icon from a local file',
    (theme) => {
      expect(iconSrc(theme)).toBe(`/icons/stack/nextjs-${theme}.svg`)
    }
  )

  it.each(STACK_ICONS.flatMap((name) => [`${name}-light`, `${name}-dark`]))(
    'ships public/icons/stack/%s.svg',
    (file) => {
      const svg = fs.readFileSync(
        path.join(process.cwd(), 'public/icons/stack', `${file}.svg`),
        'utf8'
      )
      expect(svg).toMatch(/^\s*<svg/)
      expect(svg).not.toMatch(/<script|\son[a-z]+=|javascript:/i)
    }
  )
})

describe('next.config images', () => {
  it('allows no remote image source and no SVG through the optimizer', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../next.config.js')
    expect(config.images?.remotePatterns).toBeUndefined()
    expect(config.images?.dangerouslyAllowSVG).toBeFalsy()
  })
})
