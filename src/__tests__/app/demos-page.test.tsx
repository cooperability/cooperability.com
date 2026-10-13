import { render, screen, within } from '@testing-library/react'
import Demos from '../../app/demos/page'

const SUB_PROJECTS = [
  'Candlelight',
  'Prompt Composer',
  'Mandelbrot Explorer',
  'Opioid Converter',
]

describe('Demos page', () => {
  it('links remediate.app to the live site, not its repository', () => {
    render(<Demos />)
    expect(screen.getByRole('link', { name: 'remediate.app' })).toHaveAttribute(
      'href',
      'https://remediate.app'
    )
  })

  it('shows no stack icons on the sub-projects under cooperability.com', () => {
    render(<Demos />)
    for (const name of SUB_PROJECTS) {
      const row = screen
        .getByRole('link', { name: new RegExp(name) })
        .closest('.subProjectItem') as HTMLElement
      expect(row).not.toBeNull()
      expect(row.querySelectorAll('img')).toHaveLength(0)
    }
  })

  it('keeps Node.js on the cooperability.com row itself', () => {
    render(<Demos />)
    // The row also contains the sub-projects, so scope to its own icon list.
    const umbrella = screen
      .getByRole('link', { name: /^cooperability\.com/ })
      .closest('.projectItem')!
      .querySelector(':scope > .techStackIcons') as HTMLElement
    expect(within(umbrella).getByAltText('Node.js logo')).toBeInTheDocument()
    expect(within(umbrella).getByAltText('Next.js logo')).toBeInTheDocument()
  })

  it('names the platforms of a demo for screen readers', () => {
    render(<Demos />)
    expect(
      screen.getByRole('link', { name: 'Candlelight Desktop Mobile Game' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Personnel Portal Presentation' })
    ).toBeInTheDocument()
  })
})
