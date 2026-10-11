import { render, screen } from '@testing-library/react'
import ResourcesList from '../../app/resources/resources-list'
import ResourcePage from '../../app/resources/[slug]/page'

jest.mock('next-mdx-remote/rsc', () => ({ MDXRemote: () => null }))
jest.mock('../../lib/resources', () => ({
  getAllResourcesData: jest.fn(() => []),
  getResourceBySlug: jest.fn(() => ({
    content: '',
    frontMatter: { title: 'Sample', date: '2025-05-18' },
  })),
}))

describe('Resource dates', () => {
  it('labels the date on the resources list', () => {
    render(
      <ResourcesList
        posts={[{ id: 'sample', title: 'Sample', date: '2025-05-18' }]}
      />
    )
    expect(screen.getByText(/last updated/i).textContent).toBe(
      'Last updated May 18, 2025'
    )
  })

  it('labels the date on a resource page', async () => {
    render(await ResourcePage({ params: Promise.resolve({ slug: 'sample' }) }))
    expect(screen.getByText(/last updated/i).textContent).toBe(
      'Last updated May 18, 2025'
    )
  })
})
