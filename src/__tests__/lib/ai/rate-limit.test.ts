import { MAX_TRACKED_KEYS, createTokenBucket } from '../../../lib/ai/rate-limit'

function clock(start = 0) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms
    },
  }
}

describe('createTokenBucket', () => {
  it('allows exactly capacity requests, then denies', () => {
    const c = clock()
    const limiter = createTokenBucket({
      capacity: 3,
      refillIntervalMs: 1_000,
      now: c.now,
    })

    const results = [1, 2, 3, 4].map(() => limiter.take('a'))

    expect(results).toEqual([true, true, true, false])
  })

  it('refills one token per interval, never above capacity', () => {
    const c = clock()
    const limiter = createTokenBucket({
      capacity: 2,
      refillIntervalMs: 1_000,
      now: c.now,
    })
    limiter.take('a')
    limiter.take('a')

    c.advance(999)
    expect(limiter.take('a')).toBe(false)

    c.advance(1)
    expect(limiter.take('a')).toBe(true)
    expect(limiter.take('a')).toBe(false)

    c.advance(60_000)
    expect([1, 2, 3].map(() => limiter.take('a'))).toEqual([true, true, false])
  })

  it('keeps partial refill progress across denied calls', () => {
    const c = clock()
    const limiter = createTokenBucket({
      capacity: 1,
      refillIntervalMs: 1_000,
      now: c.now,
    })
    limiter.take('a')

    // Polling every 600ms must still earn a token after 1000ms total.
    c.advance(600)
    expect(limiter.take('a')).toBe(false)
    c.advance(600)
    expect(limiter.take('a')).toBe(true)
  })

  it('carries a partial interval over when a refill leaves the bucket below capacity', () => {
    const c = clock()
    const limiter = createTokenBucket({
      capacity: 2,
      refillIntervalMs: 1_000,
      now: c.now,
    })
    limiter.take('a')
    limiter.take('a')

    // One token lands at 1000ms, observed at 1200ms. The bucket is not full,
    // so the spare 200ms counts: the next token is due at 2000ms, not 2200ms.
    c.advance(1_200)
    expect(limiter.take('a')).toBe(true)
    c.advance(800)
    expect(limiter.take('a')).toBe(true)
  })

  it('does not bank refill time while full, so it never bursts past capacity', () => {
    const c = clock()
    const limiter = createTokenBucket({
      capacity: 5,
      refillIntervalMs: 12_000,
      now: c.now,
    })
    limiter.take('a')

    c.advance(23_999)
    const burst = [1, 2, 3, 4, 5, 6].map(() => limiter.take('a'))
    c.advance(1)
    burst.push(limiter.take('a'))

    expect(burst.filter(Boolean)).toHaveLength(5)
  })

  it('evicts the least recently used key once the table is full', () => {
    const limiter = createTokenBucket({ capacity: 1, refillIntervalMs: 1e9 })
    limiter.take('drained')
    limiter.take('idle')

    // Touch the drained key again so "idle" becomes the oldest entry.
    expect(limiter.take('drained')).toBe(false)
    for (let i = 0; i < MAX_TRACKED_KEYS - 1; i++) limiter.take(`k${i}`)

    // Table overflowed by one: "idle" was evicted, "drained" was not.
    expect(limiter.take('drained')).toBe(false)
    expect(limiter.take('idle')).toBe(true)
  })

  it('bounds the table, forgetting the oldest key when it overflows', () => {
    const limiter = createTokenBucket({ capacity: 1, refillIntervalMs: 1e9 })
    limiter.take('oldest')
    for (let i = 0; i < MAX_TRACKED_KEYS; i++) limiter.take(`k${i}`)

    expect(limiter.take('oldest')).toBe(true)
  })

  it('tracks keys independently', () => {
    const limiter = createTokenBucket({ capacity: 1, refillIntervalMs: 1_000 })

    expect(limiter.take('a')).toBe(true)
    expect(limiter.take('a')).toBe(false)
    expect(limiter.take('b')).toBe(true)
  })
})
