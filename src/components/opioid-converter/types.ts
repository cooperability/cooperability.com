export interface OpioidOption {
  value: string
  label: string
  factor: number
}

export interface CalculationResult {
  equivalent: number
  inputDrug: string
  outputDrug: string
}

export type MedicationItem = {
  display: string
  increment: number
  unit: string
  // The raw text in the dose field, so "2." and "0." survive mid-typing.
  dailyDose: string
  toMorphine: number
}
