import { render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Header from '../../sections/Header'
import Footer from '../../sections/Footer'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

/**
 * The header is one layout at every width, so these drive it at a phone width
 * and a desktop one. jsdom applies no stylesheet, so colour and weight are
 * checked as the utility classes that carry them; the computed result was
 * checked in a browser.
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

describe('outline buttons', () => {
  it('weighs the footer more-links button at 2px', () => {
    render(<Footer />)

    // Weight alone left a 1.25:1 line on white, so the colour moved too: the
    // link blue, text and outline alike, as on the demos page.
    const more = screen.getByRole('link', { name: 'More links' })
    expect(more).toHaveClass('border-2', 'border-current')
    expect(more).not.toHaveClass('border-foreground/50', 'text-foreground')
  })

  it('darkens the outline on keyboard focus instead of fading it', () => {
    render(<Footer />)

    // The shared ring colour sits at 2.63:1 on white, below the resting border.
    const more = screen.getByRole('link', { name: 'More links' })
    expect(more).toHaveClass('focus-visible:border-foreground')
    expect(more).not.toHaveClass('focus-visible:border-ring')
  })

  it.each([400, DESKTOP_WIDTH])(
    'weighs the outer outline of the nav at 2px at %ipx wide',
    (width) => {
      renderAt(width)

      const nav = screen.getByRole('navigation', { name: 'Main navigation' })

      expect(within(nav).getByRole('list')).toHaveClass(
        'border-2',
        'border-foreground',
        'dark:border-gray-100'
      )
      expect(within(nav).getByRole('list')).not.toHaveClass('border')
    }
  )
})
