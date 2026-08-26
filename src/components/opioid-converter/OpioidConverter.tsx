import { useState, useCallback, useMemo } from 'react'
import styles from './OpioidConverter.module.css'
import { MedicationItem } from './types'
import { calculateTotals } from './utils/calculations'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

const MEDICATION_ARRAY: MedicationItem[] = [
  {
    display: 'Butrans',
    increment: 5,
    unit: 'µg/h',
    dailyDose: 0,
    toMorphine: 4.5,
  },
  {
    display: 'Codeine',
    increment: 30,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.15,
  },
  {
    display: 'Duragesic',
    increment: 12.5,
    unit: 'µg/h',
    dailyDose: 0,
    toMorphine: 2.4,
  },
  {
    display: 'Hydrocodone',
    increment: 2.5,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 1,
  },
  {
    display: 'Hydromorphone',
    increment: 2,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 4,
  },
  {
    display: 'Levorphanol',
    increment: 2,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 7.5,
  },
  {
    display: 'Meperidine',
    increment: 50,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.1,
  },
  {
    display: 'Methadone',
    increment: 5,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.25,
  },
  {
    display: 'Morphine',
    increment: 5,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 1,
  },
  {
    display: 'Oxycodone',
    increment: 5,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 1.5,
  },
  {
    display: 'Oxymorphone',
    increment: 2.5,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 3,
  },
  {
    display: 'Pentazocin',
    increment: 30,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.2,
  },
  {
    display: 'Tapentadol',
    increment: 25,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.367,
  },
  {
    display: 'Tramadol',
    increment: 50,
    unit: 'mg',
    dailyDose: 0,
    toMorphine: 0.2,
  },
]

const OpioidConverter = () => {
  const [medications, setMedications] =
    useState<MedicationItem[]>(MEDICATION_ARRAY)
  const [activeInput, setActiveInput] = useState<number | null>(null)

  // Derived from `medications`, so computed during render rather than held in
  // state and re-synced by an effect. The previous shape cost a second render
  // pass on every keystroke. The arithmetic itself is unchanged -- it moved
  // verbatim into calculateTotals, which is pinned by characterisation tests
  // in src/__tests__/components/opioid-converter/calculations.test.ts.
  const { morphineEq, methadoneEq } = useMemo(
    () => calculateTotals(medications),
    [medications]
  )

  const handleDoseChange = useCallback((index: number, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i === index) {
          return {
            ...med,
            dailyDose: value === '' ? 0 : Number(value),
          }
        }
        return med
      })
    )
  }, [])

  const handleIncrement = useCallback((index: number, isIncrement: boolean) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i === index) {
          const newDose = isIncrement
            ? med.dailyDose + med.increment
            : Math.max(0, med.dailyDose - med.increment)
          return { ...med, dailyDose: newDose }
        }
        return med
      })
    )
  }, [])

  const clearAll = useCallback(() => {
    setMedications((prev) => prev.map((med) => ({ ...med, dailyDose: 0 })))
  }, [])

  return (
    <div className={styles.converter}>
      <div className={styles.logoContainer}>
        <Image
          src="/images/CHOIR.png"
          alt="CHOIR Provider Logo"
          width={220}
          height={50}
        />
        <h1 className={styles.title}>Opioid Converter</h1>
      </div>

      <div className={styles.mdisplay}>
        <div>
          <h2 className={styles.equivalence}>
            Morphine Equivalence: {morphineEq} mg
          </h2>
          <h2 className={styles.equivalence}>
            Methadone Equivalence: {methadoneEq} mg
          </h2>
        </div>
        <Button className={styles.clearAll} onClick={clearAll}>
          <b>
            <u>Clear All</u>
          </b>
        </Button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th>Medication</th>
            <th>Dosage per Day</th>
            <th>Increment</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, index) => (
            <tr key={med.display} className={styles.row}>
              <td className={styles.medicationCell}>{med.display}</td>
              <td className={styles.doseCell}>
                <input
                  type="text"
                  value={med.dailyDose || ''}
                  onChange={(e) => handleDoseChange(index, e.target.value)}
                  onFocus={() => setActiveInput(index)}
                  onBlur={() => setActiveInput(null)}
                  className={`${styles.doseInput} ${activeInput === index ? styles.active : ''}`}
                />
                <span>{med.unit}</span>
              </td>
              <td className={styles.incrementCell}>
                <Button
                  disabled={med.dailyDose < med.increment}
                  onClick={() => handleIncrement(index, false)}
                  className={styles.button}
                  aria-label={`Decrease ${med.display} dose by ${med.increment} ${med.unit}`}
                >
                  <b>-</b>
                </Button>
                <span className={styles.incrementValue}>{med.increment}</span>
                <Button
                  onClick={() => handleIncrement(index, true)}
                  className={styles.button}
                  aria-label={`Increase ${med.display} dose by ${med.increment} ${med.unit}`}
                >
                  <b>+</b>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OpioidConverter
