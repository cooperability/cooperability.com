import { cleanup, render, screen, within } from '@testing-library/react'
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
      ['Stash', '/stash'],
    ])
  })

  it.each([
    ['/', 'Home'],
    ['/demos', 'Demos'],
    ['/stash', 'Stash'],
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
 * One layout serves every width: the icons always render, and the selector's
 * own width, through container queries, decides which names show. A hamburger
 * and a sidebar would put a JS-driven second layout back, which server-renders
 * the wrong one on phones.
 */
describe('Header navigation layout', () => {
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
      ).toEqual(['/', '/demos', '/stash'])
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
      [expect.stringContaining('lucide-backpack'), 'true'],
    ])
    for (const link of nav.getAllByRole('link')) {
      expect(
        link.querySelector('svg')?.nextElementSibling?.textContent
      ).toMatch(/^(Home|Demos|Stash)$/)
    }
  })

  it('draws the name of the current page alone while the selector is narrow', () => {
    const nav = navAt('/demos')

    const words = (name: string) =>
      nav.getByRole('link', { name }).querySelector('.sr-only')

    // Every link keeps its name as text, so it stays nameable when not drawn.
    for (const name of ['Home', 'Demos', 'Stash']) {
      expect(words(name)).toHaveTextContent(name)
      expect(words(name)).toHaveClass('@min-[260px]:not-sr-only')
    }
    expect(words('Demos')).toHaveClass('@min-[150px]:not-sr-only')
    expect(words('Home')).not.toHaveClass('@min-[150px]:not-sr-only')
    expect(words('Stash')).not.toHaveClass('@min-[150px]:not-sr-only')
  })

  it('keeps the name on the section from one of its subpages', () => {
    const nav = navAt('/demos/candlelight')

    expect(
      nav.getByRole('link', { name: 'Demos' }).querySelector('.sr-only')
    ).toHaveClass('@min-[150px]:not-sr-only')
  })

  it('draws no name when the route is outside the nav', () => {
    const nav = navAt('/no-such-page')

    for (const link of nav.getAllByRole('link')) {
      expect(link.querySelector('.sr-only')).not.toHaveClass(
        '@min-[150px]:not-sr-only'
      )
    }
  })

  it('draws no hover underline on the links', () => {
    const nav = navAt('/demos')

    // The animated underline is retired from the nav. Its styles stay in
    // utils.module.css for reuse.
    for (const link of nav.getAllByRole('link')) {
      expect(link.innerHTML).not.toMatch(/Underline|linkTextWrapper/)
    }
  })

  it('keeps the selector one size whichever page is current', () => {
    const sized = ['/', '/demos', '/stash'].map((path) => {
      const classes = navAt(path).getByRole('list').className
      cleanup()
      return classes
    })

    expect(new Set(sized).size).toBe(1)
    expect(sized[0]).toContain('w-full')
  })

  it('draws the outline in the text colour per theme, and leaves the pages muted', () => {
    const nav = navAt('/demos')
    const list = nav.getByRole('list')

    // The body text's own colour in each theme, which the rules under the
    // header also draw in, so the outline does not stay grey on a theme change.
    expect(list).toHaveClass('border-foreground', 'dark:border-gray-100')
    expect(list).not.toHaveClass('border-foreground/50')
    // The pages inside keep their muted colour.
    expect(list).toHaveClass('text-muted-foreground')
    expect(list).not.toHaveClass('text-foreground', 'dark:text-gray-100')
    expect(nav.getByRole('link', { name: 'Home' })).toHaveClass('text-inherit')
  })

  it('stays in the viewport on scroll, under the game shell', () => {
    navAt('/')

    const sticky = screen
      .getByRole('navigation', { name: 'Main navigation' })
      .closest('.sticky')

    expect(sticky).toHaveClass('sticky', 'top-0', 'z-40')
  })
})
