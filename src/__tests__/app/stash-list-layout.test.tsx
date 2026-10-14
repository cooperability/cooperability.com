import { render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import StashList from '../../app/stash/stash-list'

const posts = [{ id: 'sample', title: 'Sample', date: '2025-05-18' }]

// The server has no viewport, so a row layout picked in JavaScript renders
// one way on the server and swaps on a phone once it hydrates.
describe('Stash list layout', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: originalWidth,
      configurable: true,
    })
  })

  it('server-renders the same row a phone renders', () => {
    // Parsed so both sides share the DOM's attribute spelling.
    const server = document.createElement('div')
    server.innerHTML = renderToString(<StashList posts={posts} />)

    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      configurable: true,
    })
    const { container } = render(<StashList posts={posts} />)

    expect(server.innerHTML).toBe(container.innerHTML)
  })

  it('picks the row layout with breakpoint classes', () => {
    const host = document.createElement('div')
    host.innerHTML = renderToString(<StashList posts={posts} />)
    const item = host.querySelector('li')!

    expect(item.className).toContain('min-[526px]:flex')
    expect(item.getAttribute('style')).toBeNull()
  })
})
