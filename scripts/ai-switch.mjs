#!/usr/bin/env node
// Turns the Prompt Composer's AI review off or on without a redeploy, and
// reports what it has spent this period.
//
//   pnpm ai:status
//   pnpm ai:off "plan running low"
//   pnpm ai:on
//
// Reads the shared store's credentials from the environment, the same
// variables production uses. `vercel env pull .env.local` fetches them, and
// the package scripts load that file when it exists. See docs/AI-Review.md.

const OFF_FLAG_KEY = 'ai:review:off' // src/lib/ai/switch.ts

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

if (!url || !token) {
  console.error(
    'No shared store configured. Set UPSTASH_REDIS_REST_URL and ' +
      'UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN), ' +
      'for example with `vercel env pull .env.local`.\n' +
      'Without a store, the only switch is AI_REVIEW_ENABLED=false in the ' +
      'Vercel project, followed by a redeploy.'
  )
  process.exit(1)
}

async function redis(command) {
  const res = await fetch(url.replace(/\/+$/, ''), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) {
    throw new Error(`Upstash ${res.status}: ${body.error ?? res.statusText}`)
  }
  return body.result
}

// Mirrors periodOf in src/lib/ai/budget.ts. UTC throughout.
function periodKeys(date = new Date()) {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const pad = (n) => String(n).padStart(2, '0')
  const day = new Date(Date.UTC(y, m, date.getUTCDate()))
  const monday = new Date(day)
  monday.setUTCDate(day.getUTCDate() - (day.getUTCDay() || 7) + 1)
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()
  const week =
    Math.floor((thursday - Date.UTC(isoYear, 0, 1)) / (7 * 86_400_000)) + 1
  return {
    month: `ai:spend:${y}-${pad(m + 1)}`,
    week: `ai:spend:${isoYear}-W${pad(week)}`,
  }
}

const usd = (micro) => `$${(Number(micro ?? 0) / 1_000_000).toFixed(4)}`

async function status() {
  const flag = await redis(['GET', OFF_FLAG_KEY])
  const keys = periodKeys()
  const [month, week] = await Promise.all([
    redis(['GET', keys.month]),
    redis(['GET', keys.week]),
  ])
  const window = process.env.AI_BUDGET_WINDOW === 'week' ? 'week' : 'month'
  console.log(`AI review:   ${flag ? `OFF (${flag})` : 'on'}`)
  if (process.env.AI_REVIEW_ENABLED) {
    console.log(
      `Env switch:  AI_REVIEW_ENABLED=${process.env.AI_REVIEW_ENABLED}`
    )
  }
  console.log(`Spend key:   ${window} (AI_BUDGET_WINDOW)`)
  console.log(
    `This month:  ${usd(month)}${window === 'month' ? '' : ' (not tracked)'}`
  )
  console.log(
    `This week:   ${usd(week)}${window === 'week' ? '' : ' (not tracked)'}`
  )
  if (process.env.AI_BUDGET_USD) {
    console.log(`Budget:      $${process.env.AI_BUDGET_USD} per ${window}`)
  }
}

const [command, ...reason] = process.argv.slice(2)

try {
  if (command === 'off') {
    const note = `${new Date().toISOString()} ${reason.join(' ') || 'manual'}`
    await redis(['SET', OFF_FLAG_KEY, note])
    console.log('AI review switched OFF. Takes effect within 15 seconds.')
  } else if (command === 'on') {
    await redis(['DEL', OFF_FLAG_KEY])
    console.log('AI review switched ON. Takes effect within 15 seconds.')
  } else if (command !== 'status') {
    console.error('Usage: ai-switch.mjs <on|off|status> [reason]')
    process.exit(2)
  }
  await status()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
