import type { MedicationItem, OpioidOption } from '../types'

export const OPIOID_OPTIONS: OpioidOption[] = [
  { value: 'morphine', label: 'Morphine', factor: 1 },
  { value: 'fentanyl', label: 'Fentanyl', factor: 100 },
  { value: 'hydromorphone', label: 'Hydromorphone', factor: 5 },
  { value: 'oxycodone', label: 'Oxycodone', factor: 1.5 },
  { value: 'hydrocodone', label: 'Hydrocodone', factor: 1 },
  { value: 'codeine', label: 'Codeine', factor: 0.15 },
]

export const calculateEquivalent = (
  inputDose: number,
  inputDrug: string,
  outputDrug: string
): number => {
  const inputOption = OPIOID_OPTIONS.find((opt) => opt.value === inputDrug)
  const outputOption = OPIOID_OPTIONS.find((opt) => opt.value === outputDrug)

  if (!inputOption || !outputOption) {
    throw new Error('Invalid drug selection')
  }

  const morphineEquivalent = inputDose * inputOption.factor
  return Number((morphineEquivalent / outputOption.factor).toFixed(2))
}

/**
 * Total morphine-equivalent and methadone-equivalent daily dose for a list of
 * medications.
 *
 * EXTRACTED VERBATIM from OpioidConverter's inline `calculateEquivalents`.
 * The arithmetic is unchanged, including the three behaviours below, which are
 * pinned by tests in `__tests__/calculations.test.ts`. They are described here
 * because they look like mistakes and a future reader will be tempted to
 * "fix" them without clinical input:
 *
 * 1. Methadone is special-cased to `dose ** 2` rather than `dose * toMorphine`.
 *    Methadone's potency really is non-linear in the daily dose, so a
 *    special case is expected -- but this specific curve is unverified here.
 *
 * 2. Because of (1), Methadone's `toMorphine: 0.25` is DEAD DATA. Nothing
 *    reads it. Anyone editing that number would see no effect.
 *
 * 3. The two results round differently. `morphineEq` is the rounded total,
 *    but `methadoneEq` is derived from the UNROUNDED total before rounding
 *    itself. So methadoneEq is not always `Math.round(Math.sqrt(morphineEq * 4))`.
 *
 * None of the three is changed here. This function exists so the values can be
 * asserted without rendering, and so the component can compute during render
 * instead of syncing state through an effect.
 */
export const calculateTotals = (
  medications: readonly MedicationItem[]
): { morphineEq: number; methadoneEq: number } => {
  let morphineTotal = 0

  medications.forEach((med) => {
    let equivalence = med.dailyDose
    if (med.display === 'Methadone') {
      equivalence = Math.pow(equivalence, 2)
    } else {
      equivalence *= med.toMorphine
    }
    morphineTotal += equivalence
  })

  return {
    morphineEq: Math.round(morphineTotal),
    methadoneEq: Math.round(Math.sqrt(morphineTotal * 4)),
  }
}
