import {
  calculateTotals,
  calculateEquivalent,
  OPIOID_OPTIONS,
} from '@/src/components/opioid-converter/utils/calculations'
import type { MedicationItem } from '@/src/components/opioid-converter/types'

/**
 * CHARACTERISATION TESTS.
 *
 * These pin the arithmetic this calculator performs TODAY. They are not a
 * clinical review and they do not assert that any of these numbers are
 * medically correct -- several of them are flagged below as worth a
 * clinician's eye. Their job is narrower and specific: make the behaviour
 * observable, so the component can be refactored (state + effect -> compute
 * during render) with proof that nothing moved.
 *
 * If a test here fails after a refactor, the refactor changed a dose. That is
 * the entire point.
 */

const med = (
  display: string,
  toMorphine: number,
  dailyDose: number
): MedicationItem => ({
  display,
  increment: 1,
  unit: 'mg',
  dailyDose,
  toMorphine,
})

describe('calculateTotals', () => {
  it('returns zero for an empty list', () => {
    expect(calculateTotals([])).toEqual({ morphineEq: 0, methadoneEq: 0 })
  })

  it('returns zero when every dose is zero', () => {
    const meds = [med('Morphine', 1, 0), med('Codeine', 0.15, 0)]
    expect(calculateTotals(meds)).toEqual({ morphineEq: 0, methadoneEq: 0 })
  })

  it('multiplies a single medication by its morphine factor', () => {
    // 100 mg morphine -> 100 MED; methadone = round(sqrt(100 * 4)) = 20
    expect(calculateTotals([med('Morphine', 1, 100)])).toEqual({
      morphineEq: 100,
      methadoneEq: 20,
    })
  })

  it('applies a sub-unit factor', () => {
    // 60 mg codeine * 0.15 = 9 MED; methadone = round(sqrt(36)) = 6
    expect(calculateTotals([med('Codeine', 0.15, 60)])).toEqual({
      morphineEq: 9,
      methadoneEq: 6,
    })
  })

  it('sums across multiple medications', () => {
    // 30*1 + 20*1.5 + 10*4 = 30 + 30 + 40 = 100 MED
    const meds = [
      med('Morphine', 1, 30),
      med('Oxycodone', 1.5, 20),
      med('Hydromorphone', 4, 10),
    ]
    expect(calculateTotals(meds)).toEqual({ morphineEq: 100, methadoneEq: 20 })
  })

  describe('the Methadone special case', () => {
    it('squares the daily dose instead of applying a factor', () => {
      // 10 mg methadone -> 10^2 = 100 MED, NOT 10 * 0.25 = 2.5
      expect(calculateTotals([med('Methadone', 0.25, 10)])).toEqual({
        morphineEq: 100,
        methadoneEq: 20,
      })
    })

    it("ignores Methadone's toMorphine entirely -- it is dead data", () => {
      // Changing the factor must not move the result, because the squaring
      // branch never reads it. If this test starts failing, someone wired
      // toMorphine back in and every methadone conversion just changed.
      const withStatedFactor = calculateTotals([med('Methadone', 0.25, 8)])
      const withAbsurdFactor = calculateTotals([med('Methadone', 999, 8)])
      expect(withStatedFactor).toEqual(withAbsurdFactor)
      expect(withStatedFactor.morphineEq).toBe(64)
    })

    it('matches only on the exact display string', () => {
      // The branch is keyed on `display === 'Methadone'`, so any other
      // spelling silently takes the multiply path.
      expect(calculateTotals([med('methadone', 0.25, 10)]).morphineEq).toBe(3)
    })

    it('combines the squared methadone dose with linear ones', () => {
      // 5^2 + 50*1 = 25 + 50 = 75 MED
      const meds = [med('Methadone', 0.25, 5), med('Morphine', 1, 50)]
      expect(calculateTotals(meds).morphineEq).toBe(75)
    })
  })

  describe('rounding', () => {
    it('rounds the morphine total half-up', () => {
      // 12.5 MED -> 13 (JavaScript Math.round is half-up, not banker's)
      expect(calculateTotals([med('Morphine', 1, 12.5)]).morphineEq).toBe(13)
    })

    it('derives methadone from the UNROUNDED morphine total', () => {
      // This is the asymmetry worth knowing about. A total of 0.45 MED
      // rounds to 0 morphine, but methadone is computed from 0.45 --
      // sqrt(0.45 * 4) = 1.34 -- and rounds to 1.
      //
      // So the UI can display "0 mg morphine" beside "1 mg methadone".
      // That is the current behaviour, pinned deliberately, and it is the
      // clearest single argument for having a clinician review this file.
      const result = calculateTotals([med('Codeine', 0.15, 3)])
      expect(result).toEqual({ morphineEq: 0, methadoneEq: 1 })

      // Confirm it is genuinely not derived from the rounded value.
      expect(result.methadoneEq).not.toBe(
        Math.round(Math.sqrt(result.morphineEq * 4))
      )
    })
  })

  it('does not mutate the input', () => {
    const meds = [med('Morphine', 1, 40)]
    const snapshot = JSON.parse(JSON.stringify(meds))
    calculateTotals(meds)
    expect(meds).toEqual(snapshot)
  })
})

describe('calculateEquivalent', () => {
  it('converts between two drugs through their morphine factors', () => {
    // 30 mg morphine -> oxycodone (factor 1.5): 30 * 1 / 1.5 = 20
    expect(calculateEquivalent(30, 'morphine', 'oxycodone')).toBe(20)
  })

  it('is a no-op when input and output are the same drug', () => {
    expect(calculateEquivalent(45, 'hydromorphone', 'hydromorphone')).toBe(45)
  })

  it('rounds to two decimal places', () => {
    // 10 * 1 / 0.15 = 66.666... -> 66.67
    expect(calculateEquivalent(10, 'morphine', 'codeine')).toBe(66.67)
  })

  it('throws on an unknown input drug', () => {
    expect(() => calculateEquivalent(10, 'aspirin', 'morphine')).toThrow(
      'Invalid drug selection'
    )
  })

  it('throws on an unknown output drug', () => {
    expect(() => calculateEquivalent(10, 'morphine', 'aspirin')).toThrow(
      'Invalid drug selection'
    )
  })

  it('exposes a factor for every listed opioid', () => {
    // A property test rather than six assertions: catches a future entry
    // added with a missing, zero or negative factor, any of which would
    // produce Infinity or a negative dose.
    for (const opt of OPIOID_OPTIONS) {
      expect(typeof opt.factor).toBe('number')
      expect(opt.factor).toBeGreaterThan(0)
      expect(Number.isFinite(opt.factor)).toBe(true)
    }
  })
})
