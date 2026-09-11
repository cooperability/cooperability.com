import { render, screen } from '@testing-library/react'
import Home from '../../app/page'

// `app/page.tsx` is a Server Component, but a synchronous one — it only calls
// the pure `getRandomQuote()`. That keeps it renderable under jsdom.
describe('Home page', () => {
  it('renders the introductory copy', () => {
    render(<Home />)
    expect(screen.getByText(/Cooper!/i)).toBeInTheDocument()
  })

  it('renders navigation links with correct href attributes', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /tools/i })).toHaveAttribute(
      'href',
      '/demos'
    )
    expect(screen.getByRole('link', { name: /knowledge/i })).toHaveAttribute(
      'href',
      '/resources'
    )
    expect(
      screen.getByRole('link', { name: /Prompt Composer/i })
    ).toHaveAttribute('href', '/demos/prompt-composer')
    expect(
      screen.getByRole('link', { name: /Mandelbrot Explorer/i })
    ).toHaveAttribute('href', '/demos/mandelbrot-explorer')
  })

  it('renders the profile image with correct alt text', () => {
    render(<Home />)
    expect(
      screen.getByAltText('Cooper Reed - Full Stack Engineer')
    ).toBeInTheDocument()
  })

  it('emits Person JSON-LD, which the Metadata API cannot express', () => {
    const { container } = render(<Home />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    expect(JSON.parse(script!.innerHTML)).toMatchObject({
      '@type': 'Person',
      name: 'Cooper Reed',
    })
  })
})
