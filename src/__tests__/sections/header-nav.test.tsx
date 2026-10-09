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
