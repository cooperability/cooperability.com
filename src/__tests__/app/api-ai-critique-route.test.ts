/**
 * @jest-environment node
 */

jest.mock('@anthropic-ai/sdk', () => jest.fn())

function critique(ip?: string) {
  return new Request('http://localhost/api/ai/critique', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'x' }),
    headers: {
      'content-type': 'application/json',
      ...(ip ? { 'x-forwarded-for': ip } : {}),
    },
  })
}

async function loadRouteWithFakeModel() {
  process.env.ANTHROPIC_API_KEY = 'test-key'
  const Anthropic = (await import('@anthropic-ai/sdk'))
    .default as unknown as jest.Mock
  Anthropic.mockImplementation(() => ({
    messages: {
      stream: () => ({
        async *[Symbol.asyncIterator]() {},
        abort() {},
      }),
    },
  }))
  return import('../../app/api/ai/critique/route')
}

// Exercises the real route module, so a wiring mistake (wrong export name,
// limiter not applied, capacity changed) fails here even when the handler
// tests pass.
describe('POST /api/ai/critique', () => {
  const saved = process.env.ANTHROPIC_API_KEY

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = saved
    jest.resetModules()
  })

  it('answers 503 when ANTHROPIC_API_KEY is unset', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const { POST } = await import('../../app/api/ai/critique/route')

    const res = await POST(critique())

    expect(res.status).toBe(503)
  })

  it('limits one address to five requests', async () => {
    const { POST } = await loadRouteWithFakeModel()

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      statuses.push((await POST(critique('203.0.113.9'))).status)
    }

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
  })

  it('limits the instance to sixty requests across all addresses', async () => {
    const { POST } = await loadRouteWithFakeModel()

    const statuses: number[] = []
    for (let i = 0; i < 61; i++) {
      statuses.push((await POST(critique(`198.51.100.${i}`))).status)
    }

    expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true)
    expect(statuses[60]).toBe(429)
  })
})
