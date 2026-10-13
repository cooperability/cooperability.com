import { render, screen } from '@testing-library/react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import Demos from '../../app/demos/page'

function renderAccordion(level?: 2 | 3 | 4) {
  render(
    <Accordion type="single" collapsible>
      <AccordionItem value="one">
        <AccordionTrigger headingLevel={level}>First</AccordionTrigger>
        <AccordionContent>Body</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion heading level', () => {
  it('wraps the trigger in an h2 by default, so it follows a page h1', () => {
    renderAccordion()
    expect(screen.getByRole('heading', { level: 2 })).toContainElement(
      screen.getByRole('button', { name: 'First' })
    )
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })

  it('lets a caller nest the trigger under an h2', () => {
    renderAccordion(3)
    expect(screen.getByRole('heading', { level: 3 })).toContainElement(
      screen.getByRole('button', { name: 'First' })
    )
  })
})

describe('Demos page headings', () => {
  it('descends from the h1 without skipping a level', () => {
    render(<Demos />)
    const levels = screen
      .getAllByRole('heading')
      .map((h) => Number(h.tagName[1]))
    expect(levels[0]).toBe(1)
    levels.slice(1).forEach((level, i) => {
      expect(level).toBeLessThanOrEqual(Math.max(...levels.slice(0, i + 1)) + 1)
    })
    expect(levels).not.toContain(3)
  })
})
