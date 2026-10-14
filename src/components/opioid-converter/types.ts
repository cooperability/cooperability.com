export type MedicationItem = {
  display: string
  increment: number
  unit: string
  // The raw text in the dose field, so "2." and "0." survive mid-typing.
  dailyDose: string
  toMorphine: number
  // Sourced from the CMS 2017 table because CDC 2022 does not list it.
  cmsFactor?: boolean
}
