import { fireEvent, render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Sidebar from '../../sections/Sidebar'

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }))

/**
 * Sidebar is parked: no layout mounts it, and jest.config.js ignores this
 * suite, so these cases wait for it to be mounted again.
 */
describe('sidebar', () => {
  beforeEach(() => jest.mocked(usePathname).mockReturnValue('/'))

  it('lists Home, Demos and Resources and nothing after them', () => {
    render(<Sidebar isOpen toggleSidebar={() => {}} />)

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
    const toggle = jest.fn()
    render(<Sidebar isOpen toggleSidebar={toggle} />)

    const close = screen.getByRole('button', { name: 'Close menu' })
    fireEvent.click(close)

    // The shadcn tokens gave a dark glyph and a faint border on the dark panel.
    expect(toggle).toHaveBeenCalledTimes(1)
    expect(close).toHaveClass('dark:text-white', 'dark:border-white')
    expect(close).toHaveClass('text-gray-900', 'border-gray-900')
    expect(close).toHaveClass('border-2')
  })
})
