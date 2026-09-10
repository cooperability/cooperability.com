import { renderToString } from 'react-dom/server'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import Sidebar from '../../sections/Sidebar'

/**
 * next-themes cannot know the theme while rendering on the server, so any
 * server-rendered client component that branches on it emits one thing on the
 * server and another on the hydration render. React reports that as a
 * hydration mismatch and does not patch it up.
 *
 * The invariant that prevents it: server markup is theme-independent, and the
 * theme only takes effect after hydration.
 */

// jsdom ships no matchMedia, and next-themes calls it whenever enableSystem is
// on. The site always enables it, so every theme test needs the stub.
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

// ThemeProvider emits its own no-flash <script>, whose arguments carry the
// theme settings. Only the Sidebar's markup is under test here.
function sidebarMarkup(theme: 'light' | 'dark') {
  const html = renderToString(
    <ThemeProvider attribute="class" enableSystem defaultTheme={theme}>
      <Sidebar isOpen={false} toggleSidebar={() => {}} />
    </ThemeProvider>
  )
  return html.slice(html.indexOf('<div class="sidebar'))
}

describe('Sidebar theming', () => {
  it('renders identical server markup whatever the theme resolves to', () => {
    expect(sidebarMarkup('dark')).toBe(sidebarMarkup('light'))
  })

  it('emits no dark styling on the server, even when the theme is dark', () => {
    const html = sidebarMarkup('dark')
    expect(html).toContain('sidebarLight')
    expect(html).not.toContain('sidebarDark')
    // The inverse colour variables were the other half of the reported
    // mismatch, so they have to hold the same invariant.
    expect(html).toContain('--inverse-bg:#000000')
  })

  it('applies the dark theme once hydrated', () => {
    render(
      <ThemeProvider attribute="class" enableSystem defaultTheme="dark">
        <Sidebar isOpen={false} toggleSidebar={() => {}} />
      </ThemeProvider>
    )

    const sidebar = screen
      .getByRole('navigation', { name: /sidebar navigation/i })
      .closest('div')

    expect(sidebar?.className).toContain('sidebarDark')
    expect(sidebar?.getAttribute('style')).toContain('--inverse-bg: #ffffff')
  })
})
