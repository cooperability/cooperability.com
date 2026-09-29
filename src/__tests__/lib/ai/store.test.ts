/**
 * @jest-environment node
 */
import {
  createMemoryStore,
  createUpstashStore,
  upstashEnv,
} from '../../../lib/ai/store'

describe('createMemoryStore', () => {
  it('counts, and expires a counter after its TTL', async () => {
    let t = 0
    const store = createMemoryStore(() => t)

    expect(await store.incrBy('k', 5, 10)).toBe(5)
    expect(await store.incrBy('k', -2, 10)).toBe(3)
    t = 10_001
    expect(await store.get('k')).toBeNull()
  })

  it('sets, reads and deletes flags', async () => {
    const store = createMemoryStore()

    await store.set('flag', 'off')
    expect(await store.get('flag')).toBe('off')
    await store.del('flag')
    expect(await store.get('flag')).toBeNull()
  })
})

describe('createUpstashStore', () => {
  function fakeFetch(reply: unknown, status = 200) {
    return jest.fn<Promise<Response>, Parameters<typeof fetch>>(
      async () => new Response(JSON.stringify(reply), { status })
    )
  }

  it('sends INCRBY and EXPIRE as one pipeline with the bearer token', async () => {
    const fetchImpl = fakeFetch([{ result: 42 }, { result: 1 }])
    const store = createUpstashStore({
      url: 'https://example.upstash.io/',
      token: 'tok',
      fetchImpl,
    })

    expect(await store.incrBy('ai:spend:2026-09', 7, 60)).toBe(42)

    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://example.upstash.io/pipeline')
    expect((init!.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok'
    )
    expect(JSON.parse(init!.body as string)).toEqual([
      ['INCRBY', 'ai:spend:2026-09', 7],
      ['EXPIRE', 'ai:spend:2026-09', 60],
    ])
  })

  it('reads a missing key as null', async () => {
    const store = createUpstashStore({
      url: 'https://x',
      token: 't',
      fetchImpl: fakeFetch({ result: null }),
    })

    expect(await store.get('nope')).toBeNull()
  })

  // Callers fail closed on a throw, so every failure mode must throw rather
  // than read as zero spend.
  it.each([
    ['an HTTP error', fakeFetch({ error: 'unauthorized' }, 401)],
    ['a command error', fakeFetch({ error: 'WRONGTYPE' })],
  ])('throws on %s', async (_, fetchImpl) => {
    const store = createUpstashStore({
      url: 'https://x',
      token: 't',
      fetchImpl,
    })

    await expect(store.get('k')).rejects.toThrow()
  })

  it('throws when INCRBY returns a non-number', async () => {
    const store = createUpstashStore({
      url: 'https://x',
      token: 't',
      fetchImpl: fakeFetch([{ result: 'nan' }, { result: 1 }]),
    })

    await expect(store.incrBy('k', 1, 1)).rejects.toThrow()
  })
})

describe('upstashEnv', () => {
  it('accepts the Upstash names and the Vercel Marketplace KV names', () => {
    expect(
      upstashEnv({ UPSTASH_REDIS_REST_URL: 'u', UPSTASH_REDIS_REST_TOKEN: 't' })
    ).toEqual({ url: 'u', token: 't' })
    expect(
      upstashEnv({ KV_REST_API_URL: 'u', KV_REST_API_TOKEN: 't' })
    ).toEqual({ url: 'u', token: 't' })
  })

  it('is null unless both halves are set', () => {
    expect(upstashEnv({ KV_REST_API_URL: 'u' })).toBeNull()
  })
})
