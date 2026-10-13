import { render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Header from '../../sections/Header'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

/**
 * The header nav used to be a Radix tablist with no tab panels, so every
 * trigger's `aria-controls` pointed at an id that did not exist, which axe
 * reports as `aria-valid-attr-value`. Route navigation is a list of links,
 * and the current route is announced through `aria-current`.
 */
function navAt(path: string) {
  jest.mocked(usePathname).mockReturnValue(path)
  render(<Header />)
  return within(screen.getByRole('navigation', { name: 'Main navigation' }))
}

describe('Header navigation', () => {
  it('is a list of links, not a tablist', () => {
    const nav = navAt('/')

    expect(nav.queryByRole('tablist')).not.toBeInTheDocument()
    expect(nav.queryByRole('tab')).not.toBeInTheDocument()
    expect(within(nav.getByRole('list')).getAllByRole('listitem')).toHaveLength(
      3
    )
    expect(
      nav
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')])
    ).toEqual([
      ['Home', '/'],
      ['Demos', '/demos'],
      ['Resources', '/resources'],
    ])
  })

  it.each([
    ['/', 'Home'],
    ['/demos', 'Demos'],
    ['/resources', 'Resources'],
  ])('marks the link for %s as the current page', (path, name) => {
    const nav = navAt(path)

    expect(nav.getByRole('link', { current: 'page' })).toHaveAccessibleName(
      name
    )
    expect(nav.getAllByRole('link', { current: false })).toHaveLength(2)
  })

  it('marks the section, not the page, from a subpage', () => {
    const nav = navAt('/demos/candlelight')

    expect(nav.queryByRole('link', { current: 'page' })).not.toBeInTheDocument()
    expect(nav.getByRole('link', { current: true })).toHaveAccessibleName(
      'Demos'
    )
  })

  it.each(['/no-such-page', '/demosx'])(
    'marks nothing current on %s, outside the nav',
    (path) => {
      const nav = navAt(path)

      expect(nav.getAllByRole('link', { current: false })).toHaveLength(3)
    }
  )
})

/**
 * One layout serves every width: the icons always render, and below 34rem
 * Tailwind hides the words. A hamburger and a sidebar would put a JS-driven
 * second layout back, which server-renders the wrong one on phones.
 */
describe('Header navigation on a phone', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it.each([375, 1280])(
    'has the same three links and no menu button at %ipx wide',
    (width) => {
      window.innerWidth = width
      const nav = navAt('/')

      expect(
        nav.getAllByRole('link').map((link) => link.getAttribute('href'))
      ).toEqual(['/', '/demos', '/resources'])
      expect(
        screen.queryByRole('button', { name: /menu/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('navigation', { name: /sidebar/i })
      ).not.toBeInTheDocument()
    }
  )

  it('puts an icon, then the words, in each link', () => {
    const nav = navAt('/')

    expect(
      nav.getAllByRole('link').map((link) => {
        const icon = link.querySelector('svg')
        return [icon?.getAttribute('class'), icon?.getAttribute('aria-hidden')]
      })
    ).toEqual([
      [expect.stringContaining('lucide-house'), 'true'],
      [expect.stringContaining('lucide-flask-conical'), 'true'],
      [expect.stringContaining('lucide-book-open'), 'true'],
    ])
    for (const link of nav.getAllByRole('link')) {
      expect(link.firstElementChild?.tagName.toLowerCase()).toBe('svg')
    }
  })

  it('keeps each link nameable when the words are hidden', () => {
    const nav = navAt('/demos')

    for (const name of ['Home', 'Demos', 'Resources']) {
      const words = nav.getByRole('link', { name }).querySelector('.sr-only')
      expect(words).toHaveTextContent(name)
      expect(words).toHaveClass('min-[34rem]:not-sr-only')
    }
  })
})
