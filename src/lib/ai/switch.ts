import type { SpendLedger } from './budget'
import type { CounterStore } from './store'

// Set by scripts/ai-switch.mjs. Any value means off, and the value records
// when and why, for whoever reads the store next.
export const OFF_FLAG_KEY = 'ai:review:off'

const FALSY = new Set(['0', 'false', 'off', 'no', 'disabled'])

// The redeploy-speed switch: AI_REVIEW_ENABLED=false in the Vercel project.
export function disabledByEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.AI_REVIEW_ENABLED?.trim().toLowerCase()
  return value !== undefined && FALSY.has(value)
}

export type Availability =
  | { enabled: true }
  | {
      enabled: false
      // disabled: switched off by the owner. budget: the period's spend
      // ceiling is reached. unconfigured: no API key. unavailable: the
      // store could not be read, so the guards fail closed.
      reason: 'disabled' | 'budget' | 'unconfigured' | 'unavailable'
    }

// Rough cost of an ordinary critique. The status endpoint reports "budget"
// once less than this remains, so the UI stops offering a button that would
// only answer 503.
export const TYPICAL_CRITIQUE_MICRO = 20_000

export async function checkAvailability({
  env = process.env,
  hasApiKey,
  store,
  ledger,
}: {
  env?: NodeJS.ProcessEnv
  hasApiKey: boolean
  store: CounterStore
  ledger: SpendLedger
}): Promise<Availability> {
  if (disabledByEnv(env)) return { enabled: false, reason: 'disabled' }
  if (!hasApiKey) return { enabled: false, reason: 'unconfigured' }
  try {
    if (await store.get(OFF_FLAG_KEY)) {
      return { enabled: false, reason: 'disabled' }
    }
    const { spentMicro, ceilingMicro } = await ledger.status()
    if (spentMicro + TYPICAL_CRITIQUE_MICRO > ceilingMicro) {
      return { enabled: false, reason: 'budget' }
    }
  } catch (error) {
    console.error('ai: availability check failed', error)
    return { enabled: false, reason: 'unavailable' }
  }
  return { enabled: true }
}
