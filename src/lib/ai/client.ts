import Anthropic from '@anthropic-ai/sdk'

// The cheaper of the two models docs/Roadmap.md lists. Opus pricing is not
// worth it for a critique anyone on the internet can trigger.
export const CRITIQUE_MODEL = 'claude-sonnet-5'

let client: Anthropic | undefined

// Returns null rather than throwing so the route can answer 503 when the key
// is absent (local dev, preview deploys) instead of a 500 with a stack trace.
export function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  client ??= new Anthropic()
  return client
}
