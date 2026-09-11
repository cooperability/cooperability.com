import { Profiler } from 'react'
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

/**
 * Everything above passes just as well against the `useState` + `useEffect`
 * mirror this component's rewrite removed, because `fireEvent` flushes effects
 * before the assertion runs and the stale paint is already gone by then. The
 * difference between deriving during render and mirroring into state is only
 * observable *between* commits: the mirror paints once with the previous total
 * still on screen, then again with the new one.
 *
 * `Profiler.onRender` fires once per commit, during the layout phase, which is
 * after React has mutated the DOM. Reading the DOM there is what catches that
 * intermediate frame.
 */
describe('OpioidConverter render passes', () => {
  function renderWithCommitLog() {
    const commits: Array<{ dose: string; total: string }> = []
    render(
      <Profiler
        id="opioid-converter"
        onRender={() => {
          commits.push({
            dose: (doseInputFor('Morphine') as HTMLInputElement).value,
            total: morphineTotal()!,
          })
        }}
      >
        <OpioidConverter />
      </Profiler>
    )
    return commits
  }

  it('never paints a total that disagrees with the dose on screen', () => {
    const commits = renderWithCommitLog()
    commits.length = 0

    // Morphine converts at 1, so the total must equal the dose in the very
    // same frame the dose appears in.
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })

    expect(commits.length).toBeGreaterThan(0)
    for (const { dose, total } of commits) {
      expect(total).toBe(`Morphine Equivalence: ${Number(dose || 0)} mg`)
    }
  })

  it('reaches the new total in a single commit', () => {
    const commits = renderWithCommitLog()
    commits.length = 0

    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })

    expect(commits).toEqual([
      { dose: '30', total: 'Morphine Equivalence: 30 mg' },
    ])
  })
})
