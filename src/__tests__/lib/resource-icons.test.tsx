import { render, screen } from '@testing-library/react'
import ResourceIcon, { RESOURCE_ICONS } from '../../components/ResourceIcon'
import { getAllResourcesData } from '../../lib/resources'
import ResourcesList from '../../app/resources/resources-list'

describe('resource icons', () => {
  it('resolves every icon a resource names in its front matter', () => {
    const named = getAllResourcesData().filter(({ icon }) => icon)

    expect(named.map(({ id }) => id).sort()).toEqual([
      'LLMPrompts',
      'OnlineTools',
      'linktree',
    ])
    for (const { icon } of named) {
      expect(RESOURCE_ICONS).toHaveProperty([icon!])
    }
  })

  it('renders nothing for a resource with no icon, or an unknown one', () => {
    const { container, rerender } = render(<ResourceIcon />)
    expect(container).toBeEmptyDOMElement()

    rerender(<ResourceIcon name="no-such-icon" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the icon beside the title without adding to the link name', () => {
    render(
      <ResourcesList
        posts={[{ id: 'tools', title: 'Online Tools', icon: 'wrench' }]}
      />
    )

    const link = screen.getByRole('link', { name: 'Online Tools' })
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
