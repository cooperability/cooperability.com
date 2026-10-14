import { render, screen } from '@testing-library/react'
import StashIcon, { STASH_ICONS } from '../../components/StashIcon'
import { getAllStashData } from '../../lib/stash'
import StashList from '../../app/stash/stash-list'

describe('stash icons', () => {
  it('resolves every icon an entry names in its front matter', () => {
    const named = getAllStashData().filter(({ icon }) => icon)

    expect(named.map(({ id }) => id).sort()).toEqual([
      'LLMPrompts',
      'OnlineTools',
      'linktree',
    ])
    for (const { icon } of named) {
      expect(STASH_ICONS).toHaveProperty([icon!])
    }
  })

  it('renders nothing for an entry with no icon, or an unknown one', () => {
    const { container, rerender } = render(<StashIcon />)
    expect(container).toBeEmptyDOMElement()

    rerender(<StashIcon name="no-such-icon" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the icon beside the title without adding to the link name', () => {
    render(
      <StashList
        posts={[{ id: 'tools', title: 'Online Tools', icon: 'wrench' }]}
      />
    )

    const link = screen.getByRole('link', { name: 'Online Tools' })
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
