import type Anthropic from '@anthropic-ai/sdk'

import type { SpendLedger, Reservation } from './budget'
import { CRITIQUE_MODEL } from './client'
import {
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  parseCritiqueBody,
  readBodyCapped,
} from './limits'
import { costMicroUsd, microToUsd, PRICE_PER_MTOK, type Usage } from './pricing'
import { CRITIQUE_SYSTEM_PROMPT, critiqueMessages } from './prompts'
import type { RateLimiter } from './rate-limit'
import { REVIEW_JSON_SCHEMA } from './review-schema'
import type { CounterStore } from './store'
import { checkAvailability, disabledByEnv, OFF_FLAG_KEY } from './switch'

function jsonError(
  status: number,
  error: string,
  extra: Record<string, unknown> = {},
  headers?: HeadersInit
) {
  return Response.json(
    { error, ...extra },
    { status, headers: { 'Cache-Control': 'no-store', ...headers } }
  )
}

// IPv6 hands every subscriber a /64 or larger, so keying on the full address
// gives one visitor 2^64 fresh buckets. Key on the /64 instead.
export function ipKey(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  if (mapped) return mapped[1]
  if (!ip.includes(':')) return ip

  const [head, tail = ''] = ip.split('::')
  const headParts = head ? head.split(':') : []
  const tailParts = tail ? tail.split(':') : []
  const missing = ip.includes('::')
    ? 8 - headParts.length - tailParts.length
    : 0
  const groups = [
    ...headParts,
    ...Array<string>(Math.max(0, missing)).fill('0'),
    ...tailParts,
  ]
  return (
    groups
      .slice(0, 4)
      .map((g) => (parseInt(g, 16) || 0).toString(16))
      .join(':') + '::/64'
  )
}

// Vercel sets x-real-ip itself, and appends the connecting address to the END
// of x-forwarded-for. Reading the first entry would take a caller-supplied
// value, letting anyone mint a fresh bucket per request by varying the header.
function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return ipKey(realIp)

  const forwarded = request.headers.get('x-forwarded-for')?.split(',') ?? []
  const last = forwarded[forwarded.length - 1]?.trim()
  return last ? ipKey(last) : 'unknown'
}

// Browsers stamp Sec-Fetch-Site on every request and page scripts cannot
// forge it. Anything other than same-origin (or a typed-in navigation) is
// another site driving a visitor's browser at this route. Non-browser
// clients omit the header and are left to the limits below.
function isCrossSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  return site !== null && site !== 'same-origin' && site !== 'none'
}

// Structured outputs add a system preamble describing the schema. This is a
// generous allowance for it, since the reservation must never undershoot.
const SCHEMA_OVERHEAD_TOKENS = 1_500
const SYSTEM_PROMPT_BYTES = Buffer.byteLength(CRITIQUE_SYSTEM_PROMPT)

// Worst-case cost of one request, reserved before the model is called. A
// byte-level tokenizer never emits more tokens than there are bytes, and the
// fence escaping can grow a tag by at most a few bytes, hence the margin.
export function reservationMicro(prompt: string): number {
  const inputTokens =
    SYSTEM_PROMPT_BYTES +
    Math.ceil(Buffer.byteLength(prompt) * 1.1) +
    SCHEMA_OVERHEAD_TOKENS
  return (
    inputTokens * PRICE_PER_MTOK.input +
    MAX_OUTPUT_TOKENS * PRICE_PER_MTOK.output
  )
}

// The kill switch is read on every POST, so a flag flipped by the ops script
// takes effect within this window without a store round-trip per request.
const SWITCH_CACHE_MS = 15_000

export interface CritiqueDeps {
  perIp: RateLimiter
  // Caps total spend per instance even when requests rotate through many IPs.
  global: RateLimiter
  getClient: () => Anthropic | null
  ledger: SpendLedger
  store: CounterStore
  env?: NodeJS.ProcessEnv
  now?: () => number
}

type StreamLine =
  | { type: 'delta'; text: string }
  | { type: 'done'; stop_reason: string | null }
  | { type: 'error'; error: string }

export function createCritiqueHandlers({
  perIp,
  global,
  getClient,
  ledger,
  store,
  env = process.env,
  now = Date.now,
}: CritiqueDeps) {
  let switchCache: { off: boolean; at: number } | undefined

  async function switchedOff(): Promise<boolean> {
    if (disabledByEnv(env)) return true
    if (switchCache && now() - switchCache.at < SWITCH_CACHE_MS) {
      return switchCache.off
    }
    const off = Boolean(await store.get(OFF_FLAG_KEY))
    switchCache = { off, at: now() }
    return off
  }

  let statusCache: { body: unknown; at: number } | undefined

  // Lets the UI hide the review button instead of offering one that 503s.
  // It reports only on/off and a coarse reason, never the budget figures.
  async function GET(): Promise<Response> {
    if (!statusCache || now() - statusCache.at >= SWITCH_CACHE_MS) {
      statusCache = {
        body: await checkAvailability({
          env,
          hasApiKey: getClient() !== null,
          store,
          ledger,
          minReservationMicro: reservationMicro(''),
        }),
        at: now(),
      }
    }
    return Response.json(statusCache.body, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  async function POST(request: Request): Promise<Response> {
    try {
      if (await switchedOff()) {
        return jsonError(503, 'AI review is switched off', {
          reason: 'disabled',
        })
      }
    } catch (error) {
      console.error('critique: switch check failed', error)
      return jsonError(503, 'AI review is unavailable', {
        reason: 'unavailable',
      })
    }

    const client = getClient()
    if (!client) {
      return jsonError(503, 'AI features are not configured', {
        reason: 'unconfigured',
      })
    }

    if (isCrossSite(request)) {
      return jsonError(403, 'Cross-site requests are not accepted')
    }

    // Browsers can send a cross-site text/plain POST without a preflight.
    // Requiring JSON forces one, which this route never answers, so another
    // site cannot spend the budget from its visitors' browsers.
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('application/json')) {
      return jsonError(415, 'Content-Type must be application/json')
    }

    // Reject on the declared size before buffering the body at all.
    if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) {
      return jsonError(413, 'Request body too large')
    }
    const raw = await readBodyCapped(request, MAX_BODY_BYTES)
    if (raw === null) return jsonError(413, 'Request body too large')

    const parsed = parseCritiqueBody(raw)
    if (!parsed.ok) return jsonError(parsed.status, parsed.error)

    // Limits run after validation so malformed requests, which never reach
    // the model, cannot drain the buckets real callers depend on.
    const ip = clientIp(request)
    if (!perIp.take(ip)) {
      return jsonError(429, 'Too many requests', {}, { 'Retry-After': '60' })
    }
    if (!global.take('global')) {
      // The caller did nothing wrong, so give their token back. Keeping it
      // would leave them locked out for a further window after the shared
      // budget recovers.
      perIp.refund(ip)
      return jsonError(429, 'Too many requests', {}, { 'Retry-After': '60' })
    }

    // The spend ceiling is the guard that holds when every other one is
    // evaded: it is shared across instances (given a shared store), and it
    // is checked against the worst case before a token is bought.
    let reservation: Reservation | null
    try {
      reservation = await ledger.reserve(reservationMicro(parsed.prompt))
    } catch (error) {
      console.error('critique: budget store failed', error)
      perIp.refund(ip)
      global.refund('global')
      return jsonError(503, 'AI review is unavailable', {
        reason: 'unavailable',
      })
    }
    if (!reservation) {
      perIp.refund(ip)
      global.refund('global')
      return jsonError(503, 'AI review has reached its budget', {
        reason: 'budget',
      })
    }
    const held = reservation

    const started = now()
    const usage: Partial<Usage> = {}
    let stopReason: string | null = null
    let settled = false

    // Every exit path lands here exactly once. A stream that did not finish
    // was still billed for tokens this route never saw counted, so it keeps
    // the worst-case reservation instead of guessing low.
    async function finish(outcome: 'complete' | 'incomplete' | 'failed') {
      if (settled) return
      settled = true
      const actual = costMicroUsd(usage)
      const charge =
        outcome === 'complete' ? actual : outcome === 'failed' ? 0 : held.micro
      try {
        await ledger.settle(held, charge)
      } catch (error) {
        console.error('critique: settling spend failed', error)
      }
      // Token counts and cost only. The prompt and the review stay out of
      // the logs.
      console.info(
        JSON.stringify({
          event: 'ai.critique',
          outcome,
          stop_reason: stopReason,
          input_tokens: usage.input_tokens ?? null,
          output_tokens: usage.output_tokens ?? null,
          charged_usd: microToUsd(charge),
          ms: now() - started,
        })
      )
    }

    const stream = client.messages.stream(
      {
        model: CRITIQUE_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: CRITIQUE_SYSTEM_PROMPT,
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: REVIEW_JSON_SCHEMA },
        },
        messages: critiqueMessages(parsed.prompt),
      },
      // A client that disconnects before the first event would otherwise
      // leave the upstream generation running to its token cap.
      { signal: request.signal }
    )

    // Auth, rate-limit and overload errors surface on the first read. Awaiting
    // it before committing to a 200 lets the client get a real status instead
    // of a connection that drops mid-response.
    const events = stream[Symbol.asyncIterator]()
    let next: Awaited<ReturnType<typeof events.next>>
    try {
      next = await events.next()
    } catch (error) {
      console.error('critique: upstream request failed', error)
      // Nothing was generated, so nothing was billed.
      await finish('failed')
      return jsonError(502, 'Upstream model request failed')
    }

    function record(event: Anthropic.MessageStreamEvent) {
      if (event.type === 'message_start') {
        Object.assign(usage, event.message.usage)
      } else if (event.type === 'message_delta') {
        // Cumulative counts. Input fields are null when unchanged.
        usage.output_tokens = event.usage.output_tokens
        if (event.usage.input_tokens != null) {
          usage.input_tokens = event.usage.input_tokens
        }
        stopReason = event.delta.stop_reason ?? stopReason
      }
    }

    const encoder = new TextEncoder()
    const line = (value: StreamLine) =>
      encoder.encode(JSON.stringify(value) + '\n')

    const body = new ReadableStream<Uint8Array>({
      // Pulling one delta at a time applies backpressure. Draining the whole
      // generation up front would buffer it in function memory whenever the
      // client reads slowly or stalls.
      async pull(controller) {
        try {
          for (;;) {
            if (next.done) {
              // The SDK can mark the stream errored and still report done,
              // when the failure lands with no reader waiting. Closing here
              // would hand back a truncated review as a clean finish.
              if (stream.errored) throw new Error('upstream stream errored')
              controller.enqueue(
                line({ type: 'done', stop_reason: stopReason })
              )
              controller.close()
              await finish('complete')
              return
            }

            const event = next.value
            record(event)
            next = await events.next()
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                line({ type: 'delta', text: event.delta.text })
              )
              return
            }
          }
        } catch (error) {
          // A visitor navigating away aborts the upstream stream, which
          // rejects the in-flight read. That is a normal disconnect, and
          // logging it as a fault buries the real ones.
          const disconnected = stream.aborted || request.signal.aborted
          if (!disconnected) {
            console.error('critique: upstream stream failed', error)
          }
          try {
            // An explicit error line, so the client can tell a failed review
            // from a finished one. A bare close would read as success.
            if (!disconnected) {
              controller.enqueue(
                line({ type: 'error', error: 'Upstream stream failed' })
              )
            }
            // End the body. Returning without closing would leave pull to be
            // called again with the same unconsumed event, forever.
            controller.close()
          } catch {
            // The reader cancelled first, so it is already closed.
          }
          await finish('incomplete')
        }
      },
      async cancel() {
        stream.abort()
        await finish('incomplete')
      },
    })

    return new Response(body, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  return { GET, POST }
}
