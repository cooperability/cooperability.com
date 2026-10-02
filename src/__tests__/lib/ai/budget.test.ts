/**
 * @jest-environment node
 */
import {
  createSpendLedger,
  DEFAULT_BUDGET_USD,
  DEFAULT_CUTOFF,
  periodOf,
  readBudgetConfig,
} from '../../../lib/ai/budget'
import { createMemoryStore } from '../../../lib/ai/store'

describe('readBudgetConfig', () => {
  it('defaults to $5 a month with a 98% cutoff', () => {
    expect(readBudgetConfig({})).toEqual({
      limitMicro: DEFAULT_BUDGET_USD * 1_000_000,
      cutoff: DEFAULT_CUTOFF,
      window: 'month',
    })
  })

  it('reads a budget, cutoff and weekly window', () => {
    expect(
      readBudgetConfig({
        AI_BUDGET_USD: '12.50',
        AI_BUDGET_CUTOFF: '0.9',
        AI_BUDGET_WINDOW: 'week',
      })
    ).toEqual({ limitMicro: 12_500_000, cutoff: 0.9, window: 'week' })
  })

  it('accepts zero, which switches review off by budget', () => {
    expect(readBudgetConfig({ AI_BUDGET_USD: '0' }).limitMicro).toBe(0)
  })

  // A typo in the Vercel dashboard must never lift the cap.
  it.each(['', ' ', 'five', '-3', 'Infinity', 'NaN'])(
    'falls back to the default for AI_BUDGET_USD=%j',
    (value) => {
      expect(readBudgetConfig({ AI_BUDGET_USD: value }).limitMicro).toBe(
        DEFAULT_BUDGET_USD * 1_000_000
      )
    }
  )

  it.each(['0', '1.5', '-1', 'x'])(
    'falls back to the default cutoff for %j',
    (value) => {
      expect(readBudgetConfig({ AI_BUDGET_CUTOFF: value }).cutoff).toBe(
        DEFAULT_CUTOFF
      )
    }
  )
})

describe('periodOf', () => {
  it('keys months in UTC and ends them at the next month', () => {
    expect(periodOf(new Date('2026-12-31T23:59:00Z'), 'month')).toEqual({
      key: 'ai:spend:2026-12',
      endsAt: new Date('2027-01-01T00:00:00Z'),
    })
  })

  it.each([
    ['2026-09-25T12:00:00Z', 'ai:spend:2026-W39', '2026-09-28T00:00:00Z'],
    // Monday starts a week.
    ['2026-09-28T00:00:00Z', 'ai:spend:2026-W40', '2026-10-05T00:00:00Z'],
    // 1 Jan 2027 is a Friday, so it belongs to 2026's last ISO week.
    ['2027-01-01T08:00:00Z', 'ai:spend:2026-W53', '2027-01-04T00:00:00Z'],
    // 29 Dec 2025 is a Monday whose Thursday is in 2026: week 1 of 2026.
    ['2025-12-29T08:00:00Z', 'ai:spend:2026-W01', '2026-01-05T00:00:00Z'],
  ])('keys %s as %s', (iso, key, endsAt) => {
    expect(periodOf(new Date(iso), 'week')).toEqual({
      key,
      endsAt: new Date(endsAt),
    })
  })
})

describe('createSpendLedger', () => {
  const now = () => Date.parse('2026-09-25T12:00:00Z')

  function ledgerWith(usd: string) {
    const store = createMemoryStore(now)
    return {
      store,
      ledger: createSpendLedger({
        store,
        config: readBudgetConfig({ AI_BUDGET_USD: usd }),
        now,
      }),
    }
  }

  it('admits reservations up to the cutoff and no further', async () => {
    // $1 at 98% is a 980,000 micro-USD ceiling.
    const { ledger } = ledgerWith('1')

    expect(await ledger.reserve(900_000)).not.toBeNull()
    expect(await ledger.reserve(80_000)).not.toBeNull()
    expect(await ledger.reserve(1)).toBeNull()
    expect((await ledger.status()).spentMicro).toBe(980_000)
  })

  it('backs a rejected reservation out of the total', async () => {
    const { ledger } = ledgerWith('1')

    await ledger.reserve(500_000)
    expect(await ledger.reserve(600_000)).toBeNull()

    expect((await ledger.status()).spentMicro).toBe(500_000)
    // So a smaller request still fits.
    expect(await ledger.reserve(400_000)).not.toBeNull()
  })

  it('settles a reservation to its actual cost', async () => {
    const { ledger } = ledgerWith('1')

    const held = await ledger.reserve(60_000)
    await ledger.settle(held!, 7_000)

    expect((await ledger.status()).spentMicro).toBe(7_000)
  })

  it('never admits concurrent reservations past the ceiling', async () => {
    const { ledger } = ledgerWith('1')

    const results = await Promise.all(
      Array.from({ length: 50 }, () => ledger.reserve(60_000))
    )

    const admitted = results.filter(Boolean).length
    expect(admitted * 60_000).toBeLessThanOrEqual(980_000)
    expect((await ledger.status()).spentMicro).toBe(admitted * 60_000)
  })

  it('reports the ceiling, not just the limit', async () => {
    const { ledger } = ledgerWith('10')

    expect(await ledger.status()).toMatchObject({
      limitMicro: 10_000_000,
      ceilingMicro: 9_800_000,
      window: 'month',
      periodEndsAt: new Date('2026-10-01T00:00:00Z'),
    })
  })
})
