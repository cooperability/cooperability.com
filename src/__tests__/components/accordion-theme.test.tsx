import { renderToString } from 'react-dom/server'
import { ThemeProvider } from 'next-themes'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

/**
 * The accordion is server-rendered on /demos and /resources/[slug], and it
 * branches on the theme for its background and text colours. Same invariant as
 * the Sidebar: the server cannot know the theme, so its markup must not depend
 * on one.
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

// ThemeProvider emits its own no-flash <script>, whose arguments carry the
// theme settings. Only the accordion's markup is under test here.
function accordionMarkup(theme: 'light' | 'dark') {
  const html = renderToString(
    <ThemeProvider attribute="class" enableSystem defaultTheme={theme}>
      <Accordion type="single" collapsible>
        <AccordionItem value="one">
          <AccordionTrigger>Trigger</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>
    </ThemeProvider>
  )
  return html.slice(html.indexOf('<div data-slot="accordion"'))
}

describe('Accordion theming', () => {
  it('renders identical server markup whatever the theme resolves to', () => {
    expect(accordionMarkup('dark')).toBe(accordionMarkup('light'))
  })

  it('emits the light palette on the server, even when the theme is dark', () => {
    const html = accordionMarkup('dark')
    expect(html).toContain('bg-gray-100')
    expect(html).not.toContain('bg-gray-800')
  })
})
