export interface RateLimiter {
  take(key: string): boolean
  // Returns a token taken from one bucket when a later bucket rejects the
  // same request. Any shared-store implementation owes the same guarantee.
  refund(key: string): void
}

interface Bucket {
  tokens: number
  updatedAt: number
}

export const MAX_TRACKED_KEYS = 10_000

// In-memory, so each serverless instance keeps its own buckets. That bounds
// abuse per instance, not globally. A shared store (Vercel KV / Upstash) can
// implement the same interface later without touching the route.
export function createTokenBucket({
  capacity,
  refillIntervalMs,
  now = Date.now,
}: {
  capacity: number
  refillIntervalMs: number
  now?: () => number
}): RateLimiter {
  const buckets = new Map<string, Bucket>()

  return {
    take(key) {
      const t = now()
      const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: t }
      const refilled = Math.floor((t - bucket.updatedAt) / refillIntervalMs)
      if (refilled > 0) {
        bucket.tokens = Math.min(capacity, bucket.tokens + refilled)
        // A full bucket must not bank refill time, or it bursts past capacity.
        bucket.updatedAt =
          bucket.tokens === capacity
            ? t
            : bucket.updatedAt + refilled * refillIntervalMs
      }

      // Re-inserting moves the key to the end of Map iteration order, so the
      // eviction below drops the least recently used key, not a drained one
      // that is still being hammered.
      buckets.delete(key)
      if (buckets.size >= MAX_TRACKED_KEYS) {
        buckets.delete(buckets.keys().next().value as string)
      }
      buckets.set(key, bucket)

      if (bucket.tokens < 1) return false
      bucket.tokens -= 1
      return true
    },

    refund(key) {
      // take() has already normalised updatedAt for this key, so only the
      // count moves. A key evicted in between is simply not refunded.
      const bucket = buckets.get(key)
      if (bucket) bucket.tokens = Math.min(capacity, bucket.tokens + 1)
    },
  }
}
