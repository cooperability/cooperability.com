import { renderToString } from 'react-dom/server'
import { render, screen, fireEvent } from '@testing-library/react'
import QuoteBox from '../../app/quote-box'

describe('QuoteBox', () => {
  it('renders the quote it was handed by the server', () => {
    render(<QuoteBox initialQuote="Test quote for testing" />)
    expect(screen.getByText('Test quote for testing')).toBeInTheDocument()
  })

  it('swaps to a different quote on refresh', () => {
    render(<QuoteBox initialQuote="Test quote for testing" />)

    const refreshButton = screen.getByRole('button', {
      name: /get new random quote/i,
    })
    fireEvent.click(refreshButton)

    expect(screen.queryByText('Test quote for testing')).not.toBeInTheDocument()
  })

  it('never re-picks the quote already on screen', () => {
    // The filter in QuoteBox excludes the current quote, so repeated clicks
    // must always land on something new.
    render(<QuoteBox initialQuote="Test quote for testing" />)
    const button = screen.getByRole('button', {
      name: /get new random quote/i,
    })

    let previous = 'Test quote for testing'
    for (let i = 0; i < 10; i++) {
      fireEvent.click(button)
      const current = screen.getByRole('button', {
        name: /get new random quote/i,
      }).parentElement!.nextElementSibling!.textContent
      expect(current).not.toBe(previous)
      previous = current!
    }
  })
})

describe('QuoteBox hydration', () => {
  it('renders identical markup on the server and on the client', () => {
    // `suppressHydrationWarning` sat on the quote span. Under `force-dynamic`
    // the server and the client see the same prop, so it masked nothing — but
    // it would have masked a real mismatch the moment that stopped being true.
    // Removing it only stays safe while this holds.
    const serverHtml = renderToString(<QuoteBox initialQuote="A fixed quote" />)
    const { container } = render(<QuoteBox initialQuote="A fixed quote" />)

    // Round-trip the server string through jsdom first. React's server
    // renderer and jsdom escape attribute text differently (&#x27; against a
    // bare apostrophe), and that is serialization, not a hydration mismatch.
    const normalized = document.createElement('div')
    normalized.innerHTML = serverHtml

    expect(container.innerHTML).toBe(normalized.innerHTML)
  })
})
