'use client'

import { useState, useCallback, useMemo } from 'react'
import styles from './OpioidConverter.module.css'
import { MedicationItem } from './types'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

// Factors come from the CDC 2022 guideline Table. Rows marked `cmsFactor` are
// absent from it and come from the CMS August 2017 table instead. CMS lists the
// buprenorphine patch at 12.6 for a 7-day patch, and its footnote gives 1.8 as
// the per-day factor, which is what a dose per day needs.
const MEDICATION_ARRAY: MedicationItem[] = [
  {
    display: 'Butrans',
    increment: 5,
    unit: 'µg/h',
    dailyDose: '',
    toMorphine: 1.8,
    cmsFactor: true,
  },
  {
    display: 'Codeine',
    increment: 30,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 0.15,
  },
  {
    display: 'Duragesic',
    increment: 12.5,
    unit: 'µg/h',
    dailyDose: '',
    toMorphine: 2.4,
  },
  {
    display: 'Hydrocodone',
    increment: 2.5,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 1,
  },
  {
    display: 'Hydromorphone',
    increment: 2,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 5,
  },
  {
    display: 'Levorphanol',
    increment: 2,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 11,
    cmsFactor: true,
  },
  {
    display: 'Meperidine',
    increment: 50,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 0.1,
    cmsFactor: true,
  },
  {
    display: 'Methadone',
    increment: 5,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 4.7,
  },
  {
    display: 'Morphine',
    increment: 5,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 1,
  },
  {
    display: 'Oxycodone',
    increment: 5,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 1.5,
  },
  {
    display: 'Oxymorphone',
    increment: 2.5,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 3,
  },
  {
    display: 'Pentazocine',
    increment: 30,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 0.37,
    cmsFactor: true,
  },
  {
    display: 'Tapentadol',
    increment: 25,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 0.4,
  },
  {
    display: 'Tramadol',
    increment: 50,
    unit: 'mg',
    dailyDose: '',
    toMorphine: 0.2,
  },
]

const DOSE_PATTERN = /^\d*\.?\d*$/

const CDC_2022_GUIDELINE_URL =
  'https://www.cdc.gov/mmwr/volumes/71/rr/rr7103a1.htm'

// cms.gov no longer serves this table, so it is cited from the Internet Archive.
const CMS_2017_TABLE_URL =
  'https://web.archive.org/web/20170831231127/https://www.cms.gov/Medicare/Prescription-Drug-Coverage/PrescriptionDrugCovContra/Downloads/Opioid-Morphine-EQ-Conversion-Factors-Aug-2017.pdf'

const CMS_FOOTNOTE_ID = 'opioid-cms-factor-source'

function parseDose(raw: string): number {
  const dose = Number(raw)
  return Number.isFinite(dose) ? dose : 0
}

const OpioidConverter = () => {
  const [medications, setMedications] =
    useState<MedicationItem[]>(MEDICATION_ARRAY)
  const [activeInput, setActiveInput] = useState<number | null>(null)

  // Derived from `medications`, so computed during render rather than mirrored
  // into state by an effect — the effect version rendered every dose change
  // twice, once with the previous total still on screen.
  const morphineEq = useMemo(() => {
    let total = 0

    medications.forEach((med) => {
      total += parseDose(med.dailyDose) * med.toMorphine
    })

    return Math.round(total)
  }, [medications])

  const handleDoseChange = useCallback((index: number, value: string) => {
    // The safe-integer cap keeps every total finite, since 14 rows times the
    // largest factor stays far below Number.MAX_VALUE.
    if (!DOSE_PATTERN.test(value) || Number(value) > Number.MAX_SAFE_INTEGER) {
      return
    }
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, dailyDose: value } : med))
    )
  }, [])

  const handleIncrement = useCallback((index: number, isIncrement: boolean) => {
    setMedications((prev) =>
      prev.map((med, i) => {
        if (i === index) {
          const dose = parseDose(med.dailyDose)
          const newDose = isIncrement
            ? dose + med.increment
            : Math.max(0, dose - med.increment)
          return { ...med, dailyDose: newDose === 0 ? '' : String(newDose) }
        }
        return med
      })
    )
  }, [])

  const clearAll = useCallback(() => {
    setMedications((prev) => prev.map((med) => ({ ...med, dailyDose: '' })))
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
              <td className={styles.medicationCell}>
                {med.display}
                {med.cmsFactor && <span aria-hidden="true">*</span>}
              </td>
              <td className={styles.doseCell}>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*\.?[0-9]*"
                  value={med.dailyDose}
                  aria-describedby={med.cmsFactor ? CMS_FOOTNOTE_ID : undefined}
                  onChange={(e) => handleDoseChange(index, e.target.value)}
                  onFocus={() => setActiveInput(index)}
                  onBlur={() => setActiveInput(null)}
                  className={`${styles.doseInput} ${activeInput === index ? styles.active : ''}`}
                />
                <span>{med.unit}</span>
              </td>
              <td className={styles.incrementCell}>
                <Button
                  disabled={parseDose(med.dailyDose) < med.increment}
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

      <p className={styles.notice}>
        This calculator is not a substitute for clinical judgment. It totals
        morphine milligram equivalents (MME) only. Do not use the total to dose
        a different opioid, including methadone, because cross-tolerance is
        incomplete. Conversion factors come from the Table in the{' '}
        <a href={CDC_2022_GUIDELINE_URL} target="_blank" rel="noreferrer">
          CDC Clinical Practice Guideline for Prescribing Opioids for Pain, 2022
        </a>{' '}
        (Dowell et al., MMWR Recomm Rep 2022;71(No. RR-3)).
      </p>
      <p id={CMS_FOOTNOTE_ID} className={styles.notice}>
        * Not in the CDC 2022 table. This factor comes from the{' '}
        <a href={CMS_2017_TABLE_URL} target="_blank" rel="noreferrer">
          CMS Opioid Oral MME Conversion Factors, August 2017
        </a>
        , which CMS based on CDC&apos;s 2016 compilation. CDC 2022 leaves out
        buprenorphine because, as a partial agonist, its effect has a ceiling.
        For Butrans, that table lists 12.6 for one 7-day patch, and its footnote
        gives the 1.8 per day used here. CMS removed every buprenorphine factor
        in its February 2018 edition, so treat a Butrans total with extra
        caution.
      </p>
    </div>
  )
}

export default OpioidConverter
