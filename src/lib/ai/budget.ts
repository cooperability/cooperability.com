import { usdToMicro } from './pricing'
import type { CounterStore } from './store'

export type BudgetWindow = 'month' | 'week'

export interface BudgetConfig {
  limitMicro: number
  // Fraction of the limit at which the route stops admitting requests. The
  // gap absorbs requests already in flight when the ceiling is reached.
  cutoff: number
  window: BudgetWindow
}

export const DEFAULT_BUDGET_USD = 5
export const DEFAULT_CUTOFF = 0.98

// Long enough to outlive any period, so a key is never reaped mid-period.
const PERIOD_TTL_SECONDS = 40 * 24 * 60 * 60

export function readBudgetConfig(
  env: NodeJS.ProcessEnv = process.env
): BudgetConfig {
  const usd = Number(env.AI_BUDGET_USD)
  const cutoff = Number(env.AI_BUDGET_CUTOFF)
  return {
    // A typo must not lift the cap, so anything unparseable or negative
    // falls back to the default instead of to "unlimited".
    limitMicro: usdToMicro(
      Number.isFinite(usd) && usd >= 0 && env.AI_BUDGET_USD?.trim()
        ? usd
        : DEFAULT_BUDGET_USD
    ),
    cutoff:
      Number.isFinite(cutoff) && cutoff > 0 && cutoff <= 1
        ? cutoff
        : DEFAULT_CUTOFF,
    window: env.AI_BUDGET_WINDOW === 'week' ? 'week' : 'month',
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

// Periods run in UTC, so every serverless region agrees on the key.
export function periodOf(
  date: Date,
  window: BudgetWindow
): { key: string; endsAt: Date } {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()

  if (window === 'month') {
    return {
      key: `ai:spend:${y}-${pad(m + 1)}`,
      endsAt: new Date(Date.UTC(y, m + 1, 1)),
    }
  }

  // ISO 8601 week: Monday start, and the week belongs to the year that holds
  // its Thursday.
  const day = new Date(Date.UTC(y, m, date.getUTCDate()))
  const weekday = day.getUTCDay() || 7
  const monday = new Date(day)
  monday.setUTCDate(day.getUTCDate() - weekday + 1)
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()
  const week =
    Math.floor(
      (thursday.getTime() - Date.UTC(isoYear, 0, 1)) / (7 * 86_400_000)
    ) + 1
  const endsAt = new Date(monday)
  endsAt.setUTCDate(monday.getUTCDate() + 7)
  return { key: `ai:spend:${isoYear}-W${pad(week)}`, endsAt }
}

export interface Reservation {
  key: string
  micro: number
}

export interface BudgetStatus {
  spentMicro: number
  ceilingMicro: number
  limitMicro: number
  window: BudgetWindow
  periodEndsAt: Date
}

export interface SpendLedger {
  // Holds `micro` against the current period, or returns null when that
  // would cross the ceiling. Callers reserve the worst case up front, so
  // concurrent requests cannot jointly overshoot.
  reserve(micro: number): Promise<Reservation | null>
  // Replaces a reservation with what the request actually cost.
  settle(reservation: Reservation, actualMicro: number): Promise<void>
  status(): Promise<BudgetStatus>
}

export function createSpendLedger({
  store,
  config,
  now = Date.now,
}: {
  store: CounterStore
  config: BudgetConfig
  now?: () => number
}): SpendLedger {
  const ceilingMicro = Math.floor(config.limitMicro * config.cutoff)

  return {
    async reserve(micro) {
      const { key } = periodOf(new Date(now()), config.window)
      // Increment first and check after: the store's INCRBY is atomic, so
      // the sum of admitted reservations can never pass the ceiling. Two
      // requests racing at the edge may both back out, which costs a retry,
      // never money.
      const total = await store.incrBy(key, micro, PERIOD_TTL_SECONDS)
      if (total > ceilingMicro) {
        await store.incrBy(key, -micro, PERIOD_TTL_SECONDS)
        return null
      }
      return { key, micro }
    },

    async settle(reservation, actualMicro) {
      // Settles into the period the reservation was made in, even if the
      // request straddled midnight on the last day.
      const delta = actualMicro - reservation.micro
      if (delta !== 0) {
        await store.incrBy(reservation.key, delta, PERIOD_TTL_SECONDS)
      }
    },

    async status() {
      const { key, endsAt } = periodOf(new Date(now()), config.window)
      return {
        spentMicro: Number((await store.get(key)) ?? 0),
        ceilingMicro,
        limitMicro: config.limitMicro,
        window: config.window,
        periodEndsAt: endsAt,
      }
    },
  }
}
