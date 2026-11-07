import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import ColorSelect from '../../components/swatch-generator/ColorSelect'
import { EYES } from '../../components/swatch-generator/palette'

// Radix Select calls these, and jsdom does not implement them.
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
})

// Controlled like the real page, so a selection shows up on the trigger.
function Harness({ initial = 'Hazel' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <ColorSelect
      label="Eyes"
      options={EYES}
      value={value}
      onChange={setValue}
    />
  )
}

const combobox = () => screen.getByRole('combobox', { name: 'Eyes' })
const open = () => fireEvent.keyDown(combobox(), { key: 'Enter' })

describe('ColorSelect', () => {
  it('shows every option with a chip in its own color', () => {
    render(<Harness />)
    open()
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(EYES.length)
    options.forEach((option, i) => {
      expect(option).toHaveTextContent(EYES[i].name)
      expect(within(option).getByTestId('chip')).toHaveStyle({
        background: EYES[i].hex,
      })
    })
  })

  it('shows the picked color on the closed trigger', () => {
    render(<Harness />)
    open()
    fireEvent.click(screen.getByRole('option', { name: 'Gray-green' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(combobox()).toHaveTextContent('Gray-green')
    expect(within(combobox()).getByTestId('chip')).toHaveStyle({
      background: EYES.find((e) => e.name === 'Gray-green')!.hex,
    })
  })

  it('closes on Escape without changing the pick', () => {
    render(<Harness />)
    open()
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(combobox()).toHaveTextContent('Hazel')
  })
})
