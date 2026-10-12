'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { useTheme } from 'next-themes'
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/solid'
import styles from '../styles/utils.module.css'
import { useHydrated } from '../hooks/useHydrated'

// Order is the order on the track, so the circle's slot is the index.
const OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    Icon: SunIcon,
    at: styles.themeSwitchAtLight,
  },
  {
    value: 'system',
    label: 'System',
    Icon: ComputerDesktopIcon,
    at: styles.themeSwitchAtSystem,
  },
  {
    value: 'dark',
    label: 'Dark',
    Icon: MoonIcon,
    at: styles.themeSwitchAtDark,
  },
] as const

const ThemeSwitch = () => {
  const { resolvedTheme, theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  if (!hydrated) return null

  // The track and circle follow what is on screen, so "system" looks like the
  // theme the OS picked; only the circle's slot says which setting is chosen.
  const isDark = resolvedTheme === 'dark'
  const chosen = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1]

  return (
    <RadioGroupPrimitive.Root
      aria-label="Theme"
      value={chosen.value}
      onValueChange={setTheme}
      className={`${styles.themeToggleBtn} ${styles.themeSwitch} ${isDark ? styles.themeToggleDark : styles.themeToggleLight}`}
    >
      {/* Sliding circle */}
      <div
        aria-hidden="true"
        className={`${styles.themeSwitchCircle} ${chosen.at} ${isDark ? styles.themeSwitchCircleDark : styles.themeSwitchCircleLight}`}
      />
      {OPTIONS.map(({ value, label, Icon }) => (
        <RadioGroupPrimitive.Item
          key={value}
          value={value}
          aria-label={label}
          title={label}
          className={styles.themeSwitchOption}
        >
          <Icon aria-hidden="true" />
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  )
}

export default ThemeSwitch
