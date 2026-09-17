import { getAnthropic } from '@/src/lib/ai/client'
import { createCritiqueHandler } from '@/src/lib/ai/critique'
import { createTokenBucket } from '@/src/lib/ai/rate-limit'

export const runtime = 'nodejs'

export const POST = createCritiqueHandler({
  perIp: createTokenBucket({ capacity: 5, refillIntervalMs: 12_000 }),
  global: createTokenBucket({ capacity: 60, refillIntervalMs: 60_000 }),
  getClient: getAnthropic,
})
