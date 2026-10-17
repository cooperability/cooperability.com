import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import ColorSelect from '../../components/swatch-generator/ColorSelect'
import { EYES } from '../../components/swatch-generator/palette'

// Controlled like the real page, so a selection shows up on the trigger.
function Harness({ initial = 'Hazel' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <ColorSelect
        label="Eyes"
        options={EYES}
        value={value}
        onChange={setValue}
      />
      <button type="button">elsewhere</button>
    </>
  )
}

const combobox = () => screen.getByRole('combobox', { name: 'Eyes' })
const activeName = () => {
  const id = combobox().getAttribute('aria-activedescendant')
  return id ? document.getElementById(id)?.textContent : undefined
}

describe('ColorSelect', () => {
  it('shows every option with a chip in its own color', () => {
    render(<Harness />)
    fireEvent.click(combobox())
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(EYES.length)
    options.forEach((option, i) => {
      expect(option).toHaveTextContent(EYES[i].name)
      expect(within(option).getByTestId('chip')).toHaveStyle({
        background: EYES[i].hex,
      })
    })
  })

  it('shows the selected color on the closed trigger', () => {
    render(<Harness initial="Emerald green" />)
    expect(combobox()).toHaveTextContent('Emerald green')
    expect(within(combobox()).getByTestId('chip')).toHaveStyle({
      background: '#2E8B57',
    })
  })

  it('selects by keyboard and keeps focus on the combobox', () => {
    render(<Harness />)
    combobox().focus()
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' })
    expect(combobox()).toHaveAttribute('aria-expanded', 'true')
    expect(activeName()).toBe('Hazel')
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' })
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' })
    expect(activeName()).toBe('Emerald green')
    fireEvent.keyDown(combobox(), { key: 'Enter' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(combobox()).toHaveTextContent('Emerald green')
    expect(combobox()).toHaveFocus()
  })

  it('jumps to the next option starting with a typed letter', () => {
    render(<Harness />)
    fireEvent.keyDown(combobox(), { key: 'g' })
    expect(activeName()).toBe('Green')
    fireEvent.keyDown(combobox(), { key: 'g' })
    expect(activeName()).toBe('Gray-green')
    fireEvent.keyDown(combobox(), { key: 'G' })
    expect(activeName()).toBe('Gray')
    fireEvent.keyDown(combobox(), { key: 'End' })
    expect(activeName()).toBe(EYES[EYES.length - 1].name)
    fireEvent.keyDown(combobox(), { key: 'Home' })
    expect(activeName()).toBe(EYES[0].name)
  })

  it('closes without changing on Escape or an outside press', () => {
    render(<Harness />)
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' })
    fireEvent.keyDown(combobox(), { key: 'ArrowDown' })
    fireEvent.keyDown(combobox(), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(combobox()).toHaveTextContent('Hazel')

    fireEvent.click(combobox())
    fireEvent.pointerDown(screen.getByRole('button', { name: 'elsewhere' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(combobox()).toHaveTextContent('Hazel')
  })

  it('selects an option by click and marks it selected', () => {
    render(<Harness />)
    fireEvent.click(combobox())
    fireEvent.click(screen.getByRole('option', { name: 'Amber' }))
    expect(combobox()).toHaveTextContent('Amber')
    fireEvent.click(combobox())
    expect(screen.getByRole('option', { name: 'Amber' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })
})
