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

// One change event per keystroke, each carrying what the field shows now plus
// the new character, the way a browser reports typing into a controlled input.
function typeKeys(input: HTMLElement, keys: string) {
  for (const key of keys) {
    fireEvent.change(input, {
      target: { value: (input as HTMLInputElement).value + key },
    })
  }
}

const SAFE_TOTAL = /^Morphine Equivalence: \d+ mg$/

const CMS_2017_URL =
  'https://web.archive.org/web/20170831231127/https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Opioid-Morphine-EQ-Conversion-Factors-Aug-2017.pdf'

// Typed out from the source tables, not read from the component, so a changed
// factor fails here. CDC 2022 has no buprenorphine, levorphanol, meperidine or
// pentazocine, so those four come from the CMS August 2017 table. Its
// buprenorphine patch row is 12.6 for a 7-day patch, and its footnote gives
// 1.8 as the per-day factor this page uses.
const FACTORS: Array<
  [medication: string, factor: number, source: 'CDC' | 'CMS']
> = [
  ['Butrans', 1.8, 'CMS'],
  ['Codeine', 0.15, 'CDC'],
  ['Duragesic', 2.4, 'CDC'],
  ['Hydrocodone', 1, 'CDC'],
  ['Hydromorphone', 5, 'CDC'],
  ['Levorphanol', 11, 'CMS'],
  ['Meperidine', 0.1, 'CMS'],
  ['Methadone', 4.7, 'CDC'],
  ['Morphine', 1, 'CDC'],
  ['Oxycodone', 1.5, 'CDC'],
  ['Oxymorphone', 3, 'CDC'],
  ['Pentazocine', 0.37, 'CMS'],
  ['Tapentadol', 0.4, 'CDC'],
  ['Tramadol', 0.2, 'CDC'],
]

describe('OpioidConverter', () => {
  it('starts at zero', () => {
    render(<OpioidConverter />)
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
  })

  it('applies the conversion factor for a linear opioid', () => {
    render(<OpioidConverter />)
    // Oxycodone converts at 1.5, so 20mg is 30mg morphine.
    fireEvent.change(doseInputFor('Oxycodone'), { target: { value: '20' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 30 mg')
  })

  it('converts methadone at the CDC 2022 factor of 4.7', () => {
    render(<OpioidConverter />)
    // CDC 2022 guideline Table: methadone 4.7, so 20 mg/day is 94 MME.
    fireEvent.change(doseInputFor('Methadone'), { target: { value: '20' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 94 mg')
    fireEvent.change(doseInputFor('Methadone'), { target: { value: '80' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 376 mg')
  })

  it('lists exactly the cited medications', () => {
    render(<OpioidConverter />)
    const rows = screen.getAllByRole('row').slice(1)
    expect(
      rows.map((row) => within(row).getAllByRole('cell')[0].textContent)
    ).toEqual(
      FACTORS.map(([medication, , source]) =>
        source === 'CMS' ? `${medication}*` : medication
      )
    )
  })

  // A dose of 1000 turns every factor's third decimal place into a whole MME,
  // so a changed factor cannot hide inside the page's rounding.
  it.each(FACTORS)('converts %s at %p (%s)', (medication, factor) => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor(medication), { target: { value: '1000' } })
    expect(morphineTotal()).toBe(
      `Morphine Equivalence: ${Math.round(1000 * factor)} mg`
    )
  })

  it('converts hydromorphone at the CDC 2022 factor of 5', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Hydromorphone'), { target: { value: '10' } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 50 mg')
  })

  it('ties each CMS-sourced row to the footnote naming that table', () => {
    render(<OpioidConverter />)
    expect(screen.getByRole('link', { name: /CMS/ })).toHaveAttribute(
      'href',
      CMS_2017_URL
    )

    for (const [medication, , source] of FACTORS) {
      const input = doseInputFor(medication)
      if (source === 'CMS') {
        expect(input).toHaveAccessibleDescription(
          /Not in the CDC 2022 table.*CMS Opioid Oral MME Conversion Factors/
        )
      } else {
        expect(input).not.toHaveAccessibleDescription()
      }
    }
  })

  it('does not convert a morphine total back into a methadone dose', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    expect(screen.queryByText(/Methadone Equivalence/)).not.toBeInTheDocument()
  })

  it('keeps a decimal dose typed one keystroke at a time', () => {
    render(<OpioidConverter />)
    const input = doseInputFor('Morphine')
    typeKeys(input, '2.5')
    expect(input).toHaveValue('2.5')
    expect(morphineTotal()).toBe('Morphine Equivalence: 3 mg')
  })

  it('keeps a leading zero before the decimal point', () => {
    render(<OpioidConverter />)
    const input = doseInputFor('Morphine')
    typeKeys(input, '0.5')
    expect(input).toHaveValue('0.5')
    expect(morphineTotal()).toBe('Morphine Equivalence: 1 mg')
  })

  it.each(['abc', '-100', '1e400', '.5'])(
    'never shows NaN, a negative or Infinity while typing %s',
    (keys) => {
      render(<OpioidConverter />)
      const input = doseInputFor('Morphine')
      for (const key of keys) {
        typeKeys(input, key)
        expect(morphineTotal()).toMatch(SAFE_TOTAL)
        expect((input as HTMLInputElement).value).toMatch(/^\d*\.?\d*$/)
      }
    }
  )

  it.each([
    ['abc', 'abc'],
    ['-100', '-100'],
    ['1e400', '1e400'],
    ['400 nines', '9'.repeat(400)],
  ])('rejects %s pasted in a single change', (_label, pasted) => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: pasted } })
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
  })

  it('keeps the total finite when a huge dose meets a large factor', () => {
    render(<OpioidConverter />)
    // 308 nines is a finite number near 1e308, but times 11 it overflows.
    fireEvent.change(doseInputFor('Levorphanol'), {
      target: { value: '9'.repeat(308) },
    })
    expect(morphineTotal()).toMatch(SAFE_TOTAL)
  })

  it('shows the clinical-judgment notice and its source', () => {
    render(<OpioidConverter />)
    expect(
      screen.getByText(/not a substitute for clinical judgment/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /CDC Clinical Practice Guideline/i })
    ).toHaveAttribute(
      'href',
      'https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm'
    )
  })

  it('sums across multiple medications', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    fireEvent.change(doseInputFor('Oxycodone'), { target: { value: '20' } })
    // 30*1 + 20*1.5 = 60
    expect(morphineTotal()).toBe('Morphine Equivalence: 60 mg')
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

  it('shows the decimal numpad on mobile for every dose input', () => {
    render(<OpioidConverter />)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
    for (const input of inputs) {
      expect(input).toHaveAttribute('inputmode', 'decimal')
    }
  })

  it('resets every dose with Clear All', () => {
    render(<OpioidConverter />)
    fireEvent.change(doseInputFor('Morphine'), { target: { value: '30' } })
    fireEvent.change(doseInputFor('Codeine'), { target: { value: '60' } })
    expect(morphineTotal()).not.toBe('Morphine Equivalence: 0 mg')

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }))
    expect(morphineTotal()).toBe('Morphine Equivalence: 0 mg')
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
