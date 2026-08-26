import { render, screen, fireEvent, within } from '@testing-library/react'
import OpioidConverter from '../../components/opioid-converter/OpioidConverter'

/**
 * Equivalences are derived during render rather than mirrored into state by an
 * effect. These lock the arithmetic down so that refactor cannot drift: this is
 * a dosage calculator, and a silently wrong total is the worst failure it has.
 */

function doseInputFor(medication: string) {
  const cell = screen.getByRole('cell', { name: medication })
  return within(cell.closest('tr')!).getByRole('textbox')
}

function morphineTotal() {
  return screen.getByText(/Morphine Equivalence:/).textContent
}

function methadoneTotal() {
  return screen.getByText(/Methadone Equivalence:/).textContent
}

describe('OpioidConverter', () => {
  it('starts at zero for both equivalences', () => {
    render(<OpioidConverter />)
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
    expect(methadoneTotal()).toBe('Methadone Equivalence: 0 mg')
  })

  it('applies the conversion factor for a linear opioid', () => {
    render(<OpioidConverter />)
    // Oxycodone converts at 1.5, so 20mg is 30mg morphine.
    fireEvent.change(doseInputFor('Oxycodone'), { target: { value: '20' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 30 mg')
  })

  it('squares the methadone dose rather than scaling it linearly', () => {
    render(<OpioidConverter />)
    // Methadone is deliberately non-linear: 10mg -> 10^2 = 100mg morphine,
    // and its own toMorphine factor is unused on this path.
    fireEvent.change(doseInputFor('Methadone'), { target: { value: '10' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 100 mg')
  })

  it('sums across multiple medications', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    fireEvent.change(doseInputFor('Oxycodone'), { target: { value: '20' } })
    // 30*1 + 20*1.5 = 60
    expect(morphineTotal()).toBe('Morphine Equivalence: 60 mg')
  })

  it('derives methadone equivalence from the unrounded morphine total', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    // sqrt(30 * 4) = 10.954..., rounded once at the end
    expect(methadoneTotal()).toBe('Methadone Equivalence: 11 mg')
  })

  it('steps a dose by the medication increment', () => {
    render(<OpioidConverter />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Increase Morphine dose by 5 mg' })
    )
    expect(morphineTotal()).toBe('Morphine Equivalence: 5 mg')
  })

  it('treats a cleared input as zero rather than NaN', () => {
    render(<OpioidConverter />)
    const input = doseInputFor('Morphine')
    fireEvent.change(input, { target: { value: '30' } })
    fireEvent.change(input, { target: { value: '' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
  })

  it('resets every dose with Clear All', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    fireEvent.change(doseInputFor('Codeine'), { target: { value: '60' } })
    expect(morphineTotal()).not.toBe('Morphine Equivalence: 0 mg')

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
    expect(methadoneTotal()).toBe('Methadone Equivalence: 0 mg')
  })
})
