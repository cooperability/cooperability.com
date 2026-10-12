import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import ThemeSwitch from '../../components/ThemeSwitch'

/**
 * The switch has three settings. "System" is the one that matters: it hands
 * the choice back to the OS, so it has to be stored as "system" and not as the
 * theme the OS happened to have. Driven through the real next-themes provider,
 * because the stored value and the class on <html> are what a visitor gets.
 */
let systemIsDark = false

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return systemIsDark
      },
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

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
  systemIsDark = false
})

function renderSwitch() {
  return render(
    <ThemeProvider attribute="class" enableSystem>
      <ThemeSwitch />
    </ThemeProvider>
  )
}

const radio = (name: string) => screen.getByRole('radio', { name })
const html = () => document.documentElement

describe('ThemeSwitch', () => {
  it('offers light, system and dark, with system chosen until a visitor picks', () => {
    renderSwitch()

    expect(
      screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label'))
    ).toEqual(['Light', 'System', 'Dark'])
    expect(radio('System')).toBeChecked()
    expect(radio('Light')).not.toBeChecked()
    expect(radio('Dark')).not.toBeChecked()
  })

  it('stores an explicit choice and applies it whatever the OS says', () => {
    systemIsDark = true
    renderSwitch()

    fireEvent.click(radio('Light'))
    expect(localStorage.getItem('theme')).toBe('light')
    expect(html()).toHaveClass('light')
    expect(radio('Light')).toBeChecked()

    fireEvent.click(radio('Dark'))
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(html()).toHaveClass('dark')
  })

  it.each([
    [true, 'dark'],
    [false, 'light'],
  ])(
    'follows the OS back to %s after "System" is picked',
    (osIsDark, expected) => {
      systemIsDark = osIsDark
      renderSwitch()
      // The opposite of what the OS prefers, so only "System" can restore it.
      fireEvent.click(radio(osIsDark ? 'Light' : 'Dark'))
      expect(html()).not.toHaveClass(expected)

      fireEvent.click(radio('System'))

      expect(localStorage.getItem('theme')).toBe('system')
      expect(radio('System')).toBeChecked()
      expect(html()).toHaveClass(expected)
    }
  )
})
