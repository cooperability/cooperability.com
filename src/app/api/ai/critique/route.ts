import { createSpendLedger, readBudgetConfig } from '@/src/lib/ai/budget'
import { getAnthropic } from '@/src/lib/ai/client'
import { createCritiqueHandlers } from '@/src/lib/ai/critique'
import { createTokenBucket } from '@/src/lib/ai/rate-limit'
import { getStore } from '@/src/lib/ai/store'

export const runtime = 'nodejs'
// The status GET reads live switch and budget state, so it must never be
// prerendered into a static answer at build time.
export const dynamic = 'force-dynamic'

// A review streams up to MAX_OUTPUT_TOKENS, which outruns the platform
// default. Past it the client gets a truncated body with no done line.
export const maxDuration = 60

const store = getStore()

const handlers = createCritiqueHandlers({
  perIp: createTokenBucket({ capacity: 5, refillIntervalMs: 12_000 }),
  global: createTokenBucket({ capacity: 60, refillIntervalMs: 60_000 }),
  getClient: getAnthropic,
  ledger: createSpendLedger({ store, config: readBudgetConfig() }),
  store,
})

export const GET = handlers.GET
export const POST = handlers.POST
