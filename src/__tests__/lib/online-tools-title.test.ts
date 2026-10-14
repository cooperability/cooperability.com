import { getStashBySlug } from '../../lib/stash'

describe('OnlineTools entry', () => {
  it('is titled "Online Tools" under its original slug', () => {
    expect(getStashBySlug('OnlineTools')?.frontMatter.title).toBe(
      'Online Tools'
    )
  })
})
