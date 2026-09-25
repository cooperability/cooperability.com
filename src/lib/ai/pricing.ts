import type Anthropic from '@anthropic-ai/sdk'

// USD per million tokens for CRITIQUE_MODEL (claude-sonnet-5), first-party
// API rates. A dollar per million tokens is exactly a micro-dollar per token,
// so every figure below doubles as micro-USD per token and the ledger can
// stay in integers.
//
// Change these together with CRITIQUE_MODEL in client.ts. The budget is only
// as honest as this table.
export const PRICE_PER_MTOK = {
  input: 2,
  output: 10,
  // Cache writes bill at 1.25x input and reads at 0.1x. The route does not
  // cache: the system prompt (about 1,100 tokens) sits at Sonnet 5's
  // 1,024-token minimum, and at this site's traffic most requests would pay
  // the write premium for a read that never comes within the 5-minute TTL.
  // Pricing both keeps the meter correct if that changes.
  cacheWrite: 2.5,
  cacheRead: 0.2,
} as const

export type Usage = Pick<
  Anthropic.Usage,
  | 'input_tokens'
  | 'output_tokens'
  | 'cache_creation_input_tokens'
  | 'cache_read_input_tokens'
>

export function costMicroUsd(usage: Partial<Usage>): number {
  return Math.ceil(
    (usage.input_tokens ?? 0) * PRICE_PER_MTOK.input +
      (usage.output_tokens ?? 0) * PRICE_PER_MTOK.output +
      (usage.cache_creation_input_tokens ?? 0) * PRICE_PER_MTOK.cacheWrite +
      (usage.cache_read_input_tokens ?? 0) * PRICE_PER_MTOK.cacheRead
  )
}

export function microToUsd(micro: number): number {
  return micro / 1_000_000
}

export function usdToMicro(usd: number): number {
  return Math.round(usd * 1_000_000)
}
