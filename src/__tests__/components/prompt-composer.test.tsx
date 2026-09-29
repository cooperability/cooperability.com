import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TextDecoder, TextEncoder } from 'util'
import PromptComposer, {
  STORAGE_KEY,
} from '../../components/prompt-composer/PromptComposer'

// jsdom has neither, and the review reads a byte stream.
Object.assign(globalThis, { TextDecoder, TextEncoder })

const REVIEW = {
  summary: 'A clear task that needs an audience.',
  scores: {
    task: { score: 5, note: 'Specific and verb-led.' },
    context: { score: 2, note: 'No reader is named.' },
    input: { score: 5, note: 'Nothing needed.' },
    examples: { score: 4, note: 'Optional here.' },
    output: { score: 3, note: 'No length given.' },
    quality: { score: 3, note: 'No self-check.' },
  },
  top_fix: 'Say who will read the result.',
  suggested_components: ['quality-verify'],
  rewrite: 'Rewritten prompt, with [who will read this].',
}

// Chunks cut across NDJSON lines and across multi-byte characters, the way
// a real network delivers them.
function ndjson(lines: object[], chunk = 7) {
  const bytes = new TextEncoder().encode(
    lines.map((l) => JSON.stringify(l) + '\n').join('')
  )
  let at = 0
  return {
    getReader: () => ({
      read: async () =>
        at >= bytes.length
          ? { done: true, value: undefined }
          : { done: false, value: bytes.slice(at, (at += chunk)) },
    }),
  }
}

function reviewStream(
  doc: object = REVIEW,
  ending: object = { type: 'done', stop_reason: 'end_turn' }
) {
  const text = JSON.stringify(doc)
  const deltas = []
  for (let i = 0; i < text.length; i += 23) {
    deltas.push({ type: 'delta', text: text.slice(i, i + 23) })
  }
  return ndjson([...deltas, ending])
}

type Reply = { ok: boolean; status: number; body?: unknown; json?: unknown }

function mockFetch(
  availability: object = { enabled: true },
  post: () => Reply = () => ({ ok: true, status: 200, body: reviewStream() })
) {
  const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
    if (!init?.method) return { json: async () => availability }
    const reply = post()
    return { ...reply, json: async () => reply.json ?? {} }
  })
  Object.assign(globalThis, { fetch: fetchMock })
  return fetchMock
}

const compiled = () =>
  screen.getByRole('textbox', {
    name: /compiled prompt/i,
  }) as HTMLTextAreaElement

// The availability probe resolves after mount. Waiting for it keeps its
// state update inside the test instead of leaking past it.
async function renderComposer() {
  const utils = render(<PromptComposer />)
  await waitFor(() =>
    expect(screen.queryByText(/checking whether/i)).not.toBeInTheDocument()
  )
  return utils
}

function typeTask(value: string) {
  fireEvent.change(screen.getByLabelText('Task'), { target: { value } })
}

beforeEach(() => {
  localStorage.clear()
  mockFetch()
})

afterEach(() => {
  delete (globalThis as { fetch?: unknown }).fetch
})

describe('PromptComposer v2', () => {
  it('opens empty, with nothing to copy and no boilerplate', async () => {
    render(<PromptComposer />)

    expect(compiled().value).toBe('')
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    expect(screen.getByText('Start writing')).toBeInTheDocument()
    await screen.findByRole('button', { name: /review with ai/i })
  })

  it('offers no personas', async () => {
    await renderComposer()

    expect(screen.queryByText(/subject matter expert/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^role$/i)).not.toBeInTheDocument()
  })

  it('compiles the task as it is typed', async () => {
    await renderComposer()

    typeTask('Summarize the quarterly report for the board')

    expect(compiled().value).toBe(
      'Summarize the quarterly report for the board'
    )
    expect(screen.getByRole('button', { name: 'Copy' })).toBeEnabled()
  })

  it('keeps hand edits when a component is toggled, until they are discarded', async () => {
    await renderComposer()
    typeTask('Write a haiku')
    fireEvent.change(compiled(), { target: { value: 'My hand-tuned prompt' } })

    fireEvent.click(
      screen.getByRole('button', { name: /reasoning & quality/i })
    )
    fireEvent.click(screen.getByLabelText(/self-check/i))

    // v1 silently overwrote this on every toggle.
    expect(compiled().value).toBe('My hand-tuned prompt')

    fireEvent.click(screen.getByRole('button', { name: /discard edits/i }))
    expect(compiled().value).toContain('Write a haiku')
    expect(compiled().value).toContain('Before finishing, check your response')
  })

  it('keeps a radio group exclusive and lets it return to no preference', async () => {
    await renderComposer()
    fireEvent.click(screen.getByRole('button', { name: /^output/i }))

    fireEvent.click(screen.getByRole('radio', { name: /^brief/i }))
    fireEvent.click(screen.getByRole('radio', { name: /^thorough/i }))
    expect(compiled().value).toContain('Be thorough')
    expect(compiled().value).not.toContain('150 words')

    fireEvent.click(
      screen.getAllByRole('radio', { name: /let the model decide/i })[1]
    )
    expect(compiled().value).toBe('')
  })

  it('restores the composer from storage, and Clear wipes both', async () => {
    const { unmount } = await renderComposer()
    typeTask('Plan a launch')
    unmount()
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Plan a launch')

    await renderComposer()
    expect(compiled().value).toBe('Plan a launch')

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(compiled().value).toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('shrugs off a corrupt saved state', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    await renderComposer()
    expect(compiled().value).toBe('')
  })

  it('opens and focuses the field a live-check fix points at', async () => {
    await renderComposer()
    typeTask('Summarize the attached report for the board meeting')

    fireEvent.click(screen.getByRole('button', { name: /edit for input/i }))

    await waitFor(() =>
      expect(screen.getByLabelText('Material to work from')).toHaveFocus()
    )
  })

  it('flags a persona typed straight into the prompt', async () => {
    await renderComposer()
    fireEvent.change(compiled(), {
      target: { value: 'You are a world-class copywriting expert.' },
    })

    expect(
      screen.getByText(/personas do not reliably improve accuracy/i)
    ).toBeInTheDocument()
  })
})

describe('AI review', () => {
  it('explains, and disables the button, when the budget is spent', async () => {
    mockFetch({ enabled: false, reason: 'budget' })
    render(<PromptComposer />)
    typeTask('Write a haiku')

    expect(await screen.findByText(/used its budget/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /review with ai/i })
    ).toBeDisabled()
  })

  it('streams a scorecard, then applies a suggestion and the rewrite', async () => {
    const fetchMock = mockFetch()
    render(<PromptComposer />)
    typeTask('Write a haiku about autumn for a poetry newsletter')
    const button = await screen.findByRole('button', {
      name: /review with ai/i,
    })
    await waitFor(() => expect(button).toBeEnabled())

    fireEvent.click(button)

    expect(
      await screen.findByText(/review complete: 67 out of 100/i)
    ).toBeInTheDocument()
    expect(screen.getByText(REVIEW.summary)).toBeInTheDocument()
    expect(screen.getByText('No reader is named.')).toBeInTheDocument()
    expect(screen.getByText(REVIEW.top_fix)).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls[1]
    expect(JSON.parse(init!.body as string)).toEqual({
      prompt: 'Write a haiku about autumn for a poetry newsletter',
    })

    fireEvent.click(screen.getByRole('button', { name: /add “self-check”/i }))
    expect(
      screen.getByRole('button', { name: /self-check added/i })
    ).toBeDisabled()
    expect(compiled().value).toContain('Before finishing, check your response')

    fireEvent.click(screen.getByRole('button', { name: /use this rewrite/i }))
    expect(compiled().value).toBe(REVIEW.rewrite)
    expect(screen.getByText(/changed since this review/i)).toBeInTheDocument()
  })

  it('serves a repeat review of the same text from cache, at no cost', async () => {
    const fetchMock = mockFetch()
    render(<PromptComposer />)
    typeTask('Write a haiku about autumn for a poetry newsletter')
    const button = await screen.findByRole('button', {
      name: /review with ai/i,
    })
    await waitFor(() => expect(button).toBeEnabled())

    fireEvent.click(button)
    await screen.findByText(/review complete/i)
    fireEvent.click(screen.getByRole('button', { name: /review again/i }))

    expect(await screen.findByText(/at no cost/i)).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([, i]) => i?.method)).toHaveLength(1)
  })

  it('reports a rate limit in plain words', async () => {
    mockFetch(undefined, () => ({
      ok: false,
      status: 429,
      json: { error: 'Too many requests' },
    }))
    render(<PromptComposer />)
    typeTask('Write a haiku')
    const button = await screen.findByRole('button', {
      name: /review with ai/i,
    })
    await waitFor(() => expect(button).toBeEnabled())

    fireEvent.click(button)

    expect(
      await screen.findByText(/too many reviews in a row/i)
    ).toBeInTheDocument()
  })

  it('switches to the off message when the route says it was turned off', async () => {
    mockFetch(undefined, () => ({
      ok: false,
      status: 503,
      json: { error: 'AI review is switched off', reason: 'disabled' },
    }))
    render(<PromptComposer />)
    typeTask('Write a haiku')
    const button = await screen.findByRole('button', {
      name: /review with ai/i,
    })
    await waitFor(() => expect(button).toBeEnabled())

    fireEvent.click(button)

    expect(await screen.findByText(/switched off for now/i)).toBeInTheDocument()
  })

  // A body that never finishes on its own, and rejects its pending read when
  // the request is aborted, as fetch does.
  function hangingFetch() {
    const fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { json: async () => ({ enabled: true }) }
      const signal = init.signal!
      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: () =>
              new Promise((_, reject) =>
                signal.addEventListener('abort', () =>
                  reject(new DOMException('Aborted', 'AbortError'))
                )
              ),
          }),
        },
      }
    })
    Object.assign(globalThis, { fetch: fetchMock })
  }

  async function startHangingReview() {
    hangingFetch()
    await renderComposer()
    typeTask('Write a haiku')
    const button = screen.getByRole('button', { name: /review with ai/i })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await screen.findByText(/reviewing your prompt/i)
  }

  it('reports a stopped review as cancelled', async () => {
    await startHangingReview()

    fireEvent.click(screen.getByRole('button', { name: /stop/i }))

    expect(await screen.findByText('Review cancelled.')).toBeInTheDocument()
  })

  it('leaves a clean panel when Clear interrupts a review', async () => {
    await startHangingReview()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    })

    // The aborted request settles after the reset. It must not write back.
    expect(screen.queryByText('Review cancelled.')).not.toBeInTheDocument()
    expect(screen.queryByText(/reviewing your prompt/i)).not.toBeInTheDocument()
  })

  it('does not present an interrupted stream as a finished review', async () => {
    mockFetch(undefined, () => ({
      ok: true,
      status: 200,
      body: reviewStream(REVIEW, {
        type: 'error',
        error: 'Upstream stream failed',
      }),
    }))
    render(<PromptComposer />)
    typeTask('Write a haiku')
    const button = await screen.findByRole('button', {
      name: /review with ai/i,
    })
    await waitFor(() => expect(button).toBeEnabled())

    await act(async () => fireEvent.click(button))

    expect(
      await screen.findByText(/review was interrupted/i)
    ).toBeInTheDocument()
    expect(screen.queryByText(/review complete/i)).not.toBeInTheDocument()
  })
})
