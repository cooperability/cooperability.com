// The small slice of Redis the AI guards need: an atomic counter for spend,
// and a string flag for the runtime off switch.
export interface CounterStore {
  // Adds delta (which may be negative) and returns the new total. The key
  // expires ttlSeconds after its last write, so period keys clean themselves up.
  incrBy(key: string, delta: number, ttlSeconds: number): Promise<number>
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  del(key: string): Promise<void>
  // Surfaced by the status endpoint and the ops script, so an operator can
  // tell a real shared budget from the per-instance fallback.
  readonly kind: 'memory' | 'upstash'
}

// Per serverless instance. Good enough for local dev and tests, and better
// than nothing in production, but every cold instance starts a fresh ledger.
// docs/AI-Review.md explains why production should set the Upstash variables.
export function createMemoryStore(now: () => number = Date.now): CounterStore {
  const values = new Map<string, { value: string; expiresAt: number }>()

  const read = (key: string) => {
    const entry = values.get(key)
    if (entry && entry.expiresAt <= now()) {
      values.delete(key)
      return undefined
    }
    return entry
  }

  return {
    kind: 'memory',
    async incrBy(key, delta, ttlSeconds) {
      const next = Number(read(key)?.value ?? 0) + delta
      values.set(key, {
        value: String(next),
        expiresAt: now() + ttlSeconds * 1000,
      })
      return next
    },
    async get(key) {
      return read(key)?.value ?? null
    },
    async set(key, value) {
      values.set(key, { value, expiresAt: Number.POSITIVE_INFINITY })
    },
    async del(key) {
      values.delete(key)
    },
  }
}

type RedisCommand = (string | number)[]

// Upstash's REST API, spoken over fetch so the site takes no new dependency.
// One POST per call, and a pipeline where two commands must travel together.
export function createUpstashStore({
  url,
  token,
  fetchImpl = fetch,
  timeoutMs = 2_000,
}: {
  url: string
  token: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): CounterStore {
  const base = url.replace(/\/+$/, '')

  async function call<T>(path: string, body: unknown): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // A hung store must not hold a visitor's request open. The callers
      // treat a throw here as "unavailable" and fail closed.
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Upstash responded ${res.status}`)
    return (await res.json()) as T
  }

  function unwrap(reply: { result?: unknown; error?: string }): unknown {
    if (reply.error) throw new Error(`Upstash error: ${reply.error}`)
    return reply.result
  }

  const command = async (cmd: RedisCommand) =>
    unwrap(await call<{ result?: unknown; error?: string }>('', cmd))

  return {
    kind: 'upstash',
    async incrBy(key, delta, ttlSeconds) {
      const replies = await call<{ result?: unknown; error?: string }[]>(
        '/pipeline',
        [
          ['INCRBY', key, delta],
          ['EXPIRE', key, ttlSeconds],
        ]
      )
      const total = Number(unwrap(replies[0] ?? {}))
      if (!Number.isFinite(total)) throw new Error('Upstash INCRBY: bad reply')
      return total
    },
    async get(key) {
      const value = await command(['GET', key])
      return value == null ? null : String(value)
    },
    async set(key, value) {
      await command(['SET', key, value])
    },
    async del(key) {
      await command(['DEL', key])
    },
  }
}

// The Upstash integration in the Vercel Marketplace provisions the KV_*
// names. A database created directly at upstash.com shows the UPSTASH_*
// names. Either pair works.
export function upstashEnv(
  env: NodeJS.ProcessEnv = process.env
): { url: string; token: string } | null {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN
  return url && token ? { url, token } : null
}

let shared: CounterStore | undefined

export function getStore(): CounterStore {
  if (!shared) {
    const upstash = upstashEnv()
    shared = upstash ? createUpstashStore(upstash) : createMemoryStore()
  }
  return shared
}
