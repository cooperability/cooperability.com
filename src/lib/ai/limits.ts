export const MAX_BODY_BYTES = 16_000
export const MAX_PROMPT_CHARS = 8_000
// Adaptive thinking spends from this budget too, and the review now carries
// a rewrite of up to 400 words after its scorecard, so it cannot be
// lowballed without truncating the part visitors want most.
export const MAX_OUTPUT_TOKENS = 3_072

// A chunked request carries no content-length, so the cap has to be enforced
// while reading. request.text() would buffer an unbounded body first.
export async function readBodyCapped(
  request: Request,
  maxBytes: number
): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export type ParsedBody =
  { ok: true; prompt: string } | { ok: false; status: 400 | 413; error: string }

export function parseCritiqueBody(raw: string): ParsedBody {
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return { ok: false, status: 400, error: 'Body must be JSON' }
  }

  const prompt = (body as { prompt?: unknown } | null)?.prompt
  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return {
      ok: false,
      status: 400,
      error: 'prompt must be a non-empty string',
    }
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return {
      ok: false,
      status: 413,
      error: `prompt exceeds ${MAX_PROMPT_CHARS} characters`,
    }
  }

  return { ok: true, prompt }
}
