import { fireEvent, render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Header from '../../sections/Header'
import Footer from '../../sections/Footer'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

/**
 * Mobile is a JS breakpoint (useResponsive), so these drive the real Header at
 * a phone width. jsdom applies no stylesheet, so colour and weight are checked
 * as the utility classes that carry them; the computed result was checked in a
 * browser.
 */
const DESKTOP_WIDTH = window.innerWidth

function renderAt(width: number) {
  window.innerWidth = width
  jest.mocked(usePathname).mockReturnValue('/')
  return render(<Header />)
}

afterEach(() => {
  window.innerWidth = DESKTOP_WIDTH
})

describe('mobile sidebar', () => {
  it('lists Home, Demos and Resources and nothing after them', () => {
    renderAt(400)

    const nav = screen.getByRole('navigation', { name: /sidebar navigation/i })

    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['| Home |', '| Demos |', '| Resources |'])
    expect(screen.queryByText(/linktree/i)).not.toBeInTheDocument()
    expect(nav.querySelector('.horizLine')).toBeNull()
  })

  it('draws its close button in a colour that shows on the panel, in both themes', () => {
    renderAt(400)
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }))

    const close = screen.getByRole('button', { name: 'Close menu' })

    // The shadcn tokens gave a dark glyph and a faint border on the dark panel.
    expect(close).toHaveClass('dark:text-white', 'dark:border-white')
    expect(close).toHaveClass('text-gray-900', 'border-gray-900')
    expect(close).toHaveClass('border-2')
  })
})

describe('outline buttons', () => {
  it('weighs the mobile menu button at 2px, not the 1px a className once forced', () => {
    renderAt(400)

    const open = screen.getByRole('button', { name: 'Open menu' })

    expect(open).toHaveClass('border-2')
    expect(open).not.toHaveClass('border')
  })

  it('weighs the footer more-links button at 2px', () => {
    render(<Footer />)

    // Weight alone left a 1.25:1 line on white, so the colour moved too.
    expect(screen.getByRole('link', { name: 'More links' })).toHaveClass(
      'border-2',
      'border-foreground/50'
    )
  })

  it('weighs the outer outline of the desktop nav at 2px', () => {
    renderAt(DESKTOP_WIDTH)

    const nav = screen.getByRole('navigation', { name: 'Main navigation' })

    expect(within(nav).getByRole('list')).toHaveClass(
      'border-2',
      'border-foreground/50'
    )
    expect(within(nav).getByRole('list')).not.toHaveClass('border')
  })
})
