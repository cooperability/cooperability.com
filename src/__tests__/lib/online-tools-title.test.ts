import { getResourceBySlug } from '../../lib/resources'

describe('OnlineTools resource', () => {
  it('is titled "Online Tools" under its original slug', () => {
    expect(getResourceBySlug('OnlineTools')?.frontMatter.title).toBe(
      '🛠️Online Tools'
    )
  })
})
