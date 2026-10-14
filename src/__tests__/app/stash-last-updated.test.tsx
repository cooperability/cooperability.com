import { render, screen } from '@testing-library/react'
import StashList from '../../app/stash/stash-list'
import StashEntryPage from '../../app/stash/[slug]/page'

jest.mock('next-mdx-remote/rsc', () => ({ MDXRemote: () => null }))
jest.mock('../../lib/stash', () => ({
  getAllStashData: jest.fn(() => []),
  getStashBySlug: jest.fn(() => ({
    content: '',
    frontMatter: { title: 'Sample', date: '2025-05-18' },
  })),
}))

describe('Stash dates', () => {
  it('labels the date on the stash list', () => {
    render(
      <StashList
        posts={[{ id: 'sample', title: 'Sample', date: '2025-05-18' }]}
      />
    )
    expect(screen.getByText(/last updated/i).textContent).toBe(
      'Last updated May 18, 2025'
    )
  })

  it('labels the date on a stash page', async () => {
    render(await StashEntryPage({ params: Promise.resolve({ slug: 'sample' }) }))
    expect(screen.getByText(/last updated/i).textContent).toBe(
      'Last updated May 18, 2025'
    )
  })
})
