import { render, screen, fireEvent } from '@testing-library/react'
import PromptComposer from '../../components/prompt-composer/PromptComposer'

/**
 * The edit buffer is adjusted during render rather than synced in an effect.
 * That pattern is only correct if the very first render also takes the sync
 * branch: seeding `lastCompiled` to the compiled value instead of null made the
 * two agree before the buffer had ever been filled, so the textarea never
 * rendered at all and Copy stayed disabled.
 */
describe('PromptComposer', () => {
  it('opens with the compiled default prompt already in the textarea', () => {
    render(<PromptComposer />)

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    expect(textarea.value).toContain('accessible language')
  })

  it('enables Copy on mount, because there is a prompt to copy', () => {
    render(<PromptComposer />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeEnabled()
  })

  it('recompiles the buffer when the audience is switched', () => {
    render(<PromptComposer />)
    const before = (screen.getByRole('textbox') as HTMLTextAreaElement).value
    expect(before).toContain('accessible language')

    // The switch sits inside a collapsed accordion section, so it has to be
    // opened before the control exists in the DOM.
    fireEvent.click(screen.getByRole('button', { name: /audience/i }))
    fireEvent.click(screen.getByRole('switch'))

    const after = (screen.getByRole('textbox') as HTMLTextAreaElement).value
    expect(after).toContain('strong technical background')
    expect(after).not.toBe(before)
  })
})
