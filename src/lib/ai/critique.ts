import type Anthropic from '@anthropic-ai/sdk'

import { CRITIQUE_MODEL } from './client'
import {
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  parseCritiqueBody,
  readBodyCapped,
} from './limits'
import { CRITIQUE_SYSTEM_PROMPT, critiqueMessages } from './prompts'
import type { RateLimiter } from './rate-limit'

function jsonError(status: number, error: string, headers?: HeadersInit) {
  return Response.json({ error }, { status, headers })
}

// Vercel sets x-real-ip itself, and appends the connecting address to the END
// of x-forwarded-for. Reading the first entry would take a caller-supplied
// value, letting anyone mint a fresh bucket per request by varying the header.
function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const forwarded = request.headers.get('x-forwarded-for')?.split(',') ?? []
  return forwarded[forwarded.length - 1]?.trim() || 'unknown'
}

export function createCritiqueHandler({
  perIp,
  global,
  getClient,
}: {
  perIp: RateLimiter
  // Caps total spend per instance even when requests rotate through many IPs.
  global: RateLimiter
  getClient: () => Anthropic | null
}) {
  return async function POST(request: Request): Promise<Response> {
    const client = getClient()
    if (!client) return jsonError(503, 'AI features are not configured')

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
      return jsonError(429, 'Too many requests', { 'Retry-After': '60' })
    }
    if (!global.take('global')) {
      // The caller did nothing wrong, so give their token back. Keeping it
      // would leave them locked out for a further window after the shared
      // budget recovers.
      perIp.refund(ip)
      return jsonError(429, 'Too many requests', { 'Retry-After': '60' })
    }

    const stream = client.messages.stream(
      {
        model: CRITIQUE_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: CRITIQUE_SYSTEM_PROMPT,
        output_config: { effort: 'low' },
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
      return jsonError(502, 'Upstream model request failed')
    }

    const encoder = new TextEncoder()
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
              // would hand back a truncated critique as a clean 200.
              if (stream.errored) throw new Error('upstream stream errored')
              controller.close()
              return
            }

            const event = next.value
            next = await events.next()
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
              return
            }
          }
        } catch (error) {
          // A visitor navigating away aborts the upstream stream, which
          // rejects the in-flight read. That is a normal disconnect, and
          // logging it as a fault buries the real ones.
          if (stream.aborted || request.signal.aborted) {
            try {
              // End the body. Returning here instead would leave pull to be
              // called again with the same unconsumed event, forever.
              controller.close()
            } catch {
              // The reader cancelled first, so it is already closed.
            }
            return
          }
          console.error('critique: upstream stream failed', error)
          controller.error(error)
        }
      },
      cancel() {
        stream.abort()
      },
    })

    return new Response(body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
}
